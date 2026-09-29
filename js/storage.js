/* =========================================================
   STORAGE
   One namespaced wrapper around localStorage. Every key is
   prefixed "ogugu_". Falls back to memory if storage is blocked
   or full, so the app never throws on a storage error.
   Keys in use: profile, registered, wallet, txns, ann_read,
   notif_read, posts, comments, likes, chat.
========================================================= */
const Store = (() => {
  const PREFIX = 'ogugu_';
  const mem = {};
  let available = true;
  try { localStorage.setItem(PREFIX + '_t', '1'); localStorage.removeItem(PREFIX + '_t'); } catch (e) { available = false; }

  return {
    get(key, fallback) {
      try {
        const raw = available ? localStorage.getItem(PREFIX + key) : mem[key];
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    /** returns false if the value could not be persisted (e.g. quota exceeded) */
    set(key, value) {
      const raw = JSON.stringify(value);
      try {
        if (available) localStorage.setItem(PREFIX + key, raw); else mem[key] = raw;
        return true;
      } catch (e) { mem[key] = raw; return false; }
    },
    remove(key) { try { if (available) localStorage.removeItem(PREFIX + key); } catch (e) {} delete mem[key]; },
    clearAll() { Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k)); }
  };
})();

/* Per-tab state (poll votes) */
const Session = {
  get(key) { try { return sessionStorage.getItem('ogugu_' + key); } catch (e) { return null; } },
  set(key, v) { try { sessionStorage.setItem('ogugu_' + key, v); } catch (e) {} }
};
