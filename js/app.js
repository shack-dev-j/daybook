(function (root) {
  'use strict';
  const D = root.Daybook;

  const state = {
    activeScreen: 'today',
    activeSubject: null,
    searchQuery: '',
    items: [],
    prefs: {}
  };

  const SCREENS = [
    { id: 'today', name: 'Today', icon: 'house' },
    { id: 'homework', name: 'Homework', icon: 'book-open' },
    { id: 'assignments', name: 'Assignments', icon: 'file-text' },
    { id: 'projects', name: 'Projects', icon: 'square-kanban' },
    { id: 'calendar', name: 'Calendar', icon: 'calendar-days' },
    { id: 'stats', name: 'Stats', icon: 'chart-column' },
    { id: 'prefs', name: 'Preferences', icon: 'sliders-horizontal' }
  ];

  function getScreenCounts() {
    const counts = D.model.counts(state.items, D.dates.today());
    return {
      todayOverdue: counts.overdue,
      todayDue: counts.today,
      homework: counts.homework,
      assignments: counts.assignments,
      projects: counts.projects
    };
  }

  function getSubjectCounts() {
    const counts = {};
    D.config.SUBJECTS.forEach(s => { counts[s.id] = 0; });
    state.items.forEach(i => {
      if (!D.model.isDone(i) && counts[i.subject] !== undefined) {
        counts[i.subject]++;
      }
    });
    return counts;
  }

  function renderSidebar() {
    const c = getScreenCounts();
    const sc = getSubjectCounts();
    const isLight = state.prefs.theme === 'light';

    let navHtml = SCREENS.map(s => {
      const isCurrent = s.id === state.activeScreen;
      let extra = '';
      if (s.id === 'today') {
        const badges = [];
        if (c.todayOverdue > 0) badges.push(`<span class="badge badge--overdue num" title="${c.todayOverdue} overdue">${c.todayOverdue}</span>`);
        if (c.todayDue > 0) badges.push(`<span class="badge badge--today num" title="${c.todayDue} due today">${c.todayDue}</span>`);
        if (badges.length) extra = `<span style="margin-left:auto;display:flex;gap:4px">${badges.join('')}</span>`;
      } else if (c[s.id] > 0) {
        extra = `<span class="nav__count num">${c[s.id]}</span>`;
      }
      return `<a href="#/${s.id}" class="nav__item" ${isCurrent ? 'aria-current="page"' : ''}>${D.icon(s.icon)}${D.ui.esc(s.name)}${extra}</a>`;
    }).join('');

    let subjHtml = D.config.SUBJECTS.map(s => {
      const isCurrent = s.id === state.activeSubject;
      const countStr = sc[s.id] > 0 ? `<span class="nav__count num">${sc[s.id]}</span>` : '';
      return `<a href="#" data-act="set-subject" data-id="${s.id}" class="nav__item nav__item--sm" ${isCurrent ? 'aria-current="page"' : ''}>${D.ui.subjectDot(s.id)}${D.ui.esc(s.name)}${countStr}</a>`;
    }).join('');

    return `
      <aside class="side">
        <div class="side__brand">Daybook</div>
        <nav class="nav" aria-label="Screens">${navHtml}</nav>
        <div>
          <div class="side__label">Subjects</div>
          <nav class="nav" aria-label="Filter by subject">
            ${subjHtml}
            ${state.activeSubject ? `<a href="#" data-act="set-subject" data-id="" class="nav__item nav__item--sm" style="color:var(--ink-faint);margin-top:4px">Clear filter</a>` : ''}
          </nav>
        </div>
        <div class="side__foot">
          <div class="seg" role="group" aria-label="Theme">
            <button class="seg__opt" data-act="set-theme" data-id="dark" aria-pressed="${!isLight}">${D.icon('moon', 'ico--sm')}Dark</button>
            <button class="seg__opt" data-act="set-theme" data-id="light" aria-pressed="${isLight}">${D.icon('sun', 'ico--sm')}Light</button>
          </div>
          <span>Saved on this laptop<br>
            <a href="#" data-act="export">Export JSON</a> &middot;
            <a href="#" data-act="import">Import</a> &middot;
            <a href="#" data-act="paste-json">Paste JSON</a>
          </span>
        </div>
      </aside>
    `;
  }

  function renderTopbar() {
    const screen = SCREENS.find(s => s.id === state.activeScreen) || SCREENS[0];
    const dateStr = D.dates.long(D.dates.today());
    
    return `
      <header class="top">
        <h1 class="top__title">${D.ui.esc(screen.name)}</h1>
        <span class="muted num">${D.ui.esc(dateStr)}</span>
        <div class="top__actions">
          <div class="input search" role="search">
            ${D.icon('search')}<input type="text" placeholder="Search" value="${D.ui.esc(state.searchQuery)}" style="border:none;background:transparent;outline:none;flex:1;min-width:0;color:inherit;"><kbd class="kbd">/</kbd>
          </div>
          <button class="btn" data-act="paste-json" style="margin-right: 8px;">
            ${D.icon('sparkles', 'ico--sm')}Paste AI Tasks
          </button>
          <button class="btn btn--primary" data-act="new-item">
            ${D.icon('plus')}New item<kbd class="kbd" style="background:transparent;border-color:inherit;color:inherit;">N</kbd>
          </button>
        </div>
      </header>
    `;
  }

  function render() {
    const app = document.getElementById('app');
    if (!app) return;
    
    // Check if the focus is on search to preserve it
    const activeEl = document.activeElement;
    const searchWasFocused = activeEl && activeEl.tagName === 'INPUT' && activeEl.closest('.search');
    const searchPos = searchWasFocused ? activeEl.selectionStart : 0;

    app.innerHTML = `
      ${renderSidebar()}
      <div class="main">
        ${renderTopbar()}
        <main class="page" id="page-content"></main>
      </div>
    `;

    if (searchWasFocused) {
      const newSearch = app.querySelector('.search input');
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(searchPos, searchPos);
      }
    }

    const pageContent = document.getElementById('page-content');
    if (D.screens && D.screens[state.activeScreen] && D.screens[state.activeScreen].render) {
      let filteredItems = state.items;
      if (state.activeSubject) {
        filteredItems = filteredItems.filter(i => i.subject === state.activeSubject);
      }
      if (state.searchQuery) {
        filteredItems = D.model.matches(filteredItems, state.searchQuery);
      }
      D.screens[state.activeScreen].render(pageContent, filteredItems, state);
    } else {
      pageContent.innerHTML = D.ui.emptyState('Under Construction', 'This screen is not built yet.', 'hammer');
    }
  }

  function route() {
    let hash = window.location.hash.replace(/^#\/?/, '');
    if (!SCREENS.find(s => s.id === hash)) {
      hash = 'today';
    }
    if (state.activeScreen !== hash && document.startViewTransition) {
      state.activeScreen = hash;
      document.startViewTransition(() => {
        render();
      });
    } else {
      state.activeScreen = hash;
      render();
    }
  }

  function saveAndRender() {
    D.store.saveItems(state.items);
    render();
  }

  function handleAction(act, id, e) {
    if (act === 'set-theme') {
      state.prefs.theme = id;
      D.setTheme(id);
      D.store.savePrefs(state.prefs);
      render();
    } else if (act === 'set-subject') {
      e.preventDefault();
      state.activeSubject = id || null;
      render();
    } else if (act === 'export') {
      e.preventDefault();
      const payload = { daybook: 1, exported_at: new Date().toISOString(), items: state.items };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daybook-${D.dates.today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
        } else if (act === 'paste-json') {
      e.preventDefault();
      const txt = prompt('Paste the JSON snippet from Claude/Gemini:');
      if (!txt) return;
      try {
        const data = JSON.parse(txt);
        const arr = Array.isArray(data) ? data : (data.items || []);
        if (arr.length === 0) {
          alert('No items found in JSON.');
          return;
        }
        const norm = D.model.normaliseAll(arr);
        if (confirm(`Found ${norm.length} items. Add them to your existing tasks? (Cancel to REPLACE all your current tasks with these new ones)`)) {
          // Add to existing
          D.store.backupItems(state.items);
          state.items = state.items.concat(norm);
          D.store.saveItems(state.items);
          render();
          D.ui.toast(`Added ${norm.length} items.`);
        } else {
          if (confirm('Are you sure you want to completely replace your current tasks?')) {
            D.store.backupItems(state.items);
            state.items = norm;
            D.store.saveItems(state.items);
            render();
            D.ui.toast(`Replaced with ${norm.length} items.`);
          }
        }
      } catch (err) {
        alert('Invalid JSON. Please ensure you copied the raw JSON correctly.');
      }
    } else if (act === 'import') {
      e.preventDefault();
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json';
      inp.onchange = ev => {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = fileE => {
          try {
            let raw = JSON.parse(fileE.target.result);
            if (raw && raw.items) raw = raw.items;
            if (!Array.isArray(raw)) throw new Error('Invalid format');
            
            if (confirm('Replace existing items? Cancel to Add instead.')) {
              D.store.backupItems(state.items);
              state.items = D.model.normaliseAll(raw);
            } else {
              state.items = state.items.concat(D.model.normaliseAll(raw));
            }
            saveAndRender();
            D.ui.toast('Import successful');
          } catch (err) {
            alert('Failed to import: ' + err.message);
          }
        };
        reader.readAsText(file);
      };
      inp.click();
    } else if (act === 'new-item') {
      if (D.drawer) D.drawer.open(null);
    } else if (act === 'toggle-done') {
      e.stopPropagation();
      const row = (e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('[data-key]');
      if (!row) return;
      const key = row.getAttribute('data-key');
      const item = state.items.find(i => i.id === key);
      if (item) {
        D.store.snapshot(state.items);
        D.model.toggleDone(item, D.dates.today());
        saveAndRender();
        D.ui.toast('Item updated', 'undo-action');
      }
    } else if (act === 'undo-action') {
      const snap = D.store.getSnapshot();
      if (snap) {
        state.items = snap;
        saveAndRender();
        D.ui.toast('Action undone');
      }
    } else if (act === 'open-item') {
      const key = id || ((e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('[data-key]') ? (e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('[data-key]').getAttribute('data-key') : null);
      if (key && D.drawer) D.drawer.open(key);
    }
  }

  document.addEventListener('click', e => {
    const t = (e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('[data-act]');
    if (t) {
      handleAction(t.getAttribute('data-act'), t.getAttribute('data-id'), e);
    }
  });

  document.addEventListener('input', e => {
    if (e.target.matches('.search input')) {
      state.searchQuery = e.target.value; // don't trim while typing
      render();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    // Roving tabindex for lists
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const active = document.activeElement;
      const allRows = Array.from(document.querySelectorAll('[tabindex="0"]')).filter(el => {
        // Only target rows in the main page content area
        return el.matches('.row, .row--compact, .row--tall, .table .row');
      });
      if (allRows.length === 0) return;
      
      const idx = allRows.indexOf(active);
      let nextIdx = 0;
      if (idx > -1) {
        nextIdx = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
        if (nextIdx >= allRows.length) nextIdx = 0;
        if (nextIdx < 0) nextIdx = allRows.length - 1;
      }
      e.preventDefault();
      allRows[nextIdx].focus();
      return;
    }
    
    if ((e.key === ' ' || e.key === 'Enter') && document.activeElement.matches('.row, .row--compact, .row--tall, .table .row')) {
      e.preventDefault();
      if (e.key === ' ') {
        handleAction('toggle-done', null, { target: document.activeElement, stopPropagation: () => {} });
      } else if (e.key === 'Enter') {
        handleAction('open-item', null, { target: document.activeElement });
      }
      return;
    }
    const targetTag = e.target.tagName.toLowerCase();
    
    // If inside a text input, skip global shortcuts except Esc
    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
      if (e.key === 'Enter' && e.target.id === 'global-ai-input') {
        e.preventDefault();
        D.askGlobalAI(e.target.value);
        e.target.value = '';
        return;
      }
      if (e.key === 'Escape') {
        if (e.target.matches('.search input')) {
          e.target.value = '';
          state.searchQuery = '';
          e.target.blur();
          render();
        } else if (D.drawer && D.drawer.isOpen) {
          D.drawer.close();
        }
      }
      return;
    }

    if (e.key >= '1' && e.key <= '6') {
      const idx = parseInt(e.key, 10) - 1;
      if (SCREENS[idx]) {
        e.preventDefault();
        window.location.hash = '#/' + SCREENS[idx].id;
      }
    } else if (e.key === 'n' || e.key === 'N') {
      if (D.drawer) {
        e.preventDefault();
        D.drawer.open(null);
      }
    } else if (e.key === '/') {
      e.preventDefault();
      const s = document.querySelector('.search input');
      if (s) {
        s.focus();
        s.setSelectionRange(s.value.length, s.value.length);
      }
    } else if (e.key === 'Escape') {
      if (D.drawer && D.drawer.isOpen) D.drawer.close();
    }
  });

  function boot() {
    state.prefs = D.store.loadPrefs();
    D.setTheme(state.prefs.theme);
    document.body.style.zoom = state.prefs.zoom || 1;
    state.items = D.store.loadItems();
    
    window.addEventListener('hashchange', route);
    route(); // Initial render
  }

  D.app = { state, render: saveAndRender }; 

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
