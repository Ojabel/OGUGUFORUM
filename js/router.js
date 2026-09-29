/* =========================================================
   ROUTER — hash based, so refresh / back / forward / deep links work.
   #/home  #/community[/feed|members|branches|directory]
   #/community/members/:id   #/community/post/:id
   #/events[/:id]  #/payments  #/more[/:page]  #/chat[/:conversationId]
========================================================= */
const TOP_LEVEL = ['home', 'community', 'events', 'payments', 'more', 'chat'];
/* which bottom-nav tab is highlighted for each top-level view */
const NAV_TAB = { chat: 'community' };

function parseRoute() {
  const parts = (location.hash || '#/home').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const top = TOP_LEVEL.includes(parts[0]) ? parts[0] : 'home';
  return { top, sub: parts[1] || null, arg: parts[2] || null };
}
function navigate(path) { location.hash = '/' + String(path).replace(/^#?\/?/, ''); }
/** change the URL without triggering a re-render (used when closing routed detail modals) */
function replaceRoute(path) { history.replaceState(null, '', '#/' + String(path).replace(/^#?\/?/, '')); }
function initRouter(onRoute) {
  window.addEventListener('hashchange', () => onRoute(parseRoute()));
  onRoute(parseRoute());
}
