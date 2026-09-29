/* =========================================================
   NOTIFICATION SERVICE — read state in Store key "notif_read".
   Each notification carries a router `link` so the UI can open its target.
========================================================= */
function getNotifications() {
  const read = Store.get('notif_read', {});
  return MOCK.notifications
    .map(n => ({ ...n, unread: read[n.id] ? false : n.unread }))
    .sort((a, b) => b.createdAt - a.createdAt);
}
function getNotification(id) { return getNotifications().find(n => n.id === id); }
function markNotificationRead(id) { const r = Store.get('notif_read', {}); r[id] = true; Store.set('notif_read', r); }
function markAllNotificationsRead() { const r = {}; MOCK.notifications.forEach(n => { r[n.id] = true; }); Store.set('notif_read', r); }
function unreadNotificationCount() { return getNotifications().filter(n => n.unread).length; }
