/* =========================================================
   CHAT SERVICE — conversations + messages (mock, private-first)
   State seeded from MOCK once, then persisted in Store key "chat".
   Conversation types: private | group | branch (UI renders private).
   Message status — outgoing: sending → sent → read; incoming: unread → read.
   Unread counts are DERIVED from message status, never stored separately.
========================================================= */
function _chat() {
  let c = Store.get('chat', null);
  if (!c) {
    c = { conversations: JSON.parse(JSON.stringify(MOCK.conversations)), messages: JSON.parse(JSON.stringify(MOCK.messages)) };
    Store.set('chat', c);
  }
  // a message left "sending" by a previous page load can never complete
  let dirty = false;
  c.messages.forEach(m => { if (m.status === 'sending') { m.status = 'sent'; dirty = true; } });
  if (dirty) Store.set('chat', c);
  return c;
}

function _decorateConv(conv, c) {
  const me = MOCK.currentUserId;
  const msgs = c.messages.filter(m => m.conversationId === conv.id).sort((a, b) => a.createdAt - b.createdAt);
  const last = msgs[msgs.length - 1] || null;
  const isPrivate = conv.type === 'private';
  const partner = isPrivate ? getMember(conv.participants.find(p => p !== me)) : null;
  return {
    ...conv,
    isGroup: !isPrivate,
    title: isPrivate ? (partner ? partner.name : 'Former member') : conv.name,
    photo: partner ? partner.photo : null,
    online: !!(partner && partner.online),
    partner,
    lastMessage: last,
    messageCount: msgs.length,
    unread: msgs.filter(m => m.senderId !== me && m.status === 'unread').length
  };
}

/** Only conversations that contain at least one message are listed */
function getConversations(query = '') {
  const c = _chat(), q = query.trim().toLowerCase();
  return c.conversations
    .map(cv => _decorateConv(cv, c))
    .filter(cv => cv.messageCount > 0)
    .filter(cv => !q || cv.title.toLowerCase().includes(q) || (cv.lastMessage && cv.lastMessage.content.toLowerCase().includes(q)))
    .sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
}
function getConversation(id) { const c = _chat(); const cv = c.conversations.find(x => x.id === id); return cv ? _decorateConv(cv, c) : undefined; }
function getMessages(conversationId) {
  return _chat().messages.filter(m => m.conversationId === conversationId).sort((a, b) => a.createdAt - b.createdAt);
}
function sendMessage(conversationId, content) {
  const text = content.trim();
  if (!text) throw new Error('EMPTY_MESSAGE');
  const c = _chat();
  const cv = c.conversations.find(x => x.id === conversationId);
  if (!cv) throw new Error('NO_CONVERSATION');
  const msg = { id: 'msg' + Date.now() + Math.floor(Math.random() * 1000), conversationId, senderId: MOCK.currentUserId, content: text, createdAt: Date.now(), status: 'sending' };
  c.messages.push(msg);
  cv.updatedAt = msg.createdAt;
  Store.set('chat', c);
  return msg;
}
function setMessageStatus(messageId, status) {
  const c = _chat(); const m = c.messages.find(x => x.id === messageId);
  if (m) { m.status = status; Store.set('chat', c); }
  return m;
}
/** Returns the existing private conversation with that member, or creates one */
function createConversation(memberId) {
  const c = _chat(), me = MOCK.currentUserId;
  const existing = c.conversations.find(cv => cv.type === 'private' && cv.participants.includes(me) && cv.participants.includes(memberId));
  if (existing) return _decorateConv(existing, c);
  const cv = { id: 'cv' + Date.now(), type: 'private', participants: [me, memberId], pinned: false, updatedAt: Date.now() };
  c.conversations.push(cv);
  Store.set('chat', c);
  return _decorateConv(cv, c);
}
function markConversationRead(conversationId) {
  const c = _chat(), me = MOCK.currentUserId; let changed = false;
  c.messages.forEach(m => { if (m.conversationId === conversationId && m.senderId !== me && m.status === 'unread') { m.status = 'read'; changed = true; } });
  if (changed) Store.set('chat', c);
}
function getUnreadCount() { const c = _chat(); return c.conversations.reduce((n, cv) => n + _decorateConv(cv, c).unread, 0); }
