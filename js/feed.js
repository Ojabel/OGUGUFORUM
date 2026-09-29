/* =========================================================
   FEED UI — community posts, likes, comments, replies, share,
   composer, post menu, media grid. Talks only to services
   (post-service / comment-service), never to MOCK or Store.
========================================================= */
const Feed = (() => {
  const $ = UI.$, esc = UI.esc;
  const FILTER_LABELS = { all: 'All', my_branch: 'My Branch', general: 'General Community', announcement: 'Announcements', community: 'Community', event: 'Events', news: 'News' };
  const CATEGORY_LABEL = { announcement: 'Announcement', community: 'Community', event: 'Event', news: 'News' };
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  let filter = 'all', query = '', reqId = 0, firstLoad = true;
  let shareTarget = null, editingId = null, pendingImages = [];
  const inlineOpen = new Set();

  /* ---------------- rendering ---------------- */
  function mediaHtml(p) {
    const imgs = p.images || []; const n = imgs.length; if (!n) return '';
    const cells = imgs.slice(0, 4).map((src, i) => {
      const more = n > 4 && i === 3 ? `<span class="media-more">+${n - 4}</span>` : '';
      return `<button type="button" class="media-cell" data-media data-index="${i}" aria-label="View photo ${i + 1} of ${n}"><img src="${esc(src)}" alt="" loading="lazy">${more}</button>`;
    }).join('');
    return `<div class="media media-${Math.min(n, 4)}">${cells}</div>`;
  }

  function postHtml(p) {
    const a = p.author;
    const isBranchPost = p.audience === 'branch';
    const badgeText = isBranchPost ? (p.branchName || a.branch || 'Branch Post') : 'General Community';
    const badgeClass = isBranchPost ? 'post-audience-badge branch' : 'post-audience-badge general';
    
    return `<article class="post ${a.verified ? 'post-official' : ''}" data-post-id="${p.id}">
      <header class="post-head">
        <button type="button" class="avatar-author-btn" data-member-id="${a.id}" aria-label="View profile of ${esc(a.name)}">${UI.avatar(a, 'md')}</button>
        <div class="post-who">
          <p class="post-name"><button type="button" class="name-author-btn" data-member-id="${a.id}">${esc(a.name)}</button>${a.verified ? '<span class="verified" role="img" aria-label="Verified account">✓</span>' : ''}</p>
          <p class="post-sub">${esc(a.branch)} &middot; <time>${UI.timeAgo(p.createdAt)}</time>${p.edited ? ' &middot; Edited' : ''}</p>
        </div>
        <div class="post-menu-wrap"><button type="button" class="post-menu-btn" data-post-menu aria-label="Post options" aria-haspopup="menu" aria-expanded="false">&#8943;</button></div>
      </header>
      <div class="post-audience-bar">
        <span class="${badgeClass}">${esc(badgeText)}</span>
        ${a.verified ? `<span class="official-tag">${esc(CATEGORY_LABEL[p.category] || 'Announcement')}</span>` : ''}
      </div>
      ${p.title ? `<h3 class="post-title">${esc(p.title)}</h3>` : ''}
      ${p.content ? `<p class="post-body">${UI.multiline(p.content)}</p>` : ''}
      ${mediaHtml(p)}
      <div class="post-stats">
        <span data-like-count>${p.likeCount} ${p.likeCount === 1 ? 'Like' : 'Likes'}</span>
        <button type="button" class="stat-link" data-comment-open data-comment-count>${p.commentCount} ${p.commentCount === 1 ? 'Comment' : 'Comments'}</button>
      </div>
      <div class="post-actions">
        <button type="button" class="post-action ${p.liked ? 'liked' : ''}" data-like aria-pressed="${p.liked}"><span aria-hidden="true">${p.liked ? '♥' : '♡'}</span> <span data-like-label>${p.liked ? 'Liked' : 'Like'}</span></button>
        <button type="button" class="post-action" data-comment-open>Comment</button>
        <button type="button" class="post-action" data-share-open>Share</button>
      </div>
      <div class="comments-inline" hidden></div>
    </article>`;
  }

  function commentHtml(c, isReply) {
    return `<div class="comment ${isReply ? 'comment-reply' : ''}" data-comment-id="${c.id}">
      <button type="button" class="avatar-author-btn" data-member-id="${c.author.id}" aria-label="View profile of ${esc(c.author.name)}">${UI.avatar(c.author, 'sm')}</button>
      <div class="comment-main">
        <div class="comment-bubble">
          <p class="comment-name"><button type="button" class="name-author-btn" data-member-id="${c.author.id}">${esc(c.author.name)}</button>${c.author.branch ? `<span class="comment-branch">${esc(c.author.branch)}</span>` : ''}</p>
          <p class="comment-text">${UI.multiline(c.content)}</p>
        </div>
        <div class="comment-meta">
          <span>${UI.timeAgo(c.createdAt)}</span>
          <button type="button" class="link-btn ${c.liked ? 'liked' : ''}" data-comment-like aria-pressed="${c.liked}">${c.liked ? 'Liked' : 'Like'}</button>
          <button type="button" class="link-btn" data-reply>Reply</button>
          ${c.likeCount ? `<span class="comment-likes">${c.likeCount} ${c.likeCount === 1 ? 'like' : 'likes'}</span>` : ''}
        </div>
      </div>
    </div>`;
  }
  function threadHtml(postId) {
    const list = getComments(postId);
    if (!list.length) return '<p class="no-comments">No comments yet. Be the first to comment.</p>';
    return list.map(c => commentHtml(c) + c.replies.map(r => commentHtml(r, true)).join('')).join('');
  }
  function commentsBlock(postId) {
    const me = getMember(getCurrentUserId());
    return `<div class="comments" data-comments-for="${postId}">
      <div class="comment-list">${threadHtml(postId)}</div>
      <form class="comment-form" data-comment-form="${postId}">
        <div class="reply-chip" hidden><span></span><button type="button" data-reply-cancel aria-label="Cancel reply">&#10005;</button></div>
        <div class="comment-form-row">
          ${UI.avatar(me, 'sm')}
          <input type="text" class="comment-input" placeholder="Write a comment..." aria-label="Write a comment" maxlength="500" autocomplete="off">
          <button type="submit" class="comment-send">Send</button>
        </div>
      </form>
    </div>`;
  }

  /* ---------------- feed list ---------------- */
  function mount(outlet) {
    const me = getMember(getCurrentUserId());
    outlet.innerHTML = `
      <div class="composer-prompt">${UI.avatar(me, 'md')}<button type="button" class="composer-btn" data-action="create-post">What's on your mind, ${esc(me.name.split(' ')[0])}?</button></div>
      <div class="filter-row" id="feedFilters" role="group" aria-label="Filter posts">
        ${Object.keys(FILTER_LABELS).map(k => `<button type="button" class="filter-chip ${k === filter ? 'active' : ''}" data-feed-filter="${k}" aria-pressed="${k === filter}">${FILTER_LABELS[k]}</button>`).join('')}
      </div>
      <div id="feedList" class="feed-list"></div>`;
    return load();
  }

  async function load() {
    const list = $('feedList'); if (!list) return;
    const id = ++reqId;
    try {
      if (firstLoad) { list.innerHTML = UI.skeleton('post', 2); await new Promise(r => setTimeout(r, 250)); firstLoad = false; }
      const posts = await Promise.resolve(getPosts({ filter, query }));
      if (id !== reqId || !$('feedList')) return;
      if (!posts.length) {
        list.innerHTML = query
          ? UI.emptyState({ title: 'No posts match your search.', text: 'Try a different name, branch or word.' })
          : UI.emptyState({ title: filter === 'all' ? 'No posts yet.' : `No ${FILTER_LABELS[filter].toLowerCase()} posts yet.`, text: 'Be the first to share something with the community.', actionLabel: 'Create Post', action: 'create-post' });
        return;
      }
      list.innerHTML = posts.map(postHtml).join('');
      inlineOpen.forEach(pid => { const art = list.querySelector(`[data-post-id="${pid}"]`); if (art) expandInline(art, pid); });
    } catch (e) {
      if (id === reqId && $('feedList')) $('feedList').innerHTML = UI.errorState('Something went wrong loading the feed.', 'feed');
    }
  }
  function setFilter(f) { filter = f in FILTER_LABELS ? f : 'all'; }
  function resetFilters() { filter = 'all'; query = ''; }
  function setQuery(q) { query = q; if ($('feedList')) load(); }
  function getQuery() { return query; }

  function syncFilterChips() {
    document.querySelectorAll('#feedFilters .filter-chip').forEach(c => { const on = c.dataset.feedFilter === filter; c.classList.toggle('active', on); c.setAttribute('aria-pressed', on); });
  }

  /* update counters + like button in every rendered copy of a post */
  function syncPost(postId) {
    const p = getPost(postId); if (!p) return;
    document.querySelectorAll(`[data-post-id="${postId}"]`).forEach(art => {
      const btn = art.querySelector('[data-like]');
      btn.classList.toggle('liked', p.liked); btn.setAttribute('aria-pressed', p.liked);
      btn.firstElementChild.textContent = p.liked ? '♥' : '♡';
      btn.querySelector('[data-like-label]').textContent = p.liked ? 'Liked' : 'Like';
      art.querySelector('[data-like-count]').textContent = `${p.likeCount} ${p.likeCount === 1 ? 'Like' : 'Likes'}`;
      art.querySelector('[data-comment-count]').textContent = `${p.commentCount} ${p.commentCount === 1 ? 'Comment' : 'Comments'}`;
    });
  }
  function refreshThread(postId) {
    document.querySelectorAll(`.comments[data-comments-for="${postId}"] .comment-list`).forEach(el => { el.innerHTML = threadHtml(postId); });
  }

  /* ---------------- comments: inline (desktop) / sheet (mobile) ---------------- */
  function expandInline(article, postId) {
    const box = article.querySelector('.comments-inline');
    box.innerHTML = commentsBlock(postId); box.hidden = false; inlineOpen.add(postId);
  }
  function toggleInline(article, postId) {
    const box = article.querySelector('.comments-inline');
    if (!box.hidden) { box.hidden = true; box.innerHTML = ''; inlineOpen.delete(postId); return; }
    expandInline(article, postId);
    const input = box.querySelector('.comment-input'); if (input) input.focus({ preventScroll: true });
  }
  function openSheet(postId) {
    const p = getPost(postId); if (!p) { UI.toast('This post is no longer available'); return; }
    $('commentsTitle').textContent = `${p.author.name}'s post`;
    $('commentsBody').innerHTML = postHtml(p).replace('<div class="comments-inline" hidden></div>', '') + commentsBlock(postId);
    UI.openModal('modal-comments');
  }
  /** opens a post's comments: inline in the feed on desktop, bottom sheet otherwise */
  function openPost(postId, { sheet = false } = {}) {
    const p = getPost(postId);
    if (!p) { UI.toast('This post is no longer available'); if (/\/post\//.test(location.hash)) replaceRoute('community/feed'); return; }
    const art = document.querySelector(`#feedList [data-post-id="${postId}"]`);
    if (!sheet && isDesktop() && art) {
      if (art.querySelector('.comments-inline').hidden) expandInline(art, postId);
      art.scrollIntoView({ block: 'center' });
    } else openSheet(postId);
  }

  /* ---------------- share ---------------- */
  const postUrl = (id) => location.href.split('#')[0] + '#/community/post/' + id;
  function openShare(postId) { shareTarget = postId; UI.openModal('modal-share'); }
  async function doShare(kind) {
    const p = getPost(shareTarget); if (!p) return;
    const url = postUrl(p.id), text = `${p.author.name}: ${(p.title || p.content || '').slice(0, 80)}`;
    if (kind === 'whatsapp') { window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener'); UI.closeModal(); return; }
    if (kind === 'native' && navigator.share) {
      try { await navigator.share({ title: 'Ogugu United Forum', text, url }); UI.closeModal(); } catch (e) { /* user cancelled */ }
      return;
    }
    const ok = await UI.copyText(url);
    UI.closeModal();
    UI.toast(ok ? 'Link copied' : 'Could not copy the link');
  }

  /* ---------------- composer (create / edit) ---------------- */
  function resizeImage(file, max = 900) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function renderPreviews() {
    $('postPreviews').innerHTML = pendingImages.map((src, i) => `<div class="preview"><img src="${src}" alt="Selected photo ${i + 1}"><button type="button" data-remove-preview="${i}" aria-label="Remove photo ${i + 1}">&#10005;</button></div>`).join('');
    updateComposerState();
  }
  function updateComposerState() {
    const len = $('postText').value.length;
    $('postCount').textContent = `${len}/1000`;
    $('postSubmit').disabled = !($('postText').value.trim() || pendingImages.length);
  }
  function openComposer(editId = null) {
    editingId = editId; pendingImages = [];
    const me = getMember(getCurrentUserId());
    $('composerWho').innerHTML = `${UI.avatar(me, 'md')}<div><p class="post-name">${esc(me.name)}</p><p class="post-sub">${esc(me.branch)}</p></div>`;
    
    const audienceSelect = $('postAudienceSelect');
    if (audienceSelect) {
      audienceSelect.parentElement.hidden = !!editId;
      audienceSelect.innerHTML = `
        <option value="branch">My Branch — ${esc(me.branch)}</option>
        <option value="general">General Community</option>
      `;
      audienceSelect.value = 'branch';
    }

    $('postModalTitle').textContent = editId ? 'Edit Post' : 'Create Post';
    $('postSubmit').textContent = editId ? 'Save' : 'Post';
    $('attachBtn').hidden = !!editId;
    $('postText').value = editId ? (getPost(editId) || {}).content || '' : '';
    renderPreviews();
    UI.openModal('modal-post');
  }
  async function submitComposer(e) {
    e.preventDefault();
    const text = $('postText').value;
    const audience = $('postAudienceSelect') ? $('postAudienceSelect').value : 'branch';
    try {
      if (editingId) { updatePost(editingId, text); UI.toast('Post updated'); }
      else { createPost({ content: text, images: pendingImages, audience }); UI.toast('Post published'); }
    } catch (err) {
      UI.toast(err.message === 'STORAGE_FULL' ? 'Could not save. browser storage is full. Try a smaller photo.' : err.message === 'EMPTY_POST' ? 'Write something or add a photo first.' : 'Something went wrong. Please try again.');
      return;
    }
    const wasEditing = editingId; editingId = null; pendingImages = [];
    UI.closeModal();
    if (!wasEditing) { resetFilters(); syncFilterChips(); }
    if ($('feedList')) { await load(); if (!wasEditing) window.scrollTo(0, 0); }
    else navigate('community/feed');
  }

  /* ---------------- post menu ---------------- */
  function closeMenus() {
    document.querySelectorAll('.post-menu').forEach(m => m.remove());
    document.querySelectorAll('[data-post-menu][aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  function openMenu(btn, article) {
    const wasOpen = btn.getAttribute('aria-expanded') === 'true';
    closeMenus(); if (wasOpen) return;
    const p = getPost(article.dataset.postId);
    const items = p.isMine ? [['edit', 'Edit'], ['delete', 'Delete']] : [['hide', 'Hide'], ['report', 'Report']];
    const menu = document.createElement('div'); menu.className = 'post-menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML = items.map(([k, l]) => `<button type="button" role="menuitem" data-post-action="${k}" class="${k === 'delete' ? 'danger' : ''}">${l}</button>`).join('');
    btn.parentElement.appendChild(menu); btn.setAttribute('aria-expanded', 'true');
    menu.querySelector('button').focus();
  }
  function removeArticleEverywhere(id) {
    document.querySelectorAll(`#feedList [data-post-id="${id}"]`).forEach(a => a.remove());
    inlineOpen.delete(id);
    if ($('feedList') && !$('feedList').children.length) load();
  }
  async function postAction(kind, id) {
    closeMenus();
    if (kind === 'edit') { openComposer(id); return; }
    if (kind === 'delete') {
      const ok = await UI.confirm({ title: 'Delete post?', message: 'This will permanently remove your post and its comments from your view.', confirmLabel: 'Delete', danger: true });
      if (!ok) return;
      deletePost(id); removeArticleEverywhere(id); UI.toast('Post deleted');
    } else if (kind === 'hide') { hidePost(id); UI.closeModal(); removeArticleEverywhere(id); UI.toast('Post hidden'); }
    else if (kind === 'report') { reportPost(id); UI.toast('Thanks for reporting. Our team will review this post (mock).'); }
  }

  /* ---------------- events (delegated once) ---------------- */
  function init() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!t.closest('.post-menu-wrap')) closeMenus();

      const chip = t.closest('[data-feed-filter]');
      if (chip) { filter = chip.dataset.feedFilter; syncFilterChips(); load(); return; }

      const retry = t.closest('[data-retry="feed"]'); if (retry) { load(); return; }

      const art = t.closest('[data-post-id]');
      if (art) {
        const id = art.dataset.postId;
        if (t.closest('[data-like]')) { isPostLiked(id) ? unlikePost(id) : likePost(id); syncPost(id); return; }
        if (t.closest('[data-comment-open]')) {
          if (art.closest('#commentsBody')) { const i = document.querySelector('#commentsBody .comment-input'); if (i) i.focus(); return; }
          if (isDesktop()) toggleInline(art, id); else openSheet(id);
          return;
        }
        if (t.closest('[data-share-open]')) { openShare(id); return; }
        const menuBtn = t.closest('[data-post-menu]'); if (menuBtn) { openMenu(menuBtn, art); return; }
        const act = t.closest('[data-post-action]'); if (act) { postAction(act.dataset.postAction, id); return; }
        const media = t.closest('[data-media]');
        if (media) {
          const p = getPost(id);
          UI.openLightbox(p.images.map(src => ({ image: src, caption: `${p.author.name}${p.content ? ': ' + p.content.slice(0, 90) : ''}` })), parseInt(media.dataset.index, 10));
          return;
        }
      }

      const wrap = t.closest('.comments');
      if (wrap) {
        const postId = wrap.dataset.commentsFor;
        const c = t.closest('[data-comment-id]');
        if (c && t.closest('[data-comment-like]')) {
          const id = c.dataset.commentId;
          (t.closest('[data-comment-like]').getAttribute('aria-pressed') === 'true') ? unlikeComment(id) : likeComment(id);
          refreshThread(postId); return;
        }
        if (c && t.closest('[data-reply]')) {
          const form = wrap.querySelector('.comment-form');
          const name = c.querySelector('.comment-name').firstChild.textContent;
          form.dataset.parent = c.dataset.commentId;
          const chipEl = form.querySelector('.reply-chip'); chipEl.hidden = false; chipEl.firstElementChild.textContent = `Replying to ${name}`;
          const input = form.querySelector('.comment-input'); input.placeholder = `Reply to ${name}...`; input.focus(); return;
        }
        if (t.closest('[data-reply-cancel]')) { resetReply(wrap.querySelector('.comment-form')); return; }
      }

      const share = t.closest('[data-share]'); if (share) { doShare(share.dataset.share); return; }
      if (t.closest('#attachBtn')) { $('postImages').click(); return; }
      const rm = t.closest('[data-remove-preview]'); if (rm) { pendingImages.splice(parseInt(rm.dataset.removePreview, 10), 1); renderPreviews(); return; }
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });

    document.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-comment-form]');
      if (!form) return;
      e.preventDefault();
      const postId = form.dataset.commentForm, input = form.querySelector('.comment-input');
      if (!input.value.trim()) return;
      try {
        const c = addComment(postId, input.value, form.dataset.parent || null);
        refreshThread(postId); syncPost(postId);
        input.value = ''; resetReply(form);
        const el = document.querySelector(`.comments[data-comments-for="${postId}"] [data-comment-id="${c.id}"]`);
        if (el) el.scrollIntoView({ block: 'nearest' });
      } catch (err) { UI.toast(err.message === 'STORAGE_FULL' ? 'Could not save your comment. storage is full.' : 'Could not post your comment.'); }
    });

    $('postForm').addEventListener('submit', submitComposer);
    $('postText').addEventListener('input', updateComposerState);
    $('postImages').addEventListener('change', async (e) => {
      const files = [...e.target.files].slice(0, 4 - pendingImages.length);
      for (const f of files) { try { pendingImages.push(await resizeImage(f)); } catch (err) { UI.toast('That photo could not be read.'); } }
      e.target.value = ''; renderPreviews();
    });

    UI.onModalClose(() => { if (/#\/community\/post\//.test(location.hash)) replaceRoute('community/feed'); });
  }
  function resetReply(form) {
    delete form.dataset.parent; form.querySelector('.reply-chip').hidden = true;
    form.querySelector('.comment-input').placeholder = 'Write a comment...';
  }

  return { init, mount, load, setFilter, resetFilters, setQuery, getQuery, syncFilterChips, openPost, openComposer, syncPost, postHtml };
})();
