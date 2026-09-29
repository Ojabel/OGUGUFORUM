/* =========================================================
   CORE SERVICES  (profile, members, events, payments, info pages)
   The only layer that touches MOCK / Store. Swap the bodies for
   Supabase calls later; the UI keeps calling the same functions.
========================================================= */

/* ---------- profile ---------- */
function getCurrentUserId() { return MOCK.currentUserId; }
function getProfile(memberId = MOCK.currentUserId) {
  const base = MOCK.members.find(x => x.id === memberId) || MOCK.profile;
  if (memberId === MOCK.currentUserId) {
    const saved = Store.get('profile', {});
    return { ...base, ...saved };
  }
  return base;
}
function saveProfile(patch) {
  const FORBIDDEN = ['id', 'membershipId', 'status', 'memberSince', 'branch', 'branchId'];
  const sanitized = { ...patch };
  FORBIDDEN.forEach(k => delete sanitized[k]);
  const current = Store.get('profile', {});
  const next = { ...current, ...sanitized };
  Store.set('profile', next);
  return getProfile();
}
function updateProfilePhoto(memberId, photoDataUrl) {
  if (!photoDataUrl) throw new Error('INVALID_PHOTO');
  if (memberId === MOCK.currentUserId) {
    saveProfile({ photo: photoDataUrl });
  } else {
    const m = MOCK.members.find(x => x.id === memberId);
    if (m) m.photo = photoDataUrl;
  }
  return getProfile(memberId);
}
function removeProfilePhoto(memberId) {
  const defaultPhoto = '';
  if (memberId === MOCK.currentUserId) {
    saveProfile({ photo: defaultPhoto });
  } else {
    const m = MOCK.members.find(x => x.id === memberId);
    if (m) m.photo = defaultPhoto;
  }
  return getProfile(memberId);
}

/* ---------- public profile & privacy ---------- */
function getPublicProfile(memberId) {
  const m = getMember(memberId);
  if (!m) return undefined;
  const isSelf = memberId === MOCK.currentUserId;
  const priv = m.privacy || { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' };
  
  return {
    ...m,
    phone: isSelf || priv.phone === 'public' ? m.phone : null,
    email: isSelf || priv.email === 'public' ? m.email : null,
    occupation: isSelf || priv.occupation !== 'private' ? m.occupation : null,
    company: isSelf || priv.occupation !== 'private' ? m.company : null,
    maritalStatus: isSelf || priv.maritalStatus !== 'private' ? m.maritalStatus : null,
    spouseName: (isSelf || priv.maritalStatus !== 'private') && m.maritalStatus === 'Married' ? m.spouseName : null,
    location: isSelf || priv.location !== 'private' ? m.location : null,
    state: isSelf || priv.location !== 'private' ? m.state : null,
    country: isSelf || priv.location !== 'private' ? m.country : null
  };
}

/* ---------- members ---------- */
function getMembers({ query = '', branch = '', status = '' } = {}) {
  const q = query.trim().toLowerCase();
  const me = getProfile();
  return MOCK.members
    .map(m => m.id === MOCK.currentUserId ? { ...m, ...Store.get('profile', {}) } : m)
    .filter(m => (!q || m.name.toLowerCase().includes(q) || m.branch.toLowerCase().includes(q) || (m.occupation || '').toLowerCase().includes(q))
      && (!branch || m.branch === branch || m.branchId === branch) && (!status || m.status === status))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function getMember(id) {
  const m = MOCK.members.find(x => x.id === id);
  if (!m) return undefined;
  return id === MOCK.currentUserId ? { ...m, ...Store.get('profile', {}) } : m;
}
/** Author of a post/comment: a member or the organisation */
function getAuthor(id) { return id === 'org' ? MOCK.org : getMember(id); }
function getBirthdaysToday() { return MOCK.members.filter(m => m.birthdayToday); }
function getNewMembers() { return MOCK.members.filter(m => m.newMember); }
function getNewMemberCount() { return MOCK.stats.newMembersThisMonth; }

/* ---------- branches ---------- */
function getBranches() { return MOCK.branches; }
function getBranch(branchId) {
  if (!branchId) return undefined;
  return MOCK.branches.find(b => b.id === branchId || b.name.toLowerCase() === branchId.toLowerCase());
}
function getBranchMembers(branchId) {
  const target = getBranch(branchId);
  if (!target) return [];
  return getMembers().filter(m => m.branchId === target.id || m.branch === target.name);
}
function getBranchMeeting(branchId) {
  const target = getBranch(branchId);
  return target ? target.meeting : null;
}

/* ---------- events ---------- */
function getEvents(status) { return status ? MOCK.events.filter(e => e.status === status) : MOCK.events; }
function getEvent(id) { return MOCK.events.find(e => e.id === id); }
function setEventRegistered(id, value) { const s = Store.get('registered', {}); s[id] = value; Store.set('registered', s); }
function isEventRegistered(ev) { const s = Store.get('registered', {}); return Object.prototype.hasOwnProperty.call(s, ev.id) ? s[ev.id] : !!ev.registered; }

/* ---------- payments / wallet ---------- */
function getTransactions() { return [...Store.get('txns', []), ...MOCK.transactions]; }
function getTransaction(id) { return getTransactions().find(t => t.id === id); }
function getWalletBalance() { return Store.get('wallet', 12450); }
function addWalletFunds(amount) {
  const next = getWalletBalance() + amount;
  Store.set('wallet', next);
  const txns = Store.get('txns', []);
  txns.unshift({
    id: 'tx' + Date.now(), title: 'Wallet Top-up', amount, status: 'successful',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    type: 'Top-up', desc: 'Wallet funded (mock transaction. no real payment was made).'
  });
  Store.set('txns', txns);
  return next;
}

/* ---------- announcements ---------- */
function getAnnouncements() {
  const read = Store.get('ann_read', []);
  return MOCK.announcements.map(a => ({ ...a, unread: a.unread && !read.includes(a.id) }));
}
function getAnnouncement(id) { return getAnnouncements().find(a => a.id === id); }
function markAnnouncementRead(id) { const r = Store.get('ann_read', []); if (!r.includes(id)) { r.push(id); Store.set('ann_read', r); } }

/* ---------- info pages ---------- */
function getGallery() { return MOCK.gallery; }
function getDocuments() { return MOCK.documents; }
function getMeetings(status) { return status ? MOCK.meetings.filter(m => m.status === status) : MOCK.meetings; }
function getWelfarePrograms() { return MOCK.welfare; }
function getMyWelfareRequests() { return MOCK.myWelfareRequests; }
function getTips() { return MOCK.tips; }
function getLanguageCorner() { return MOCK.languageCorner; }

/* ---------- polls (one vote per browser session; results = base + your vote) ---------- */
function getPoll(id) {
  const poll = MOCK.polls.find(p => p.id === id);
  const mine = Session.get('voted_' + id);
  return { ...poll, votedOptionId: mine, options: poll.options.map(o => ({ ...o, votes: o.votes + (o.id === mine ? 1 : 0) })) };
}
function hasVoted(pollId) { return !!Session.get('voted_' + pollId); }
function submitVote(pollId, optionId) { if (!hasVoted(pollId)) Session.set('voted_' + pollId, optionId); return getPoll(pollId); }
