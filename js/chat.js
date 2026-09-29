/* =========================================================
   CHAT UI — conversation list, private chat, new chat.
   Talks only to chat-service. Message status changes
   (sending → sent → read) are mock UI states, not real delivery.
========================================================= */
const Chat = (() => {
  const $ = UI.$, esc = UI.esc;
  let query = '', activeId = null, listReq = 0;
  const STATUS_LABEL = { sending: 'Sending…', sent: 'Sent', read: 'Read' };

  function updateBadges() {
    const n = getUnreadCount();
    document.querySelectorAll('[data-chat-badge]').forEach(b => { b.textContent = n > 99 ? '99+' : String(n); b.hidden = n === 0; });
  }

  /* ---------------- list ---------------- */
  function rowHtml(cv) {
    const me = getCurrentUserId(), last = cv.lastMessage;
    const mine = last && last.senderId === me;
    let who = '';
    if (mine) who = 'You: ';
    else if (cv.isGroup && last) { const s = getMember(last.senderId); who = s ? s.name.split(' ')[0] + ': ' : ''; }
    const avatarHtml = cv.photo ? UI.avatar({ name: cv.title, photo: cv.photo }, 'md') : UI.avatar({ name: cv.title }, 'md');
    return `<button type="button" class="chat-row ${cv.id === activeId ? 'active' : ''}" data-conv-id="${cv.id}" aria-label="${esc(cv.title)}${cv.unread ? `, ${cv.unread} unread` : ''}">
      <span class="avatar-wrap">${avatarHtml}${cv.online ? '<span class="online-dot" title="Online"></span>' : ''}</span>
      <span class="chat-row-main">
        <span class="chat-row-top"><span class="chat-name">${esc(cv.title)}${cv.pinned ? '<span class="pin-tag">Pinned</span>' : ''}</span><span class="chat-time">${last ? UI.listTime(last.createdAt) : ''}</span></span>
        <span class="chat-row-bottom"><span class="chat-preview ${cv.unread ? 'unread' : ''}">${esc(who)}${esc(last ? last.content : '')}</span>${cv.unread ? `<span class="unread-badge" aria-hidden="true">${cv.unread}</span>` : ''}</span>
      </span>
    </button>`;
  }
  async function renderList() {
    const el = $('chatList'); if (!el) return;
    const id = ++listReq;
    try {
      const convs = await Promise.resolve(getConversations(query));
      if (id !== listReq) return;
      if (!convs.length) {
        el.innerHTML = query
          ? UI.emptyState({ title: `No conversations match “${query}”.` })
          : UI.emptyState({ title: 'No conversations yet.', text: 'Start a conversation with a community member.', actionLabel: 'Start Chat', action: 'new-chat' });
      } else el.innerHTML = `<div class="chat-list">${convs.map(rowHtml).join('')}</div>`;
    } catch (e) { el.innerHTML = UI.errorState('Could not load your conversations.', 'chat'); }
    updateBadges();
  }

  /* ---------------- conversation ---------------- */
  function msgHtml(m, cv) {
    const out = m.senderId === getCurrentUserId();
    const sender = !out && cv.isGroup ? (getMember(m.senderId) || {}).name : '';
    return `<div class="msg ${out ? 'msg-out' : 'msg-in'}" data-msg-id="${m.id}">
      ${sender ? `<span class="msg-sender">${esc(sender)}</span>` : ''}
      <div class="bubble">${UI.multiline(m.content)}</div>
      <span class="msg-meta">${UI.clock(m.createdAt)}${out ? ` &middot; <span data-status>${STATUS_LABEL[m.status] || ''}</span>` : ''}</span>
    </div>`;
  }
  function messagesHtml(cv) {
    const msgs = getMessages(cv.id);
    if (!msgs.length) return `<p class="conv-empty">No messages yet. Say hello to ${esc(cv.title.split(' ')[0])}.</p>`;
    let html = '', prev = null;
    msgs.forEach(m => { if (prev === null || !UI.sameDay(prev, m.createdAt)) html += `<div class="day-divider"><span>${UI.dayLabel(m.createdAt)}</span></div>`; prev = m.createdAt; html += msgHtml(m, cv); });
    return html;
  }
  function openConversation(id) {
    const pane = $('chatConvPane');
    const cv = getConversation(id);
    if (!cv) { pane.innerHTML = UI.errorState('This conversation could not be found.', 'chat-back'); return; }
    markConversationRead(id); updateBadges();
    const status = cv.isGroup ? `${cv.participants.length} members` : (cv.online ? 'Online' : 'Offline');
    pane.innerHTML = `
      <header class="conv-head">
        <button type="button" class="conv-back" data-nav="chat" aria-label="Back to chats"><i data-lucide="arrow-left"></i></button>
        <span class="avatar-wrap">${UI.avatar({ name: cv.title, photo: cv.photo }, 'sm')}${cv.online ? '<span class="online-dot"></span>' : ''}</span>
        <div class="conv-who"><p class="conv-name">${esc(cv.title)}</p><p class="conv-status ${cv.online ? 'online' : ''}">${status}</p></div>
      </header>
      <div class="conv-messages" id="convMessages" role="log" aria-live="polite" aria-label="Messages with ${esc(cv.title)}">${messagesHtml(cv)}</div>
      <form class="conv-input" id="convForm" data-conv="${cv.id}">
        <button type="button" class="attach-icon" data-action="attach" aria-label="Attach a file"><i data-lucide="paperclip"></i></button>
        <input type="text" id="msgInput" placeholder="Type a message..." aria-label="Type a message" autocomplete="off" maxlength="1000">
        <button type="submit" class="send-btn">Send</button>
      </form>`;
    UI.refreshIcons();
    scrollToEnd();
    if (window.matchMedia('(min-width: 1024px)').matches) $('msgInput').focus({ preventScroll: true });
    renderList();
  }
  function scrollToEnd() { const m = $('convMessages'); if (m) m.scrollTop = m.scrollHeight; }
  function setStatusDom(msgId, status) {
    const el = document.querySelector(`[data-msg-id="${msgId}"] [data-status]`);
    if (el) el.textContent = STATUS_LABEL[status] || '';
  }

  function send(form) {
    const input = $('msgInput'), text = input.value;
    if (!text.trim()) return;
    const cv = getConversation(form.dataset.conv);
    let msg;
    try { msg = sendMessage(cv.id, text); } catch (e) { UI.toast('Message could not be sent.'); return; }
    const box = $('convMessages'); const empty = box.querySelector('.conv-empty'); if (empty) empty.remove();
    if (!box.querySelector('.day-divider')) box.insertAdjacentHTML('afterbegin', `<div class="day-divider"><span>Today</span></div>`);
    box.insertAdjacentHTML('beforeend', msgHtml(msg, cv));
    input.value = ''; scrollToEnd(); input.focus({ preventScroll: true });
    renderList(); updateBadges();
    setTimeout(() => { setMessageStatus(msg.id, 'sent'); setStatusDom(msg.id, 'sent'); }, 500);
    if (cv.online) setTimeout(() => { setMessageStatus(msg.id, 'read'); setStatusDom(msg.id, 'read'); }, 3000);
  }

  /* ---------------- new chat ---------------- */
  function renderNewChat(q) {
    const me = getCurrentUserId();
    const list = getMembers({ query: q }).filter(m => m.id !== me);
    $('newChatList').innerHTML = list.length
      ? list.map(m => `<button type="button" class="member-row" data-newchat-member="${m.id}">${UI.avatar(m, 'md')}<div class="member-row-info"><p class="member-row-name">${esc(m.name)}</p><p class="member-row-branch">${esc(m.branch)}</p></div></button>`).join('')
      : UI.emptyState({ title: 'No members found.' });
  }
  function openNewChat() { $('newChatSearch').value = ''; renderNewChat(''); UI.openModal('modal-newchat'); }
  /** open (or create) the private chat with a member and navigate to it */
  function startChatWith(memberId) { const cv = createConversation(memberId); UI.closeModal(); navigate('chat/' + cv.id); }

  /* ---------------- route entry ---------------- */
  function render(convId) {
    activeId = convId || null;
    const layout = $('chatLayout'); layout.classList.toggle('conv-open', !!convId);
    renderList();
    if (convId) openConversation(convId);
    else $('chatConvPane').innerHTML = '<div class="conv-placeholder"><p class="state-title">Select a conversation</p><p class="state-text">Or start a new chat with a community member.</p></div>';
  }

  function init() {
    let t;
    $('chatSearch').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { query = e.target.value; renderList(); }, 200); });
    $('newChatSearch').addEventListener('input', (e) => renderNewChat(e.target.value));
    document.addEventListener('click', (e) => {
      const row = e.target.closest('[data-conv-id]'); if (row) { navigate('chat/' + row.dataset.convId); return; }
      const nc = e.target.closest('[data-newchat-member]'); if (nc) { startChatWith(nc.dataset.newchatMember); return; }
      const sc = e.target.closest('[data-start-chat]'); if (sc) { startChatWith(sc.dataset.startChat); return; }
      if (e.target.closest('[data-retry="chat"]')) { renderList(); return; }
      if (e.target.closest('[data-retry="chat-back"]')) { navigate('chat'); return; }
      if (e.target.closest('[data-action="attach"]')) UI.toast('Attachments are not available in this prototype.');
    });
    document.addEventListener('submit', (e) => { const f = e.target.closest('#convForm'); if (f) { e.preventDefault(); send(f); } });
  }

  return { init, render, renderList, openNewChat, updateBadges, startChatWith };
})();
