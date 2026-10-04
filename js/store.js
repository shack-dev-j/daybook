(function (root) {
  'use strict';
  const D = root.Daybook;

  let lastSnapshot = null;

  function loadItems() {
    let raw = null;
    try {
      const stored = localStorage.getItem(D.config.KEYS.items);
      if (stored) raw = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load items', e);
    }
    
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      // Seed with one hard-coded sample item for Step 1
      raw = [
        D.model.blank('homework', {
          title: 'Kinematics problem set 2 (Q1–12)',
          subject: 'physics',
          due_date: D.dates.today(),
          priority: 'high'
        })
      ];
    }
    
    return D.model.normaliseAll(raw);
  }

  function saveItems(items) {
    try {
      localStorage.setItem(D.config.KEYS.items, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items', e);
    }
  }

  function backupItems(items) {
    try {
      localStorage.setItem(D.config.KEYS.backup, JSON.stringify(items));
    } catch (e) {
      // Ignore
    }
  }

  function snapshot(items) {
    lastSnapshot = JSON.parse(JSON.stringify(items));
  }

  function getSnapshot() {
    return lastSnapshot ? D.model.normaliseAll(lastSnapshot) : null;
  }

  function loadPrefs() {
    try {
      const stored = localStorage.getItem(D.config.KEYS.prefs);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // Ignore
    }
    return { theme: D.loadTheme(), subjectFilter: null };
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(D.config.KEYS.prefs, JSON.stringify(prefs));
    } catch (e) {
      // Ignore
    }
  }

  D.store = {
    loadItems,
    saveItems,
    backupItems,
    snapshot,
    getSnapshot,
    loadPrefs,
    savePrefs
  };
})(window);
