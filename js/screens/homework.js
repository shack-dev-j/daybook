(function (root) {
  'use strict';
  const D = root.Daybook;

  D.screens = D.screens || {};

  let localState = {
    filter: 'open', // open, done, all
    collapsedGroups: {} // subjectId -> boolean
  };

  // Build a simple inline menu HTML
  function renderMenu(items, actPrefix, currentValue) {
    // items: [{ id, label, iconHtml }]
    return `
      <div class="menu" style="position:absolute;top:100%;left:0;background:var(--surface-raised);border:2px solid var(--border);border-radius:var(--radius-md);box-shadow:none;z-index:9999;min-width:140px;padding:4px;display:none;flex-direction:column;gap:2px;">
        ${items.map(i => `
          <button type="button" class="menu__item ${i.id === currentValue ? 'is-active' : ''}" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:none;background:transparent;width:100%;text-align:left;cursor:pointer;border-radius:var(--radius-sm);color:var(--ink);" data-act="${actPrefix}" data-id="${i.id}">
            ${i.iconHtml || ''}${D.ui.esc(i.label)}
          </button>
        `).join('')}
      </div>
    `;
  }

  function getSubjectPrefs() {
    return D.app.state.prefs.hwSubject || 'other';
  }
  function getDuePrefs() {
    return D.app.state.prefs.hwDue || 'tomorrow';
  }
  function getPrioPrefs() {
    return D.app.state.prefs.hwPrio || 'med';
  }

  D.screens.homework = {
    render: function (container, items, state) {
      const hwItems = items.filter(i => i.type === 'homework');
      
      let filtered = hwItems;
      if (localState.filter === 'open') filtered = hwItems.filter(i => !D.model.isDone(i));
      if (localState.filter === 'done') filtered = hwItems.filter(i => D.model.isDone(i));

      const sorted = filtered.sort(D.model.sortItems.due);
      
      const subjPref = getSubjectPrefs();
      const duePref = getDuePrefs();
      const prioPref = getPrioPrefs();

      const subj = D.model.subject(subjPref);
      const prio = D.model.priority(prioPref);
      
      let dueLabel = 'No date';
      if (duePref === 'today') dueLabel = 'Today';
      if (duePref === 'tomorrow') dueLabel = 'Tomorrow';
      if (duePref === 'nextweek') dueLabel = 'In a week';

      let html = `
        <form class="quickadd" id="hw-quickadd" aria-label="Quick add homework" style="position:relative;z-index:2">
          ${D.icon('book-open')}
          <input class="input" id="hw-title-input" placeholder="Add homework and press Enter, e.g. “Exercise 2B odd”" autocomplete="off">
          
          <div style="position:relative;">
            <button type="button" class="select" data-act="hw-toggle-menu" data-id="subj-menu">
              ${D.ui.subjectDot(subj.id)}${D.ui.esc(subj.name)}${D.icon('chevron-down', 'ico--sm')}
            </button>
            ${renderMenu(D.config.SUBJECTS.map(s => ({ id: s.id, label: s.name, iconHtml: D.ui.subjectDot(s.id) })), 'hw-set-subj', subj.id)}
          </div>

          <div style="position:relative;">
            <button type="button" class="select num" data-act="hw-toggle-menu" data-id="due-menu">
              ${D.icon('calendar', 'ico--sm')}${D.ui.esc(dueLabel)}${D.icon('chevron-down', 'ico--sm')}
            </button>
            ${renderMenu([
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'nextweek', label: 'In a week' },
              { id: 'nodate', label: 'No date' }
            ], 'hw-set-due', duePref)}
          </div>

          <div style="position:relative;">
            <button type="button" class="select" data-act="hw-toggle-menu" data-id="prio-menu">
              ${D.icon(prio.icon, 'ico--sm')}${D.ui.esc(prio.name)}${D.icon('chevron-down', 'ico--sm')}
            </button>
            ${renderMenu(D.config.PRIORITIES.map(p => ({ id: p.id, label: p.name, iconHtml: D.icon(p.icon, 'ico--sm') })), 'hw-set-prio', prio.id)}
          </div>

          <button class="btn" type="submit">Add<kbd class="kbd">↵</kbd></button>
        </form>
      `;

      if (hwItems.length === 0) {
        html += D.ui.emptyState('No homework yet', 'Type it in the row above and press Enter.', 'book-open');
        container.innerHTML = html;
        return;
      }

      html += `
        <div class="toolbar">
          <div class="seg" role="group" aria-label="Show">
            <button class="seg__opt" data-act="hw-filter" data-id="open" aria-pressed="${localState.filter === 'open'}">Open <span class="num">${hwItems.filter(i => !D.model.isDone(i)).length}</span></button>
            <button class="seg__opt" data-act="hw-filter" data-id="done" aria-pressed="${localState.filter === 'done'}">Done <span class="num">${hwItems.filter(i => D.model.isDone(i)).length}</span></button>
            <button class="seg__opt" data-act="hw-filter" data-id="all" aria-pressed="${localState.filter === 'all'}">All <span class="num">${hwItems.length}</span></button>
          </div>
          <div style="position:relative;display:inline-block;">
            <button class="select" style="width:auto" data-act="hw-toggle-menu" data-id="group-menu">Group: ${localState.group === 'subject' ? 'Subject' : 'Status'}${D.icon('chevron-down', 'ico--sm')}</button>
            ${renderMenu([{id:'subject', label:'Subject'}, {id:'status', label:'Status'}], 'hw-set-group', localState.group)}
          </div>
          <div style="position:relative;display:inline-block;">
            <button class="select" style="width:auto" data-act="hw-toggle-menu" data-id="sort-menu">Sort: ${localState.sort === 'due' ? 'Due date' : 'Priority'}${D.icon('chevron-down', 'ico--sm')}</button>
            ${renderMenu([{id:'due', label:'Due date'}, {id:'priority', label:'Priority'}], 'hw-set-sort', localState.sort)}
          </div>
          <div class="toolbar__end hints">
            <span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd>Move</span>
            <span><kbd class="kbd">Space</kbd>Done</span>
            <span><kbd class="kbd">Enter</kbd>Open</span>
          </div>
        </div>
      `;

      if (sorted.length === 0) {
        html += D.ui.emptyStateInline('No matching homework.', 'book-open');
        container.innerHTML = html;
        return;
      }

      html += `<div class="table">`;
      html += `<div class="cols"><span style="width:16px"></span><span class="grow">Homework</span><span class="c-due">Due</span><span class="c-status">Status</span><span class="c-prio">Priority</span><span class="c-go"></span></div>`;

      // Apply custom sorting
      sorted.sort((a, b) => {
        if (localState.sort === 'priority') {
          const w = {'high':3, 'med':2, 'low':1};
          const pa = w[D.model.priority(a.priority).id]||0;
          const pb = w[D.model.priority(b.priority).id]||0;
          if (pa !== pb) return pb - pa;
        }
        if (!a.due_date && b.due_date) return 1;
        if (a.due_date && !b.due_date) return -1;
        if (a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
        return 0;
      });

      // Group by dynamic key
      const grouped = {};
      sorted.forEach(i => {
        const key = localState.group === 'status' ? i.status : i.subject;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(i);
      });

      Object.keys(grouped).forEach(keyId => {
        let titleHtml = '';
        if (localState.group === 'status') {
          const st = D.model.status('homework', keyId);
          titleHtml = `${D.icon(st.icon, 'ico--sm')}${D.ui.esc(st.name)}`;
        } else {
          const s = D.model.subject(keyId);
          titleHtml = `${D.ui.subjectDot(s.id)}${D.ui.esc(s.name)}`;
        }
        
        const gItems = grouped[keyId];
        const isCol = localState.collapsedGroups[keyId];
        html += `
          <div class="group__head" data-act="hw-toggle-group" data-id="${keyId}" style="cursor:pointer">
            ${D.icon(isCol ? 'chevron-right' : 'chevron-down', 'ico--sm')}
            ${titleHtml}
            <span class="muted num" style="font-weight:400">${gItems.length}</span>
          </div>
        `;
        if (!isCol) {
          html += `<ul>`;
          gItems.forEach(item => {
            const timeState = D.model.itemState(item, D.dates.today());
            let rowCls = 'row';
            if (timeState === 'today') rowCls += ' is-today';
            if (timeState === 'overdue') rowCls += ' is-overdue';
            if (timeState === 'done') rowCls += ' is-done';

            const rel = item.due_date ? D.dates.relative(item.due_date, D.dates.today()) : '';
            let dueHtml = '';
            if (item.due_date) {
              const short = D.dates.short(item.due_date);
              let tagHtml = `<span class="muted num" style="font-size:12px">${rel}</span>`;
              if (timeState === 'today') tagHtml = `<span class="tag tag--today">${D.icon('clock')}Today</span>`;
              if (timeState === 'overdue') tagHtml = `<span class="tag tag--overdue num">${D.icon('triangle-alert')}${rel}</span>`;
              dueHtml = `<span class="num">${short}</span>${tagHtml}`;
            }

            const stat = D.model.status('homework', item.status);
            const pr = D.model.priority(item.priority);

            let checklistHtml = '';
            const p = D.model.progress(item);
            if (p.total > 0) {
              checklistHtml = `<span class="muted" style="font-size:12px;display:inline-flex;gap:4px;align-items:center">${D.icon('list-todo', 'ico--sm')}<span class="num">${p.done}/${p.total}</span></span>`;
            }

            html += `
              <li class="${rowCls}" data-key="${item.id}" data-act="open-item" tabindex="0">
                ${D.ui.checkbox(D.model.isDone(item))}
                <span class="row__title">${D.ui.esc(item.title)}</span>${checklistHtml}
                <span class="c-due">${dueHtml}</span>
                <span class="c-status">
                  <span class="tag tag--${stat.tag}" data-act="hw-cycle-status" data-id="${item.id}" style="cursor:pointer" title="Click to cycle status">
                    ${D.icon(stat.icon)}${D.ui.esc(stat.name)}
                  </span>
                </span>
                <span class="c-prio">
                  <span class="prio ${pr.id === 'high' ? 'prio--high' : ''}">${D.icon(pr.icon, 'ico--sm')}${D.ui.esc(pr.name)}</span>
                </span>
                <span class="c-go">${D.icon('chevron-right')}</span>
              </li>
            `;
          });
          html += `</ul>`;
        }
      });
      html += `</div>`; // .table

      container.innerHTML = html;
    }
  };

  function closeMenus() {
    document.querySelectorAll('.quickadd .menu').forEach(m => m.style.display = 'none');
  }

  // Global click for our specific actions
  document.addEventListener('click', e => {
    if (D.app.state.activeScreen !== 'homework') return;

    const t = e.target.closest('[data-act]');
    if (!t) {
      closeMenus();
      return;
    }

    const act = t.getAttribute('data-act');
    const id = t.getAttribute('data-id');

    if (act === 'hw-filter') {
      localState.filter = id;
      D.app.render();
    } else if (act === 'hw-toggle-group') {
      localState.collapsedGroups[id] = !localState.collapsedGroups[id];
      D.app.render();
    } else if (act === 'hw-cycle-status') {
      e.stopPropagation();
      const item = D.app.state.items.find(i => i.id === id);
      if (item) {
        D.store.snapshot(D.app.state.items);
        D.model.cycleStatus(item, D.dates.today());
        D.app.render();
      }
    } else if (act === 'hw-toggle-menu') {
      e.stopPropagation();
      const menu = t.nextElementSibling;
      const isVis = menu.style.display === 'flex';
      closeMenus();
      if (!isVis) menu.style.display = 'flex';
    } else if (act === 'hw-set-subj' || act === 'hw-set-due' || act === 'hw-set-prio') {
      e.stopPropagation();
      if (act === 'hw-set-group') { localState.group = id; D.app.render(); return; }
      if (act === 'hw-set-sort') { localState.sort = id; D.app.render(); return; }
      if (act === 'hw-set-subj') D.app.state.prefs.hwSubject = id;
      if (act === 'hw-set-due') D.app.state.prefs.hwDue = id;
      if (act === 'hw-set-prio') D.app.state.prefs.hwPrio = id;
      D.store.savePrefs(D.app.state.prefs);
      D.app.render();
    }
  });

  // Handle Quick Add Submit
  document.addEventListener('submit', e => {
    if (D.app.state.activeScreen !== 'homework') return;
    if (e.target.id === 'hw-quickadd') {
      e.preventDefault();
      const titleInput = document.getElementById('hw-title-input');
      const title = titleInput.value.trim();
      if (!title) return;

      const subj = getSubjectPrefs();
      const duePref = getDuePrefs();
      const prio = getPrioPrefs();

      let due_date = null;
      if (duePref === 'today') due_date = D.dates.today();
      if (duePref === 'tomorrow') due_date = D.dates.add(D.dates.today(), 1);
      if (duePref === 'nextweek') due_date = D.dates.add(D.dates.today(), 7);

      const newItem = D.model.blank('homework', {
        title,
        subject: subj,
        priority: prio,
        due_date
      });

      D.store.snapshot(D.app.state.items);
      D.app.state.items.push(newItem);
      D.app.render();
      
      // Keep focus on input
      setTimeout(() => {
        const t = document.getElementById('hw-title-input');
        if (t) t.focus();
      }, 0);
    }
  });

})(window);
