/* =========================================================
   UI KIT — shared helpers used by every screen:
   toast, modal/sheet, confirm dialog, lightbox, avatars,
   time formatting, empty / error / skeleton states.
========================================================= */
const UI = (() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const multiline = (s) => esc(s).replace(/\n/g, '<br>');
  const refreshIcons = () => { if (window.lucide) lucide.createIcons(); };

  /* ---------- time ---------- */
  const DAY = 24 * 3600 * 1000;
  function timeAgo(ms) {
    const d = Date.now() - ms;
    if (d < 60000) return 'Just now';
    if (d < 3600000) return Math.floor(d / 60000) + 'm';
    if (d < DAY) return Math.floor(d / 3600000) + 'h';
    if (d < 7 * DAY) return Math.floor(d / DAY) + 'd';
    return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  const clock = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  function dayLabel(ms) {
    if (sameDay(ms, Date.now())) return 'Today';
    if (sameDay(ms, Date.now() - DAY)) return 'Yesterday';
    return new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function listTime(ms) {
    if (sameDay(ms, Date.now())) return clock(ms);
    if (sameDay(ms, Date.now() - DAY)) return 'Yesterday';
    return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  /* ---------- avatars ---------- */
  const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  /** size: sm(32) | md(44) | lg(56) */
  function avatar(person, size = 'md', extra = '') {
    const name = person ? person.name : '';
    if (!person || !person.photo) return `<span class="avatar av-${size} avatar-fallback ${extra}" data-initials="${esc(initials(name))}"></span>`;
    return `<span class="avatar av-${size} ${extra}" data-initials="${esc(initials(name))}"><img src="${esc(person.photo)}" alt="" loading="lazy"></span>`;
  }
  /* one global image-error handler instead of inline onerror attributes */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    const p = img.parentElement; if (!p) return;
    if (p.matches('.avatar, [class*="avatar"]')) p.classList.add('avatar-fallback');
    else if (p.matches('.logo-circle, .mini-logo, .membership-logo-circle')) p.classList.add('logo-fallback');
    else p.classList.add('img-fallback');
  }, true);

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(message) {
    const el = $('toast'); if (!el) return;
    el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ---------- modals (one open at a time) ---------- */
  let lastFocus = null;
  const closeHooks = [];
  const overlay = () => $('modalOverlay');
  const currentModal = () => document.querySelector('.modal.open');

  function openModal(id) {
    const target = $(id); if (!target) return;
    if (!overlay().classList.contains('open')) lastFocus = document.activeElement;
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
    target.classList.add('open'); overlay().classList.add('open');
    const first = target.querySelector('[autofocus], input:not([type=hidden]), textarea, select, button.modal-btn-primary, .modal-close');
    setTimeout(() => first && first.focus && first.focus({ preventScroll: true }), 30);
    refreshIcons();
  }
  function closeModal() {
    const wasOpen = overlay().classList.contains('open');
    overlay().classList.remove('open');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
    if (wasOpen) { closeHooks.forEach(fn => fn()); if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true }); }
  }
  const onModalClose = (fn) => closeHooks.push(fn);
  function openDetail(title, html) { $('detailTitle').textContent = title; $('detailBody').innerHTML = html; openModal('modal-detail'); }

  /** Promise<boolean> confirmation dialog — replaces window.confirm */
  function confirm({ title, message, confirmLabel = 'Confirm', danger = false }) {
    return new Promise(resolve => {
      $('confirmTitle').textContent = title; $('confirmMessage').textContent = message;
      const ok = $('confirmOk'), cancel = $('confirmCancel');
      ok.textContent = confirmLabel; ok.classList.toggle('modal-btn-danger', danger);
      let settled = false;
      const done = (v) => { if (settled) return; settled = true; ok.onclick = cancel.onclick = null; closeHooks.splice(closeHooks.indexOf(onClose), 1); closeModalQuiet(); resolve(v); };
      const onClose = () => done(false);
      ok.onclick = () => done(true); cancel.onclick = () => done(false);
      closeHooks.push(onClose);
      openModal('modal-confirm');
    });
  }
  function closeModalQuiet() {
    overlay().classList.remove('open'); document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  /* focus trap + Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && overlay() && overlay().classList.contains('open')) {
      const m = currentModal(); if (!m) return;
      const f = [...m.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea, select, a[href]')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- lightbox (items: [{image, caption}]) ---------- */
  const LB = { items: [], index: 0, opener: null };
  function lbRender() {
    const it = LB.items[LB.index]; const box = $('lightbox');
    const img = $('lightboxImage');
    img.parentElement.classList.remove('img-fallback');
    img.src = it.image; img.alt = it.caption || '';
    $('lightboxCaption').textContent = (it.caption || '') + (LB.items.length > 1 ? `  (${LB.index + 1}/${LB.items.length})` : '');
    box.classList.toggle('single', LB.items.length < 2);
  }
  function openLightbox(items, index = 0) {
    if (!items || !items.length) return;
    LB.items = items; LB.index = ((index % items.length) + items.length) % items.length; LB.opener = document.activeElement;
    lbRender(); const box = $('lightbox'); box.classList.add('open'); box.setAttribute('aria-hidden', 'false');
    $('lightboxClose').focus({ preventScroll: true });
  }
  function closeLightbox() {
    const box = $('lightbox'); if (!box.classList.contains('open')) return false;
    box.classList.remove('open'); box.setAttribute('aria-hidden', 'true');
    if (LB.opener && LB.opener.focus && document.contains(LB.opener)) LB.opener.focus({ preventScroll: true });
    return true;
  }
  const lbStep = (d) => { LB.index = (LB.index + d + LB.items.length) % LB.items.length; lbRender(); };
  const lightboxOpen = () => $('lightbox').classList.contains('open');

  /* ---------- reusable states ---------- */
  function emptyState({ title, text = '', actionLabel = '', action = '' }) {
    return `<div class="state-card"><p class="state-title">${esc(title)}</p>${text ? `<p class="state-text">${esc(text)}</p>` : ''}${actionLabel ? `<button class="state-btn" data-action="${esc(action)}">${esc(actionLabel)}</button>` : ''}</div>`;
  }
  function errorState(message = 'Something went wrong.', retry = '') {
    return `<div class="state-card state-error" role="alert"><p class="state-title">${esc(message)}</p><button class="state-btn" data-retry="${esc(retry)}">Try Again</button></div>`;
  }
  function skeleton(kind = 'post', count = 2) {
    const one = kind === 'row'
      ? '<div class="skel skel-row"><span class="skel-circle"></span><span class="skel-lines"><i></i><i></i></span></div>'
      : '<div class="skel skel-post"><div class="skel-head"><span class="skel-circle"></span><span class="skel-lines"><i></i><i></i></span></div><i class="skel-line"></i><i class="skel-line short"></i><i class="skel-block"></i></div>';
    return `<div class="skel-wrap" aria-busy="true" aria-label="Loading">${one.repeat(count)}</div>`;
  }

  /* ---------- clipboard ---------- */
  async function copyText(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) {}
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }

  return { $, esc, multiline, refreshIcons, timeAgo, clock, dayLabel, listTime, sameDay, initials, avatar, toast,
    openModal, closeModal, onModalClose, openDetail, confirm, openLightbox, closeLightbox, lbStep, lightboxOpen,
    emptyState, errorState, skeleton, copyText };
})();
