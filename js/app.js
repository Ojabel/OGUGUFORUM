/* =========================================================
   APP — routing, screen rendering, global actions.
   Every screen reads through services (getX()); nothing here
   touches MOCK or localStorage directly.
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const $ = UI.$, esc = UI.esc;
  const appEl = $('app');
  const fmtNaira = (n) => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n) => '₦' + Math.abs(n).toLocaleString('en-NG');
  const CATEGORY_LABEL = { announcement: 'Announcement', community: 'Community', event: 'Event', news: 'News' };

  function go(path) {           // navigate, and re-run the route if the hash would not change
    if (location.hash === '#/' + path) handleRoute(parseRoute()); else navigate(path);
  }

  /* =========================================================
     PROFILE BINDINGS & EDITING
  ========================================================= */
  let newPhotoDataUrl = null;

  function bindProfile() {
    const p = getProfile();
    document.querySelectorAll('[data-bind="fullName"]').forEach(el => { el.textContent = p.name.toUpperCase(); });
    document.querySelectorAll('[data-bind="membershipId"]').forEach(el => { el.textContent = p.id; });
    $('greetingName').textContent = (p.firstName || p.name.split(' ')[0]).toUpperCase();
    const h = new Date().getHours();
    $('greetingEyebrow').textContent = h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
    
    if ($('headerAvatar')) $('headerAvatar').src = p.photo || 'assets/profile-1.jpeg';
    if ($('profileViewPhoto')) $('profileViewPhoto').src = p.photo || 'assets/profile-1.jpeg';
  }

  function renderProfileView() {
    const p = getProfile();
    $('profileViewName').textContent = p.name;
    
    const rows = [
      `<div><span>Membership ID</span><p>${esc(p.id)}</p></div>`,
      `<div><span>Branch</span><p>${esc(p.branch)}</p></div>`,
      `<div><span>Status</span><p class="status-pill">${esc(p.status.toUpperCase())}</p></div>`,
      `<div><span>Member since</span><p>${esc(p.memberSince)}</p></div>`,
      `<div><span>Occupation</span><p>${esc(p.occupation || 'Not specified')}${p.company ? ` at ${esc(p.company)}` : ''}</p></div>`,
      `<div><span>Gender / DOB</span><p>${esc(p.gender || 'Not specified')}${p.dob ? ` &middot; ${esc(p.dob)}` : ''}</p></div>`,
      `<div><span>Marital Status</span><p>${esc(p.maritalStatus || 'Not specified')}${p.maritalStatus === 'Married' && p.spouseName ? ` (Spouse: ${esc(p.spouseName)})` : ''}</p></div>`,
      `<div><span>Location</span><p>${esc(p.location || '')}${p.state ? `, ${esc(p.state)}` : ''}${p.country ? `, ${esc(p.country)}` : ''}</p></div>`,
      `<div><span>Email</span><p>${esc(p.email)}</p></div>`,
      `<div><span>Phone</span><p>${esc(p.phone)}</p></div>`
    ];

    $('profileViewRows').innerHTML = rows.join('');

    // Personal Feed / Community Activity
    const myPosts = getPersonalFeed(p.id);
    const feedEl = $('profileActivityFeed');
    if (feedEl) {
      if (!myPosts.length) {
        feedEl.innerHTML = UI.emptyState({ title: 'No community posts yet.', text: 'Posts you create will appear here on your profile.' });
      } else {
        feedEl.innerHTML = myPosts.map(Feed.postHtml).join('');
      }
    }
  }

  function openProfile() {
    newPhotoDataUrl = null;
    renderProfileView();
    $('profileView').hidden = false;
    $('profileEdit').hidden = true;
    UI.openModal('modal-profile');
  }

  $('editProfileBtn').addEventListener('click', () => {
    const p = getProfile();
    newPhotoDataUrl = null;
    $('editPhotoPreview').src = p.photo || 'assets/profile-1.jpeg';

    const names = p.name.split(' ');
    $('editFirstName').value = p.firstName || names[0] || '';
    $('editMiddleName').value = p.middleName || (names.length > 2 ? names.slice(1, -1).join(' ') : '');
    $('editLastName').value = p.lastName || (names.length > 1 ? names[names.length - 1] : '');

    $('editPhone').value = p.phone || '';
    $('editEmail').value = p.email || '';
    $('editGender').value = p.gender || 'Male';
    $('editDob').value = p.dob || '';
    $('editMaritalStatus').value = p.maritalStatus || 'Single';
    $('editSpouseName').value = p.spouseName || '';
    $('editSpouseNameWrap').hidden = $('editMaritalStatus').value !== 'Married';

    $('editOccupation').value = p.occupation || '';
    $('editCompany').value = p.company || '';
    $('editLocation').value = p.location || '';
    $('editState').value = p.state || '';
    $('editCountry').value = p.country || 'Nigeria';

    const priv = p.privacy || {};
    $('privPhone').value = priv.phone || 'private';
    $('privEmail').value = priv.email || 'private';
    $('privOccupation').value = priv.occupation || 'members';
    $('privMarital').value = priv.maritalStatus || 'members';
    $('privLocation').value = priv.location || 'members';

    $('profileView').hidden = true;
    $('profileEdit').hidden = false;
    $('editFirstName').focus();
  });

  $('editMaritalStatus').addEventListener('change', (e) => {
    $('editSpouseNameWrap').hidden = e.target.value !== 'Married';
  });

  $('changePhotoBtn').addEventListener('click', () => $('editPhotoInput').click());
  $('editPhotoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      // Basic image size validation & resize
      if (file.size > 5 * 1024 * 1024) throw new Error('Photo must be less than 5MB');
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 400;
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * s);
          canvas.height = Math.round(img.height * s);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          newPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          $('editPhotoPreview').src = newPhotoDataUrl;
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    } catch (err) {
      UI.toast(err.message || 'Error reading photo file');
    }
  });

  $('removePhotoBtn').addEventListener('click', () => {
    newPhotoDataUrl = '';
    $('editPhotoPreview').src = 'assets/profile-1.jpeg';
  });

  $('cancelEditProfile').addEventListener('click', () => {
    newPhotoDataUrl = null;
    $('profileView').hidden = false;
    $('profileEdit').hidden = true;
  });

  $('profileEdit').addEventListener('submit', (e) => {
    e.preventDefault();
    const first = $('editFirstName').value.trim();
    const mid = $('editMiddleName').value.trim();
    const last = $('editLastName').value.trim();

    if (!first || !last) {
      UI.toast('First and Last name are required');
      return;
    }

    const fullName = [first, mid, last].filter(Boolean).join(' ');

    const patch = {
      name: fullName,
      firstName: first,
      middleName: mid,
      lastName: last,
      phone: $('editPhone').value.trim(),
      email: $('editEmail').value.trim(),
      gender: $('editGender').value,
      dob: $('editDob').value,
      maritalStatus: $('editMaritalStatus').value,
      spouseName: $('editMaritalStatus').value === 'Married' ? $('editSpouseName').value.trim() : '',
      occupation: $('editOccupation').value.trim(),
      company: $('editCompany').value.trim(),
      location: $('editLocation').value.trim(),
      state: $('editState').value.trim(),
      country: $('editCountry').value.trim(),
      privacy: {
        phone: $('privPhone').value,
        email: $('privEmail').value,
        occupation: $('privOccupation').value,
        maritalStatus: $('privMarital').value,
        location: $('privLocation').value
      }
    };

    if (newPhotoDataUrl !== null) {
      patch.photo = newPhotoDataUrl;
    }

    saveProfile(patch);
    bindProfile();
    renderProfileView();
    
    if (Feed.load) Feed.load();
    $('profileView').hidden = false;
    $('profileEdit').hidden = true;
    UI.toast('Profile updated successfully');
  });

  /* =========================================================
     WALLET
  ========================================================= */
  let balanceVisible = true;
  function syncWallet() {
    const text = balanceVisible ? fmtNaira(getWalletBalance()) : '₦ •••••••';
    document.querySelectorAll('[data-wallet-balance]').forEach(el => { el.textContent = text; });
    document.querySelectorAll('[data-action="toggle-balance"]').forEach(b => {
      b.innerHTML = `<i data-lucide="${balanceVisible ? 'eye-off' : 'eye'}"></i>`;
      b.setAttribute('aria-label', balanceVisible ? 'Hide balance' : 'Show balance'); b.setAttribute('aria-pressed', String(!balanceVisible));
    });
    UI.refreshIcons();
  }
  $('confirmAddMoney').addEventListener('click', () => {
    const input = $('amountInput'), amount = parseFloat(input.value);
    if (!amount || amount <= 0 || amount > 1000000) { UI.toast('Enter an amount between ₦1 and ₦1,000,000'); input.focus(); return; }
    addWalletFunds(amount); syncWallet(); renderTransactions();
    input.value = ''; UI.closeModal();
    UI.toast(`₦${amount.toLocaleString()} added to your wallet (mock)`);
  });

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */
  const panel = $('notifPanel');
  let panelOpener = null;
  function renderNotifications() {
    const list = getNotifications();
    $('notifList').innerHTML = list.length ? list.map(n => `
      <li><button type="button" class="notif-item ${n.unread ? 'unread' : ''}" data-notif-id="${n.id}">
        <span class="notif-text">${esc(n.text)}</span><span class="notif-time">${UI.timeAgo(n.createdAt)}</span>
      </button></li>`).join('') : `<li>${UI.emptyState({ title: "You're all caught up." })}</li>`;
    const c = unreadNotificationCount(), badge = $('notifBadge');
    badge.textContent = c > 99 ? '99+' : String(c); badge.hidden = c === 0;
    $('markAllRead').hidden = c === 0;
  }
  function openPanel() { panelOpener = document.activeElement; renderNotifications(); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); $('closeNotif').focus(); }
  function closePanel() { if (!panel.classList.contains('open')) return false; panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); if (panelOpener && panelOpener.focus) panelOpener.focus({ preventScroll: true }); return true; }
  $('closeNotif').addEventListener('click', closePanel);
  $('markAllRead').addEventListener('click', () => { markAllNotificationsRead(); renderNotifications(); UI.toast('All notifications marked as read'); });
  $('notifList').addEventListener('click', (e) => {
    const item = e.target.closest('[data-notif-id]'); if (!item) return;
    const n = getNotification(item.dataset.notifId); if (!n) return;
    markNotificationRead(n.id); renderNotifications(); closePanel();
    if (n.link) go(n.link);
  });

  /* =========================================================
     ROUTING
  ========================================================= */
  const views = document.querySelectorAll('.view'), navItems = document.querySelectorAll('.nav-item');
  function showView(top) {
    views.forEach(v => v.classList.toggle('active', v.id === `view-${top}`));
    const tab = NAV_TAB[top] || top;
    navItems.forEach(n => { const on = n.dataset.nav === tab; n.classList.toggle('active', on); if (on) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current'); });
  }

  function handleRoute(route) {
    const { top, sub, arg } = route;
    UI.closeModal(); UI.closeLightbox();
    showView(top);
    appEl.classList.toggle('is-chat', top === 'chat');
    appEl.classList.toggle('conv-open', top === 'chat' && !!sub);
    if (top === 'home') renderHome();
    else if (top === 'community') renderCommunity(sub, arg);
    else if (top === 'events') { renderEvents(); if (sub) openEventDetail(sub); }
    else if (top === 'payments') renderTransactions();
    else if (top === 'more') renderMore(sub);
    else if (top === 'chat') Chat.render(sub);
    syncWallet(); Chat.updateBadges(); renderNotifications();
    if (!(top === 'community' && sub === 'post')) window.scrollTo(0, 0);
    UI.refreshIcons();
  }
  UI.onModalClose(() => {
    const h = location.hash;
    if (/^#\/events\/[^/]+$/.test(h)) replaceRoute('events');
    else if (/^#\/community\/members\/[^/]+$/.test(h)) replaceRoute('community/members');
  });

  /* =========================================================
     HOME (all sections rendered from services)
  ========================================================= */
  function eventRowHtml(ev) {
    const reg = isEventRegistered(ev);
    return `<div class="event-row" data-open-event="${ev.id}" role="button" tabindex="0" aria-label="${esc(ev.title)}, details">
      <div class="event-date"><span class="event-day">${ev.day}</span><span class="event-month">${ev.month}</span></div>
      <div class="event-info">
        <p class="event-title">${esc(ev.title)}</p>
        <p class="event-sub">${esc(ev.dateLabel)} &middot; ${esc(ev.location)}</p>
        <button type="button" class="register-btn register-btn-sm ${reg ? 'registered' : ''}" data-register data-event-id="${ev.id}">${reg ? 'Registered ✓' : 'Register'}</button>
      </div></div>`;
  }
  function renderHome() {
    const pulse = getCommunityPulse();
    $('homePulse').innerHTML = [[pulse.newMembers, 'New members'], [pulse.events, 'Events'], [pulse.updates, 'Updates']]
      .map(([n, l]) => `<div class="pulse-stat"><p class="pulse-num">${n}</p><span>${l}</span></div>`).join('');

    const upcoming = getEvents('upcoming');
    const feat = upcoming.find(e => e.headline);
    $('homeHappening').innerHTML = feat ? `
      <h2 class="section-title">What's happening</h2>
      <article class="happening-card" data-open-event="${feat.id}" role="button" tabindex="0" aria-label="${esc(feat.headline)}, details">
        <div class="happening-image"><img src="${esc(feat.image)}" alt="" loading="lazy"><span class="happening-eyebrow">Community update</span></div>
        <div class="happening-body">
          <p class="happening-title">${esc(feat.headline)}</p>
          <p class="happening-text">${esc(feat.summary)}</p>
          <p class="happening-meta">${esc(feat.dateLabel)} &middot; ${esc(feat.location)}</p>
          <div class="happening-footer">
            <div class="mini-avatar-stack">${getNewMembers().slice(0, 3).map(m => UI.avatar(m, 'xs')).join('')}</div>
            <span class="interested-text">${feat.interested} members interested</span>
          </div>
          <button type="button" class="register-btn ${isEventRegistered(feat) ? 'registered' : ''}" data-register data-event-id="${feat.id}">${isEventRegistered(feat) ? 'Registered ✓' : 'Register'}</button>
        </div>
      </article>` : '';

    $('homeEvents').innerHTML = `
      <div class="section-header"><h2 class="section-title">Upcoming Events</h2><button class="view-all" data-nav="events">View all <i data-lucide="arrow-right"></i></button></div>
      ${upcoming.length ? upcoming.slice(0, 2).map(eventRowHtml).join('') : UI.emptyState({ title: 'No events scheduled yet.' })}`;

    const bdays = getBirthdaysToday();
    $('homeBirthdays').innerHTML = `<h2 class="section-title">Today's Birthdays</h2>` + (bdays.length ? `
      <div class="birthday-list">${bdays.map(m => `
        <button type="button" class="birthday-row" data-member-id="${m.id}" aria-label="${esc(m.name)}, birthday today. View profile">
          ${UI.avatar(m, 'md')}
          <span class="birthday-text"><span class="birthday-name">${esc(m.name)}</span><span class="birthday-branch">${esc(m.branch)}</span></span>
          <span class="birthday-wish" aria-hidden="true">🎉</span>
        </button>`).join('')}</div>` : UI.emptyState({ title: 'No birthdays today.' }));

    const fresh = getNewMembers(), shown = fresh.slice(0, 4), extra = Math.max(0, getNewMemberCount() - shown.length);
    $('homeNewMembers').innerHTML = `<h2 class="section-title">Welcome New Members</h2>
      <div class="new-members-row">
        <div class="avatar-stack">${shown.map(m => `<button type="button" class="avatar-btn-sm" data-member-id="${m.id}" aria-label="${esc(m.name)}, new member">${UI.avatar(m, 'md')}</button>`).join('')}${extra ? `<button type="button" class="avatar av-md avatar-more" data-nav="community/members" aria-label="${extra} more new members">+${extra}</button>` : ''}</div>
        <p class="new-members-text">${getNewMemberCount()} new members joined this month</p>
      </div>`;

    const news = getLatestNews(2);
    $('homeNews').innerHTML = `
      <div class="section-header"><h2 class="section-title">Community News</h2><button class="view-all" data-nav-feed="news">View all <i data-lucide="arrow-right"></i></button></div>
      ${news.length ? `<div class="news-list">${news.map(p => `
        <article class="news-card" data-open-post="${p.id}" role="button" tabindex="0" aria-label="${esc(p.title || p.content)}">
          <div class="news-image"><img src="${esc((p.images || [])[0] || '')}" alt="" loading="lazy"></div>
          <p class="news-title">${esc(p.title || p.content.slice(0, 90))}</p>
          <p class="news-meta"><span class="news-tag news-tag-purple">${CATEGORY_LABEL[p.category]}</span> &middot; ${UI.timeAgo(p.createdAt)}</p>
          <span class="read-more">Read story <i data-lucide="arrow-right"></i></span>
        </article>`).join('')}</div>` : UI.emptyState({ title: 'No news yet.' })}`;

    const gal = getGallery().slice(0, 3);
    $('homeGallery').innerHTML = `
      <div class="section-header"><h2 class="section-title">Community Gallery</h2><button class="view-all" data-more="gallery">View all <i data-lucide="arrow-right"></i></button></div>
      ${gal.length ? `<div class="gallery-row">${gal.map((g, i) => `<button type="button" class="gallery-thumb" data-gallery-index="${i}" aria-label="Open photo: ${esc(g.caption)}"><img src="${esc(g.image)}" alt="" loading="lazy"></button>`).join('')}</div>` : UI.emptyState({ title: 'No community photos yet.' })}`;
  }

  /* =========================================================
     COMMUNITY  (feed · members · branches · directory)
  ========================================================= */
  const TABS = ['feed', 'members', 'branches', 'directory'];
  const PLACEHOLDER = { feed: 'Search posts, members, branches...', members: 'Search members...', branches: 'Search branches...', directory: 'Search the directory...' };
  let currentTab = null, memberQuery = '', branchQuery = '', dirQuery = '', dirBranch = '', dirStatus = '';

  const pillClass = (s) => s === 'Active' ? '' : 'pending';
  function memberRow(m) {
    return `<button type="button" class="member-row" data-member-id="${m.id}">
      ${UI.avatar(m, 'md')}
      <span class="member-row-info"><span class="member-row-name">${esc(m.name)}</span><span class="member-row-branch">${esc(m.branch)}</span></span>
      <span class="status-pill ${pillClass(m.status)}">${esc(m.status.toUpperCase())}</span>
    </button>`;
  }
  const membersListHtml = (list) => list.length ? `<div class="member-list">${list.map(memberRow).join('')}</div>` : UI.emptyState({ title: 'No members found.', text: 'Try a different name or branch.' });

  function renderMembersList() { $('peopleList').innerHTML = membersListHtml(getMembers({ query: memberQuery })); }
  function renderBranchList() {
    const q = branchQuery.trim().toLowerCase();
    const list = getBranches().filter(b => !q || b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q));
    $('peopleList').innerHTML = list.length ? `<div class="branch-list">${list.map(b => `
      <button type="button" class="branch-card" data-open-branch="${esc(b.id)}">
        <span class="branch-name">${esc(b.name)}</span><span class="branch-loc">${esc(b.location)}</span><span class="branch-count">${b.members} members</span>
      </button>`).join('')}</div>` : UI.emptyState({ title: 'No branches found.' });
  }
  function renderDirectoryList() {
    const list = getMembers({ query: dirQuery, branch: dirBranch, status: dirStatus });
    if (!list.length) { $('dirResults').innerHTML = UI.emptyState({ title: 'No members match these filters.' }); return; }
    const groups = {}; list.forEach(m => { (groups[m.name[0].toUpperCase()] = groups[m.name[0].toUpperCase()] || []).push(m); });
    $('dirResults').innerHTML = `<p class="result-count">${list.length} ${list.length === 1 ? 'member' : 'members'}</p>` + Object.keys(groups).sort().map(k =>
      `<p class="letter-head">${k}</p><div class="member-list">${groups[k].map(memberRow).join('')}</div>`).join('');
  }
  function mountDirectory() {
    $('peopleList').innerHTML = `
      <div class="filter-selects">
        <label class="select-wrap"><span class="sr-only">Branch</span><select id="dirBranch" aria-label="Filter by branch"><option value="">All branches</option>${getBranches().map(b => `<option value="${esc(b.name)}" ${b.name === dirBranch ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>
        <label class="select-wrap"><span class="sr-only">Status</span><select id="dirStatus" aria-label="Filter by status"><option value="">Any status</option><option value="Active" ${dirStatus === 'Active' ? 'selected' : ''}>Active</option><option value="Pending" ${dirStatus === 'Pending' ? 'selected' : ''}>Pending</option></select></label>
      </div><div id="dirResults"></div>`;
    renderDirectoryList();
  }

  function renderCommunity(sub, arg) {
    const tab = TABS.includes(sub) ? sub : 'feed';
    const outlet = $('communityOutlet'), search = $('communitySearch');
    document.querySelectorAll('#communityTabs .pill-tab').forEach(t => { const on = t.dataset.tab === tab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    search.placeholder = PLACEHOLDER[tab];
    let ready = Promise.resolve();
    if (sub === 'post' && arg) { Feed.resetFilters(); currentTab = null; }   // deep link: show the whole feed so the post is present
    if (tab === 'feed') {
      if (currentTab !== 'feed' || !$('feedList')) { search.value = Feed.getQuery(); ready = Feed.mount(outlet); }
      else ready = Feed.load();
    } else {
      search.value = tab === 'members' ? memberQuery : tab === 'branches' ? branchQuery : dirQuery;
      outlet.innerHTML = '<div id="peopleList"></div>';
      if (tab === 'members') renderMembersList(); else if (tab === 'branches') renderBranchList(); else mountDirectory();
    }
    currentTab = tab;
    if (sub === 'post' && arg) ready.then(() => Feed.openPost(arg));
    if (sub === 'members' && arg) openMember(arg);
  }
  // when the user leaves Community the tab state is remembered but the outlet is rebuilt on return
  $('communityTabs').addEventListener('click', (e) => { const t = e.target.closest('.pill-tab'); if (t) go('community/' + t.dataset.tab); });

  let searchTimer;
  $('communitySearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer); const v = e.target.value;
    searchTimer = setTimeout(() => {
      if (currentTab === 'feed') Feed.setQuery(v);
      else if (currentTab === 'members') { memberQuery = v; renderMembersList(); }
      else if (currentTab === 'branches') { branchQuery = v; renderBranchList(); }
      else if (currentTab === 'directory') { dirQuery = v; renderDirectoryList(); }
    }, 200);
  });
  $('communityOutlet').addEventListener('change', (e) => {
    if (e.target.id === 'dirBranch') { dirBranch = e.target.value; renderDirectoryList(); }
    if (e.target.id === 'dirStatus') { dirStatus = e.target.value; renderDirectoryList(); }
  });

  function openMember(id) {
    const pub = getPublicProfile(id);
    if (!pub) { UI.toast('Member not found'); return; }
    const mine = pub.id === getCurrentUserId();
    const photo = pub.photo || 'assets/profile-1.jpeg';

    const aboutItems = [];
    if (pub.occupation) aboutItems.push(`<div><span>Occupation</span><p>${esc(pub.occupation)}${pub.company ? ` at ${esc(pub.company)}` : ''}</p></div>`);
    if (pub.gender || pub.dob) aboutItems.push(`<div><span>Gender / DOB</span><p>${esc(pub.gender || '')}${pub.dob ? ` &middot; ${esc(pub.dob)}` : ''}</p></div>`);
    if (pub.maritalStatus) aboutItems.push(`<div><span>Marital Status</span><p>${esc(pub.maritalStatus)}${pub.spouseName ? ` (Spouse: ${esc(pub.spouseName)})` : ''}</p></div>`);
    if (pub.location || pub.state || pub.country) aboutItems.push(`<div><span>Location</span><p>${esc(pub.location || '')}${pub.state ? `, ${esc(pub.state)}` : ''}${pub.country ? `, ${esc(pub.country)}` : ''}</p></div>`);

    const contactItems = [];
    contactItems.push(`<div><span>Phone</span><p>${pub.phone ? esc(pub.phone) : '<em class="text-muted">Private</em>'}</p></div>`);
    contactItems.push(`<div><span>Email</span><p>${pub.email ? esc(pub.email) : '<em class="text-muted">Private</em>'}</p></div>`);

    const userPosts = getPersonalFeed(pub.id);
    const postsHtml = userPosts.length
      ? userPosts.map(Feed.postHtml).join('')
      : UI.emptyState({ title: 'No community activity yet.', text: `${esc(pub.name.split(' ')[0])} has not created any posts yet.` });

    UI.openDetail(pub.name, `
      <div class="public-profile-view">
        <div class="public-profile-head">
          <div class="avatar-lg"><img src="${esc(photo)}" alt=""></div>
          <p class="profile-name">${esc(pub.name)}</p>
          <p class="profile-sub">${esc(pub.branch)} &middot; ${esc(pub.membershipId)}</p>
          <span class="status-pill ${pillClass(pub.status)}">${esc(pub.status.toUpperCase())}</span>
        </div>

        <div class="profile-section-title">ABOUT MEMBER</div>
        <div class="profile-rows">
          <div><span>Member since</span><p>${esc(pub.memberSince)}</p></div>
          ${aboutItems.join('')}
        </div>

        <div class="profile-section-title">CONTACT</div>
        <div class="profile-rows">
          ${contactItems.join('')}
        </div>

        <div class="profile-section-title">COMMUNITY ACTIVITY</div>
        <div class="feed-list profile-feed">
          ${postsHtml}
        </div>

        <div class="public-profile-actions">
          ${mine ? '<button class="modal-btn-primary" data-action="open-profile">Edit Profile</button>' : `<button class="modal-btn-primary" data-start-chat="${pub.id}"><i data-lucide="message-circle"></i> Message ${esc(pub.name.split(' ')[0])}</button>`}
        </div>
      </div>`);
    UI.refreshIcons();
  }

  function openBranch(branchId) {
    const b = getBranch(branchId);
    if (!b) { UI.toast('Branch not found'); return; }
    
    const meeting = b.meeting || {
      day: 'Sunday', time: '4:00 PM', venue: 'Branch Hall', address: b.location, city: b.location, state: b.location
    };

    const mapQuery = encodeURIComponent(`${meeting.venue}, ${meeting.address}, ${meeting.city || ''}, ${meeting.state || ''}`);
    const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    const members = getBranchMembers(b.id);
    const branchPosts = getBranchFeed(b.id);

    const membersHtml = members.length
      ? `<div class="branch-members-grid">${members.map(m => `
          <button type="button" class="branch-member-chip" data-member-id="${m.id}">
            ${UI.avatar(m, 'sm')}
            <span class="chip-name">${esc(m.name)}</span>
          </button>`).join('')}</div>`
      : UI.emptyState({ title: 'No members in this branch yet.' });

    const postsHtml = branchPosts.length
      ? branchPosts.map(Feed.postHtml).join('')
      : UI.emptyState({ title: 'No posts from your branch yet.', text: 'Be the first to share an update with your branch members.' });

    UI.openDetail(b.name, `
      <div class="branch-page-view">
        <div class="branch-cover-card">
          ${b.image ? `<img src="${esc(b.image)}" alt="" class="branch-cover-img">` : ''}
          <div class="branch-cover-info">
            <h2>${esc(b.name)}</h2>
            <p class="branch-meta"><i data-lucide="users"></i> ${b.members || members.length} Members &middot; ${esc(b.location)}</p>
            <p class="branch-desc">${esc(b.description || '')}</p>
          </div>
        </div>

        <div class="meeting-box">
          <div class="meeting-box-head">
            <span class="meeting-badge"><i data-lucide="calendar"></i> NEXT BRANCH MEETING</span>
          </div>
          <p class="meeting-time-title">${esc(meeting.day)} &middot; ${esc(meeting.time)}</p>
          <p class="meeting-freq">${esc(meeting.frequency || 'Monthly Meeting')}</p>
          <div class="meeting-venue-info">
            <p class="venue-name"><i data-lucide="map-pin"></i> <strong>${esc(meeting.venue)}</strong></p>
            <p class="venue-address">${esc(meeting.address)}, ${esc(meeting.city)}, ${esc(meeting.state)}</p>
            ${meeting.additionalInfo ? `<p class="venue-note">${esc(meeting.additionalInfo)}</p>` : ''}
          </div>
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="directions-btn">
            <i data-lucide="navigation"></i> Get Directions
          </a>
        </div>

        <div class="profile-section-title">BRANCH POSTS</div>
        <div class="feed-list branch-feed">
          ${postsHtml}
        </div>

        <div class="profile-section-title">BRANCH MEMBERS (${members.length})</div>
        ${membersHtml}
      </div>`);
    UI.refreshIcons();
  }

  /* =========================================================
     EVENTS
  ========================================================= */
  function eventCard(ev) {
    const reg = isEventRegistered(ev);
    return `<article class="happening-card" data-open-event="${ev.id}" role="button" tabindex="0" aria-label="${esc(ev.title)}, details">
      <div class="happening-image"><img src="${esc(ev.image)}" alt="" loading="lazy"></div>
      <div class="happening-body">
        <p class="happening-title">${esc(ev.title)}</p>
        <p class="happening-meta">${esc(ev.dateLabel)} &middot; ${esc(ev.time)} &middot; ${esc(ev.location)}</p>
        ${ev.status === 'upcoming' ? `<button type="button" class="register-btn ${reg ? 'registered' : ''}" data-register data-event-id="${ev.id}">${reg ? 'Registered ✓' : 'Register'}</button>` : `<span class="past-badge">Past event${reg ? ' · You attended' : ''}</span>`}
      </div></article>`;
  }
  function renderEvents() {
    const up = getEvents('upcoming'), past = getEvents('past');
    $('eventsUpcoming').innerHTML = up.length ? up.map(eventCard).join('') : UI.emptyState({ title: 'No events scheduled yet.' });
    $('eventsPast').innerHTML = past.length ? past.map(eventCard).join('') : UI.emptyState({ title: 'No past events yet.' });
  }
  document.querySelectorAll('#view-events [data-event-tab]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('#view-events [data-event-tab]').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
    const up = tab.dataset.eventTab === 'upcoming'; $('eventsUpcoming').hidden = !up; $('eventsPast').hidden = up;
  }));
  function openEventDetail(id) {
    const ev = getEvent(id);
    if (!ev) { UI.toast('Event not found'); replaceRoute('events'); return; }
    const reg = isEventRegistered(ev);
    UI.openDetail(ev.title, `
      <div class="happening-image detail-image"><img src="${esc(ev.image)}" alt=""></div>
      <p class="detail-meta-row"><i data-lucide="calendar"></i> ${esc(ev.dateLabel)} &middot; ${esc(ev.time)}</p>
      <p class="detail-meta-row"><i data-lucide="map-pin"></i> ${esc(ev.location)}</p>
      <p class="detail-meta-row"><i data-lucide="users"></i> Organized by ${esc(ev.organizer)}</p>
      <p class="modal-text" style="margin:14px 0">${esc(ev.description)}</p>
      <div class="modal-actions">
        <button class="modal-btn-secondary" data-share-event="${ev.id}">Share</button>
        ${ev.status === 'upcoming' ? `<button class="modal-btn-primary register-btn ${reg ? 'registered' : ''}" data-register data-event-id="${ev.id}">${reg ? 'Registered ✓' : 'Register'}</button>` : ''}
      </div>`);
    UI.refreshIcons();
  }

  /* =========================================================
     PAYMENTS
  ========================================================= */
  function renderTransactions() {
    const list = getTransactions(), el = $('txnList');
    el.innerHTML = list.length ? list.map(t => `
      <li><button type="button" class="txn-row" data-txn-id="${t.id}">
        <span><span class="txn-title">${esc(t.title)}</span><span class="txn-date">${esc(t.date)}</span></span>
        <span class="txn-right"><span class="txn-amount ${t.amount > 0 ? 'txn-amount-pos' : ''}">${t.amount > 0 ? '+' : '−'}${money(t.amount)}</span><span class="txn-status ${t.status}">${t.status[0].toUpperCase() + t.status.slice(1)}</span></span>
      </button></li>`).join('') : `<li>${UI.emptyState({ title: 'No transactions yet.' })}</li>`;
  }
  function openTransaction(id) {
    const t = getTransaction(id); if (!t) return;
    UI.openDetail('Transaction Details', `
      <div class="profile-rows">
        <div><span>Transaction ID</span><p>${esc(t.id.toUpperCase())}</p></div>
        <div><span>Amount</span><p>${t.amount > 0 ? '+' : '−'}${money(t.amount)}</p></div>
        <div><span>Date</span><p>${esc(t.date)}</p></div>
        <div><span>Type</span><p>${esc(t.type)}</p></div>
        <div><span>Status</span><p class="status-pill">${esc(t.status.toUpperCase())}</p></div>
      </div>
      <p class="modal-text" style="margin-top:14px">${esc(t.desc)}</p>
      <button class="modal-btn-primary" style="margin-top:16px" data-toast="Receipt downloaded (mock)">Download Receipt</button>`);
  }

  /* =========================================================
     MORE
  ========================================================= */
  const row = (icon, label, attrs, extra = '') => `<button class="more-row" ${attrs}><i data-lucide="${icon}"></i><span>${label}</span>${extra}</button>`;
  function moreIndex() {
    const n = getUnreadCount();
    return `<h1 class="page-title">More</h1>
      <div class="more-group"><p class="more-group-title">Community</p>
        ${row('newspaper', 'Community Feed', 'data-nav="community/feed"')}
        ${row('message-circle', 'Messages', 'data-nav="chat"', `<span class="count-badge" data-chat-badge ${n ? '' : 'hidden'}>${n}</span>`)}
        ${row('users', 'Members', 'data-nav="community/members"')}
        ${row('building-2', 'Branches', 'data-nav="community/branches"')}
        ${row('contact', 'Directory', 'data-nav="community/directory"')}
      </div>
      <div class="more-group"><p class="more-group-title">Activities</p>
        ${row('users-round', 'Meetings', 'data-more="meetings"')}
        ${row('calendar', 'Events', 'data-nav="events"')}
        ${row('image', 'Gallery', 'data-more="gallery"')}
      </div>
      <div class="more-group"><p class="more-group-title">Finance</p>
        ${row('banknote', 'Payments', 'data-nav="payments"')}
        ${row('heart-handshake', 'Welfare', 'data-more="welfare"')}
        ${row('wallet', 'Wallet', 'data-nav="payments"')}
      </div>
      <div class="more-group"><p class="more-group-title">Information</p>
        ${row('megaphone', 'Announcements', 'data-more="announcements"')}
        ${row('folder-open', 'Documents', 'data-more="documents"')}
        ${row('languages', 'Language Corner', 'data-more="language"')}
      </div>
      <div class="more-group"><p class="more-group-title">Tools</p>
        ${row('bar-chart-3', 'Polls &amp; Surveys', 'data-more="polls"')}
        ${row('lightbulb', 'Tips of the Day', 'data-more="tips"')}
      </div>
      <div class="more-group"><p class="more-group-title">Settings</p>
        ${row('user', 'Profile', 'data-action="open-profile"')}
        ${row('bell', 'Notifications', 'data-action="open-notifications"')}
        ${row('settings', 'Preferences', 'data-more="settings"')}
      </div>`;
  }
  const back = (title) => `<div class="sub-page-header"><button class="back-btn" data-nav="more" aria-label="Back to More"><i data-lucide="arrow-left"></i></button><h1 class="page-title">${title}</h1></div>`;

  const MORE_PAGES = {
    meetings() {
      const card = m => `<div class="meeting-card"><p class="event-title">${esc(m.title)}</p><p class="event-sub">${esc(m.dateLabel)} &middot; ${esc(m.time)}</p><p class="event-sub">${esc(m.location)}</p><p class="modal-text" style="margin-top:8px">${esc(m.description)}</p></div>`;
      const up = getMeetings('upcoming'), past = getMeetings('past');
      return back('Meetings') + `<h2 class="section-title">Upcoming</h2><div class="section-block">${up.map(card).join('') || UI.emptyState({ title: 'No upcoming meetings.' })}</div>
        <h2 class="section-title" style="margin-top:22px">Past</h2><div class="section-block">${past.map(card).join('') || UI.emptyState({ title: 'No past meetings.' })}</div>`;
    },
    welfare() {
      const progs = getWelfarePrograms(), mine = getMyWelfareRequests();
      return back('Welfare') + `<h2 class="section-title">Welfare Programs</h2>
        <div class="section-block">${progs.map(w => `<div class="meeting-card"><p class="event-title">${esc(w.title)}</p><p class="modal-text">${esc(w.desc)}</p><span class="status-pill" style="margin-top:8px;display:inline-block">${esc(w.status.toUpperCase())}</span></div>`).join('')}</div>
        <h2 class="section-title" style="margin-top:22px">My Requests</h2>
        <div class="section-block">${mine.map(r => `<div class="meeting-card"><p class="event-title">${esc(r.program)}</p><p class="event-sub">Submitted ${esc(r.date)}</p><span class="txn-status success">${esc(r.status)}</span></div>`).join('') || UI.emptyState({ title: 'No welfare requests yet.' })}</div>
        <button class="modal-btn-primary" style="margin-top:18px;width:100%" data-toast="Welfare request submitted (mock)">Request Support</button>`;
    },
    announcements() {
      const items = getAnnouncements();
      return back('Announcements') + `<div class="section-block">${items.map(a => `
        <article class="ann-card ${a.unread ? 'unread' : ''}" data-ann-id="${a.id}" role="button" tabindex="0" aria-label="${esc(a.title)}${a.unread ? ', unread' : ''}">
          ${a.image ? `<div class="news-image"><img src="${esc(a.image)}" alt="" loading="lazy"></div>` : ''}
          <div class="ann-body"><div class="ann-head"><span class="news-tag news-tag-purple">${esc(a.category)}</span>${a.unread ? '<span class="unread-dot" aria-hidden="true"></span>' : ''}</div>
          <p class="news-title">${esc(a.title)}</p><p class="news-meta">${esc(a.date)}</p></div>
        </article>`).join('') || UI.emptyState({ title: 'No announcements yet.' })}</div>`;
    },
    gallery() {
      const items = getGallery();
      return back('Community Gallery') + (items.length ? `<div class="gallery-grid">${items.map((g, i) => `<button type="button" class="gallery-thumb" data-gallery-index="${i}" aria-label="Open photo: ${esc(g.caption)}"><img src="${esc(g.image)}" alt="" loading="lazy"></button>`).join('')}</div>` : UI.emptyState({ title: 'No community photos yet.' }));
    },
    documents() {
      return back('Documents') + `<div class="doc-list">${getDocuments().map(d => `<button class="doc-row" data-toast="Opening ${esc(d.title)} (mock preview)"><span class="doc-icon"><i data-lucide="file-text"></i></span><span class="doc-info"><span class="doc-title">${esc(d.title)}</span><span class="doc-meta">${esc(d.category)} &middot; ${esc(d.date)}</span></span><span class="doc-type">${esc(d.type)}</span></button>`).join('')}</div>`;
    },
    language() {
      const l = getLanguageCorner();
      return back('Language Corner') + `<div class="meeting-card"><p class="event-sub">Phrase of the Day</p><p class="lang-phrase">"${esc(l.phrase)}"</p><p class="lang-translation">${esc(l.translation)} <span class="lang-tag">${esc(l.language)}</span></p><p class="event-sub" style="margin-top:12px">Meaning</p><p class="modal-text">${esc(l.meaning)}</p></div>`;
    },
    tips() {
      const tip = getTips()[0];
      return back('Tips of the Day') + `<div class="meeting-card"><span class="news-tag news-tag-orange">${esc(tip.category)}</span><p class="event-title" style="margin-top:10px">${esc(tip.title)}</p><p class="modal-text" style="margin-top:8px">${esc(tip.content)}</p></div>`;
    },
    polls() {
      const poll = getPoll('poll1'), total = poll.options.reduce((s, o) => s + o.votes, 0) || 1;
      if (poll.votedOptionId) return back('Polls &amp; Surveys') + `<div class="meeting-card"><p class="event-title">${esc(poll.question)}</p><div class="poll-results">${poll.options.map(o => { const pct = Math.round(o.votes / total * 100); return `<div class="poll-result-row"><div class="poll-result-label"><span>${esc(o.label)}${o.id === poll.votedOptionId ? ' (your vote)' : ''}</span><span>${pct}%</span></div><div class="poll-bar-track"><div class="poll-bar-fill" style="width:${pct}%"></div></div></div>`; }).join('')}</div></div>`;
      return back('Polls &amp; Surveys') + `<div class="meeting-card"><p class="event-title">${esc(poll.question)}</p><div class="poll-options" role="radiogroup" aria-label="Poll options">${poll.options.map(o => `<label class="poll-option"><input type="radio" name="poll" value="${o.id}"><span>${esc(o.label)}</span></label>`).join('')}</div><button class="modal-btn-primary" data-action="submit-vote" style="margin-top:14px;width:100%">Submit Vote</button></div>`;
    },
    settings() {
      const r = (icon, label, attrs) => `<button class="more-row" ${attrs}><i data-lucide="${icon}"></i><span>${label}</span></button>`;
      return back('Settings') + `
        <div class="more-group"><p class="more-group-title">Account</p>${r('user', 'Profile', 'data-action="open-profile"')}</div>
        <div class="more-group"><p class="more-group-title">Notifications</p>${r('bell', 'Notification preferences', 'data-action="open-notifications"')}</div>
        <div class="more-group"><p class="more-group-title">Appearance</p>${r('sun', 'Theme', 'data-toast="Light theme is the only option for now"')}</div>
        <div class="more-group"><p class="more-group-title">Language</p>${r('languages', 'App language', 'data-toast="English (default)"')}</div>
        <div class="more-group"><p class="more-group-title">Privacy</p>${r('shield', 'Privacy policy', 'data-toast="Privacy policy (mock)"')}</div>
        <div class="more-group"><p class="more-group-title">About</p>${r('info', 'App info', 'data-toast="Ogugu United Forum · prototype build"')}${r('rotate-ccw', 'Reset prototype data', 'data-action="reset-data"')}</div>
        <button class="logout-btn" data-action="logout">Log Out</button>`;
    }
  };
  function renderMore(sub) {
    if (sub === 'news') { navigate('community/feed'); return; }   // legacy route: news is now the feed
    $('moreOutlet').innerHTML = sub && MORE_PAGES[sub] ? MORE_PAGES[sub]() : moreIndex();
  }

  /* =========================================================
     GLOBAL ACTIONS  (one delegated listener — survives re-renders)
  ========================================================= */
  document.addEventListener('click', (e) => {
    const t = e.target;

    const reg = t.closest('[data-register]');
    if (reg) {
      const id = reg.dataset.eventId; const ev = getEvent(id);
      if (ev && !isEventRegistered(ev)) {
        setEventRegistered(id, true);
        document.querySelectorAll(`[data-register][data-event-id="${id}"]`).forEach(b => { b.textContent = 'Registered ✓'; b.classList.add('registered'); });
        UI.toast('Event registration successful');
      }
      return;
    }

    const act = t.closest('[data-action]');
    if (act) {
      switch (act.dataset.action) {
        case 'open-profile': UI.closeModal(); openProfile(); break;
        case 'open-notifications': openPanel(); break;
        case 'open-card': UI.openModal('modal-card'); break;
        case 'open-welcome': UI.openModal('modal-welcome'); break;
        case 'add-money': UI.openModal('modal-addmoney'); break;
        case 'view-history': go('payments'); break;
        case 'toggle-balance': balanceVisible = !balanceVisible; syncWallet(); break;
        case 'pay-dues': UI.openDetail('Membership Dues', `<div class="profile-rows"><div><span>Status</span><p class="status-pill">PAID</p></div><div><span>Amount</span><p>₦10,000</p></div><div><span>Next payment</span><p>31 Dec, 2026</p></div></div><p class="modal-text" style="margin-top:14px">Your dues are up to date. Nothing is due right now.</p><button class="modal-btn-primary" style="margin-top:16px" data-nav="payments">View payment history</button>`); break;
        case 'new-chat': Chat.openNewChat(); break;
        case 'create-post': Feed.openComposer(); break;
        case 'submit-vote': {
          const c = document.querySelector('input[name="poll"]:checked');
          if (!c) { UI.toast('Select an option first'); break; }
          submitVote('poll1', c.value); $('moreOutlet').innerHTML = MORE_PAGES.polls(); UI.refreshIcons(); UI.toast('Vote submitted'); break;
        }
        case 'logout': UI.toast('Logged out (mock) — returning to Home'); go('home'); break;
        case 'reset-data': UI.confirm({ title: 'Reset prototype data?', message: 'This clears your likes, comments, posts, messages, registrations and wallet balance on this browser.', confirmLabel: 'Reset', danger: true }).then(ok => { if (ok) { Store.clearAll(); location.hash = '#/home'; location.reload(); } }); break;
      }
      return;
    }

    const nav = t.closest('[data-nav]');
    if (nav) { UI.closeModal(); go(nav.dataset.nav); return; }
    const more = t.closest('[data-more]'); if (more) { go('more/' + more.dataset.more); return; }
    const navFeed = t.closest('[data-nav-feed]'); if (navFeed) { Feed.resetFilters(); Feed.setFilter(navFeed.dataset.navFeed); go('community/feed'); return; }

    const branchOpen = t.closest('[data-open-branch]'); if (branchOpen) { openBranch(branchOpen.dataset.openBranch); return; }
    const startChat = t.closest('[data-start-chat]'); if (startChat) { Chat.startChatWith(startChat.dataset.startChat); return; }
    const mem = t.closest('[data-member-id]'); if (mem) { openMember(mem.dataset.memberId); return; }
    const evOpen = t.closest('[data-open-event]'); if (evOpen) { openEventDetail(evOpen.dataset.openEvent); return; }
    const postOpen = t.closest('[data-open-post]'); if (postOpen) { Feed.openPost(postOpen.dataset.openPost, { sheet: true }); return; }
    const gal = t.closest('[data-gallery-index]');
    if (gal) { UI.openLightbox(getGallery().map(g => ({ image: g.image, caption: g.caption })), parseInt(gal.dataset.galleryIndex, 10)); return; }
    const br = t.closest('[data-branch-filter]'); if (br) { openBranch(br.dataset.branchFilter); return; }
    const tx = t.closest('[data-txn-id]'); if (tx) { openTransaction(tx.dataset.txnId); return; }
    const ann = t.closest('[data-ann-id]');
    if (ann) { const a = getAnnouncement(ann.dataset.annId); markAnnouncementRead(a.id); ann.classList.remove('unread'); const d = ann.querySelector('.unread-dot'); if (d) d.remove(); UI.openDetail(a.title, `<p class="modal-text">${esc(a.content)}</p>`); return; }
    const se = t.closest('[data-share-event]');
    if (se) { const ev = getEvent(se.dataset.shareEvent); const url = location.href.split('#')[0] + '#/events/' + ev.id;
      if (navigator.share) navigator.share({ title: ev.title, url }).catch(() => {}); else UI.copyText(url).then(ok => UI.toast(ok ? 'Link copied' : 'Could not copy the link')); return; }
    const preset = t.closest('[data-preset]'); if (preset) { $('amountInput').value = preset.dataset.preset; return; }
    const ret = t.closest('[data-retry]'); if (ret && ret.dataset.retry === 'more') { renderMore(null); return; }
    const cl = t.closest('[data-close]'); if (cl) { UI.closeModal(); return; }
    const toast = t.closest('[data-toast]'); if (toast) UI.toast(toast.dataset.toast);

    // click outside the notification panel closes it
    if (panel.classList.contains('open') && !t.closest('#notifPanel')) closePanel();
  });
  $('modalOverlay').addEventListener('click', (e) => { if (e.target === $('modalOverlay')) UI.closeModal(); });

  /* keyboard: activate role=button cards, Escape, lightbox arrows */
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][tabindex]')) { e.preventDefault(); e.target.click(); return; }
    if (e.key === 'Escape') {
      if (UI.lightboxOpen()) UI.closeLightbox();
      else if ($('modalOverlay').classList.contains('open')) UI.closeModal();
      else closePanel();
    }
    if (UI.lightboxOpen()) {
      if (e.key === 'ArrowRight') UI.lbStep(1); if (e.key === 'ArrowLeft') UI.lbStep(-1);
      if (e.key === 'Tab') { const f = [...document.querySelectorAll('#lightbox button')].filter(b => b.offsetParent !== null); const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    }
  });
  $('lightboxClose').addEventListener('click', () => UI.closeLightbox());
  $('lightboxPrev').addEventListener('click', () => UI.lbStep(-1));
  $('lightboxNext').addEventListener('click', () => UI.lbStep(1));
  $('lightbox').addEventListener('click', (e) => { if (e.target === $('lightbox')) UI.closeLightbox(); });

  /* =========================================================
     BOOT
  ========================================================= */
  bindProfile();
  Feed.init(); Chat.init();
  initRouter(handleRoute);
});
