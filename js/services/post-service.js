/* =========================================================
   POST SERVICE — community feed (branch-aware & general)
   Persisted state (Store key "posts"): created posts, edits, deleted,
   hidden, reported. Likes live in Store key "likes".
========================================================= */
const FEED_FILTERS = ['all', 'my_branch', 'general', 'announcement', 'community', 'event', 'news'];

function _postState() { return Store.get('posts', { created: [], edits: {}, deleted: [], hidden: [], reported: [] }); }
function _likeState() { return Store.get('likes', { posts: [], comments: [] }); }

function _decoratePost(p, st, likes) {
  const author = getAuthor(p.authorId) || { id: p.authorId, name: 'Former member', branch: '', photo: '' };
  const liked = likes.posts.includes(p.id);
  const audience = p.audience || (p.branchId ? 'branch' : 'general');
  return {
    ...p, author, liked,
    audience,
    branchId: p.branchId || (audience === 'branch' ? author.branchId : null),
    branchName: p.branchName || (audience === 'branch' ? author.branch : null),
    content: Object.prototype.hasOwnProperty.call(st.edits, p.id) ? st.edits[p.id] : p.content,
    edited: Object.prototype.hasOwnProperty.call(st.edits, p.id) || !!p.edited,
    likeCount: (p.likes || 0) + (liked ? 1 : 0),
    commentCount: countComments(p.id),
    isMine: p.authorId === MOCK.currentUserId
  };
}

/**
 * Filter options:
 * - 'all': General posts + branch posts from all branches + official announcements + news
 * - 'my_branch': Only posts belonging to the logged-in member's branch
 * - 'general': Only posts explicitly published to the general community (audience === 'general' or official)
 * - 'announcement', 'community', 'event', 'news': category filter
 */
function getPosts({ filter = 'all', query = '', branchId = null, memberId = null } = {}) {
  const st = _postState(), likes = _likeState(), q = query.trim().toLowerCase();
  const me = getProfile();

  return [...st.created, ...MOCK.posts]
    .filter(p => !st.deleted.includes(p.id) && !st.hidden.includes(p.id))
    .map(p => _decoratePost(p, st, likes))
    .filter(p => {
      if (memberId) return p.authorId === memberId;
      if (branchId) return p.audience === 'branch' && (p.branchId === branchId || p.branchName === (getBranch(branchId) || {}).name);
      if (filter === 'all') return true;
      if (filter === 'my_branch') {
        const myBr = me.branchId || me.branch;
        return p.audience === 'branch' && (p.branchId === myBr || p.branchName === me.branch);
      }
      if (filter === 'general') {
        return p.audience === 'general' || p.official || !p.branchId;
      }
      return p.category === filter;
    })
    .filter(p => !q || [p.content, p.title, p.author.name, p.author.branch, p.branchName, p.category].some(v => (v || '').toLowerCase().includes(q)))
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getGeneralFeed({ query = '' } = {}) {
  return getPosts({ filter: 'general', query });
}

function getBranchFeed(branchId, { query = '' } = {}) {
  return getPosts({ branchId, query });
}

function getPersonalFeed(memberId) {
  return getPosts({ memberId });
}

function getPost(id) {
  const st = _postState(), likes = _likeState();
  const raw = [...st.created, ...MOCK.posts].find(p => p.id === id);
  return raw && !st.deleted.includes(id) ? _decoratePost(raw, st, likes) : undefined;
}
function getLatestNews(limit = 2) { return getPosts({ filter: 'news' }).slice(0, limit); }

function createPost({ content = '', images = [], category = 'community', audience = 'branch', branchId = null, branchName = null }) {
  const text = content.trim();
  if (!text && !images.length) throw new Error('EMPTY_POST');
  const st = _postState();
  const me = getProfile();
  
  const finalAudience = audience === 'general' ? 'general' : 'branch';
  const finalBranchId = finalAudience === 'branch' ? (branchId || me.branchId || 'b1') : null;
  const finalBranchName = finalAudience === 'branch' ? (branchName || me.branch || 'Ogugu Central Branch') : null;

  const post = {
    id: 'up' + Date.now(),
    authorId: MOCK.currentUserId,
    category,
    audience: finalAudience,
    branchId: finalBranchId,
    branchName: finalBranchName,
    createdAt: Date.now(),
    likes: 0,
    content: text,
    images
  };
  st.created.unshift(post);
  if (!Store.set('posts', st)) throw new Error('STORAGE_FULL');
  return getPost(post.id);
}
function updatePost(id, content) {
  const p = getPost(id);
  if (!p || !p.isMine) throw new Error('NOT_ALLOWED');
  const st = _postState();
  const own = st.created.find(x => x.id === id);
  if (own) { own.content = content.trim(); own.edited = true; } else st.edits[id] = content.trim();
  Store.set('posts', st);
  return getPost(id);
}
function deletePost(id) {
  const p = getPost(id);
  if (!p || !p.isMine) throw new Error('NOT_ALLOWED');
  const st = _postState();
  if (st.created.some(x => x.id === id)) st.created = st.created.filter(x => x.id !== id); else st.deleted.push(id);
  Store.set('posts', st);
}
function hidePost(id) { const st = _postState(); if (!st.hidden.includes(id)) st.hidden.push(id); Store.set('posts', st); }
function reportPost(id) { const st = _postState(); if (!st.reported.includes(id)) st.reported.push(id); Store.set('posts', st); }

function isPostLiked(id) { return _likeState().posts.includes(id); }
function likePost(id) { const l = _likeState(); if (!l.posts.includes(id)) l.posts.push(id); Store.set('likes', l); return getPost(id); }
function unlikePost(id) { const l = _likeState(); l.posts = l.posts.filter(x => x !== id); Store.set('likes', l); return getPost(id); }

/** Numbers for Home "Community Pulse" — all derived, never hard-coded */
function getCommunityPulse() {
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  return {
    newMembers: getNewMemberCount(),
    events: getEvents('upcoming').length,
    updates: getAnnouncements().filter(a => a.unread).length + getPosts().filter(p => p.createdAt > dayAgo).length
  };
}
