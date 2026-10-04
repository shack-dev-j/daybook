(function (root) {
  'use strict';
  const D = root.Daybook;

  let currentItem = null;
  let returnFocusEl = null;
  let scrimEl = null;
  let drawerEl = null;

  function renderHead() {
    if (!currentItem) return '';
    const typ = D.model.type(currentItem.type);
    let timeTagHtml = '';
    const state = D.model.timeState(currentItem.due_date, D.model.isDone(currentItem), D.dates.today());
    if (state === 'today') {
      timeTagHtml = D.ui.tag('Today', 'tag--today', 'circle');
    } else if (state === 'overdue') {
      timeTagHtml = D.ui.tag('Overdue', 'tag--overdue', 'triangle-alert');
    }
    
    return `
      <span class="tag tag--${typ.tag}">${D.icon(typ.icon)}${D.ui.esc(typ.name)}</span>${timeTagHtml}
      <span style="margin-left:auto;display:flex;gap:2px;align-items:center">
        <button class="btn btn--ghost btn--icon" data-act="drawer-prev" aria-label="Previous item">${D.icon('chevron-up')}</button>
        <button class="btn btn--ghost btn--icon" data-act="drawer-next" aria-label="Next item">${D.icon('chevron-down')}</button>
        <button class="btn btn--ghost" data-act="drawer-close" aria-label="Close"><kbd class="kbd">Esc</kbd>${D.icon('x')}</button>
      </span>
    `;
  }

  function renderProps() {
    if (!currentItem) return '';
    const typeOpts = D.config.TYPES.map(t => 
      `<button class="seg__opt" data-act="drawer-set-type" data-id="${t.id}" aria-pressed="${currentItem.type === t.id}">${D.ui.esc(t.name)}</button>`
    ).join('');

    const subj = D.model.subject(currentItem.subject);
    const prioOpts = D.config.PRIORITIES.map(p => 
      `<button class="seg__opt" data-act="drawer-set-prio" data-id="${p.id}" aria-pressed="${currentItem.priority === p.id}">${D.ui.esc(p.name)}</button>`
    ).join('');

    const statuses = D.model.statusList(currentItem.type);
    const statusOpts = statuses.map(s => 
      `<button class="seg__opt" data-act="drawer-set-status" data-id="${s.id}" aria-pressed="${currentItem.status === s.id}">${D.ui.esc(s.name)}</button>`
    ).join('');

    let scoreHtml = '';
    if (currentItem.type === 'assignment') {
      const got = currentItem.score && currentItem.score.got != null ? currentItem.score.got : '';
      const outOf = currentItem.score && currentItem.score.outOf != null ? currentItem.score.outOf : '100'; // Default to 100 if none? or leave empty
      const placeholder = '—';
      scoreHtml = `
        <dt>Score</dt>
        <dd>
          <input class="input num" style="width:56px" placeholder="${placeholder}" aria-label="Score got" data-act="drawer-score-got" value="${got}">
          <span class="muted num" style="margin: 0 4px">/</span>
          <input class="input num" style="width:56px" placeholder="${placeholder}" aria-label="Score out of" data-act="drawer-score-out" value="${outOf}">
          <span class="muted" style="font-size:12px;margin-left:auto">Fill in when returned</span>
        </dd>
      `;
    }

    return `
      <dt>Type</dt><dd><div class="seg" role="group" aria-label="Type">${typeOpts}</div></dd>
      <dt>Subject</dt>
      <dd>
        <button type="button" class="select" data-act="drawer-pick-subject">
          ${D.ui.subjectDot(subj.id)}${D.ui.esc(subj.name)}${D.icon('chevron-down', 'ico--sm')}
        </button>
      </dd>
      <dt>Due date</dt>
      <dd>
        <button type="button" class="select num" data-act="drawer-pick-date">
          ${D.icon('calendar', 'ico--sm')}
          ${currentItem.due_date ? D.ui.esc(D.dates.short(currentItem.due_date)) : 'No date'}
          ${D.icon('chevron-down', 'ico--sm')}
        </button>
      </dd>
      <dt>Priority</dt><dd><div class="seg" role="group" aria-label="Priority">${prioOpts}</div></dd>
      <dt>Status</dt><dd><div class="seg" role="group" aria-label="Status">${statusOpts}</div></dd>
      ${scoreHtml}
    `;
  }

  function renderChecklist() {
    if (!currentItem) return '';
    const p = D.model.progress(currentItem);
    const subjId = currentItem.subject;
    const isProject = currentItem.type === 'project';
    
    let html = `
      <div class="checklist__head drawer__label">
        ${isProject ? 'Milestones' : 'Checklist'}
        <span class="num" style="font-weight:400">${p.done} of ${p.total}</span>
        <span class="progress" role="progressbar" aria-valuenow="${p.done}" aria-valuemin="0" aria-valuemax="${p.total}">
          <span class="progress__fill fill--${D.ui.subjectClass(subjId)}" style="width:${p.pct}%"></span>
        </span>
      </div>
      <ul>
    `;
    
    currentItem.checklist.forEach(step => {
      const icon = step.done ? 'check' : 'circle';
      const label = step.done ? 'Untick step' : 'Tick step';
      html += `
        <li class="checklist__item ${step.done ? 'is-done' : ''}">
          <span class="check" role="checkbox" tabindex="0" aria-checked="${step.done}" aria-label="${label}" title="${label}" data-act="drawer-toggle-step" data-id="${step.id}">
            ${D.icon(icon)}
          </span>
          <span class="checklist__text grow" contenteditable="true" data-act="drawer-edit-step" data-id="${step.id}">${D.ui.esc(step.text)}</span>
          ${isProject ? `<span class="checklist__date num muted" style="margin-left:8px;font-size:12px;cursor:pointer;white-space:nowrap" data-act="drawer-step-date" data-id="${step.id}">${step.due ? D.ui.esc(D.dates.short(step.due)) : 'No date'}</span>` : ''}
          <button class="btn btn--ghost btn--icon" data-act="drawer-delete-step" data-id="${step.id}" aria-label="Delete step">${D.icon('x')}</button>
        </li>
      `;
    });
    
    html += `</ul>
      <div class="checklist__add" data-act="drawer-add-step">
        ${D.icon('plus')}<span>Add a step</span>
      </div>
    `;
    if (currentItem.type === 'project' && !D.model.githubLink(currentItem)) {
      html += `
        <div class="checklist__add" data-act="drawer-add-github">
          ${D.icon('github')}<span>Add GitHub link</span>
        </div>
      `;
    }
    return html;
  }

  function renderLinks() {
    if (!currentItem) return '';
    let html = '';
    currentItem.links.forEach((l, i) => {
      html += `
        <div class="linkrow">
          ${D.icon('link', 'ico--sm')}
          <a class="clip grow" href="${D.ui.esc(l.url)}" target="_blank" rel="noopener">${D.ui.esc(l.label || l.url)}</a>
          <button class="btn btn--ghost btn--icon" data-act="drawer-delete-link" data-id="${i}" aria-label="Delete link">${D.icon('x', 'ico--sm')}</button>
        </div>
      `;
    });
    html += `
      <div class="checklist__add" data-act="drawer-add-link">
        ${D.icon('plus')}<span>Paste a link</span>
      </div>
    `;
    return html;
  }

  function renderFoot() {
    if (!currentItem) return '';
    const created = currentItem.created_at ? D.dates.short(currentItem.created_at) : '—';
    const completed = currentItem.completed_at ? D.dates.short(currentItem.completed_at) : '—';
    return `
      <span class="muted num" style="font-size:12px;line-height:16px">Created ${D.ui.esc(created)}<br>Completed ${D.ui.esc(completed)}</span>
      <span style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn--danger" data-act="drawer-delete">
          ${D.icon('trash-2')}Delete
        </button>
        <button class="btn btn--primary" data-act="drawer-mark-done">
          ${D.icon('check')}${D.model.isDone(currentItem) ? 'Reopen' : 'Mark done'}
        </button>
      </span>
    `;
  }

  function renderDrawer() {
    if (!drawerEl) {
      scrimEl = document.createElement('div');
      scrimEl.className = 'scrim';
      scrimEl.addEventListener('click', D.drawer.close);
      
      drawerEl = document.createElement('aside');
      drawerEl.className = 'drawer';
      drawerEl.style.animation = 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      drawerEl.setAttribute('role', 'dialog');
      drawerEl.setAttribute('aria-label', 'Task details');
      
      drawerEl.innerHTML = `
        <header class="drawer__head"></header>
        <div class="drawer__body">
          <h2 class="drawer__title" contenteditable="true" data-act="drawer-edit-title"></h2>
          <dl class="props"></dl>
          <div class="checklist"></div>
          <div class="drawer__section">
            <span class="drawer__label">Notes</span>
            <div class="textarea" contenteditable="true" style="min-height:52px" data-act="drawer-edit-notes"></div>
          </div>
          <div class="drawer__section link-section">
            <span class="drawer__label">Links</span>
            <div class="links-container"></div>
          </div>
        </div>
        <footer class="drawer__foot"></footer>
      `;
      
      document.body.appendChild(scrimEl);
      document.body.appendChild(drawerEl);
      
      // Event listener for contenteditable input
      drawerEl.addEventListener('input', e => {
        const act = e.target.getAttribute('data-act');
        if (act === 'drawer-edit-title') {
          currentItem.title = e.target.innerText.replace(/\\n/g, ' ');
          D.app.render(); // save and update background
        } else if (act === 'drawer-edit-notes') {
          currentItem.notes = e.target.innerText;
          D.app.render();
        } else if (act === 'drawer-edit-step') {
          const stepId = e.target.getAttribute('data-id');
          const step = currentItem.checklist.find(s => s.id === stepId);
          if (step) {
            step.text = e.target.innerText;
            D.app.render();
          }
        } else if (act === 'drawer-score-got' || act === 'drawer-score-out') {
          const gotEl = drawerEl.querySelector('[data-act="drawer-score-got"]');
          const outEl = drawerEl.querySelector('[data-act="drawer-score-out"]');
          if (gotEl && outEl) {
            const got = parseFloat(gotEl.value);
            const outOf = parseFloat(outEl.value);
            currentItem.score = { got: isNaN(got) ? null : got, outOf: isNaN(outOf) ? null : outOf };
            D.app.render();
          }
        }
      });
      
      drawerEl.addEventListener('keydown', e => {
        if (e.key === 'Escape') D.drawer.close();
      });
    }

    // Update contents safely without overwriting actively typing fields
    drawerEl.querySelector('.drawer__head').innerHTML = renderHead();
    if (document.activeElement !== drawerEl.querySelector('.drawer__title')) {
      drawerEl.querySelector('.drawer__title').innerText = currentItem.title || '';
    }
    drawerEl.querySelector('.props').innerHTML = renderProps();
    
    // For checklist, only overwrite if not editing a step
    const editingStep = document.activeElement && document.activeElement.hasAttribute('data-act') && document.activeElement.getAttribute('data-act') === 'drawer-edit-step';
    if (!editingStep) {
      drawerEl.querySelector('.checklist').innerHTML = renderChecklist();
    }
    
    if (document.activeElement !== drawerEl.querySelector('.textarea')) {
      drawerEl.querySelector('.textarea').innerText = currentItem.notes || '';
    }
    
    drawerEl.querySelector('.links-container').innerHTML = renderLinks();
    drawerEl.querySelector('.drawer__foot').innerHTML = renderFoot();
  }

  // Delegated clicks
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t || !drawerEl) return;
    const act = t.getAttribute('data-act');
    const id = t.getAttribute('data-id');

    if (act === 'drawer-close') {
      D.drawer.close();
    
    
    } else if (act === 'drawer-step-date') {
      const menu = document.createElement('div');
      menu.style.cssText = 'position:absolute;background:var(--surface-raised);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-pop);padding:8px;display:flex;flex-direction:column;gap:4px;z-index:100;width:200px;';
      const rect = t.getBoundingClientRect();
      menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      menu.style.left = (rect.left + window.scrollX) + 'px';
      
      const step = currentItem.checklist.find(s => s.id === id);
      if (!step) return;
      
      const today = D.dates.today();
      const options = [
        { label: 'Today', date: today },
        { label: 'Tomorrow', date: D.dates.add(today, 1) },
        { label: 'In a week', date: D.dates.add(today, 7) },
        { label: 'No date', date: null }
      ];
      
      options.forEach(o => {
        const b = document.createElement('button');
        b.className = 'btn btn--ghost';
        b.style.justifyContent = 'flex-start';
        b.innerText = o.label + (o.date ? ' (' + D.dates.short(o.date) + ')' : '');
        b.onclick = () => {
          step.due = o.date;
          D.app.render();
          renderDrawer();
          menu.remove();
        };
        menu.appendChild(b);
      });
      
      const inputWrap = document.createElement('div');
      inputWrap.style.marginTop = '8px';
      inputWrap.style.borderTop = '1px solid var(--border)';
      inputWrap.style.paddingTop = '8px';
      
      const input = document.createElement('input');
      input.type = 'date';
      input.className = 'input';
      input.style.width = '100%';
      input.value = step.due || '';
      input.onchange = () => {
        if (input.value) {
          step.due = input.value;
          D.app.render();
          renderDrawer();
        }
        menu.remove();
      };
      inputWrap.appendChild(input);
      menu.appendChild(inputWrap);
      
      document.body.appendChild(menu);
      
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== t) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);

    } else if (act === 'drawer-pick-subject') {
      const menu = document.createElement('div');
      menu.style.cssText = 'position:absolute;background:var(--surface-raised);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-pop);padding:4px;display:flex;flex-direction:column;gap:4px;z-index:100;';
      const rect = t.getBoundingClientRect();
      menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      menu.style.left = (rect.left + window.scrollX) + 'px';
      
      D.config.SUBJECTS.forEach(s => {
        const b = document.createElement('button');
        b.className = 'btn btn--ghost';
        b.style.justifyContent = 'flex-start';
        b.innerHTML = D.ui.subjectDot(s.id) + D.ui.esc(s.name);
        b.onclick = () => {
          currentItem.subject = s.id;
          D.app.render();
          renderDrawer();
          menu.remove();
        };
        menu.appendChild(b);
      });
      
      document.body.appendChild(menu);
      
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== t) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);

    } else if (act === 'drawer-pick-date') {
      const menu = document.createElement('div');
      menu.style.cssText = 'position:absolute;background:var(--surface-raised);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-pop);padding:8px;display:flex;flex-direction:column;gap:4px;z-index:100;width:200px;';
      const rect = t.getBoundingClientRect();
      menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      menu.style.left = (rect.left + window.scrollX) + 'px';
      
      const today = D.dates.today();
      const options = [
        { label: 'Today', date: today },
        { label: 'Tomorrow', date: D.dates.add(today, 1) },
        { label: 'In a week', date: D.dates.add(today, 7) },
        { label: 'No date', date: null }
      ];
      
      options.forEach(o => {
        const b = document.createElement('button');
        b.className = 'btn btn--ghost';
        b.style.justifyContent = 'flex-start';
        b.innerText = o.label + (o.date ? ' (' + D.dates.short(o.date) + ')' : '');
        b.onclick = () => {
          currentItem.due_date = o.date;
          D.app.render();
          renderDrawer();
          menu.remove();
        };
        menu.appendChild(b);
      });
      
      const inputWrap = document.createElement('div');
      inputWrap.style.marginTop = '8px';
      inputWrap.style.borderTop = '1px solid var(--border)';
      inputWrap.style.paddingTop = '8px';
      
      const input = document.createElement('input');
      input.type = 'date';
      input.className = 'input';
      input.style.width = '100%';
      input.value = currentItem.due_date || '';
      input.onchange = () => {
        if (input.value) {
          currentItem.due_date = input.value;
          D.app.render();
          renderDrawer();
        }
        menu.remove();
      };
      inputWrap.appendChild(input);
      menu.appendChild(inputWrap);
      
      document.body.appendChild(menu);
      
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== t) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);

    } else if (act === 'drawer-set-type') {
      D.model.setType(currentItem, id, D.dates.today());
      D.app.render();
      renderDrawer();
    } else if (act === 'drawer-set-prio') {
      currentItem.priority = id;
      D.app.render();
      renderDrawer();
    } else if (act === 'drawer-set-status') {
      D.model.setStatus(currentItem, id, D.dates.today());
      D.app.render();
      renderDrawer();
    } else if (act === 'drawer-toggle-step') {
      D.model.toggleStep(currentItem, id, D.dates.today());
      D.app.render();
      renderDrawer();
    } else if (act === 'drawer-add-step') {
      currentItem.checklist.push(D.model.blankStep(''));
      D.app.render();
      renderDrawer();
      const items = drawerEl.querySelectorAll('.checklist__text');
      if (items.length) items[items.length - 1].focus();
    } else if (act === 'drawer-delete-step') {
      currentItem.checklist = currentItem.checklist.filter(s => s.id !== id);
      D.app.render();
      renderDrawer();
    } else if (act === 'drawer-mark-done') {
      D.model.toggleDone(currentItem, D.dates.today());
      D.app.render();
      renderDrawer();
    } else if (act === 'drawer-delete') {
      D.app.state.items = D.app.state.items.filter(i => i.id !== currentItem.id);
      D.store.snapshot(D.app.state.items); // Should we take snapshot before delete? Yes, in handleAction undo... Wait, delete implies undoable.
      D.app.render();
      D.drawer.close();
      D.ui.toast('Item deleted', 'undo-action');
    } else if (act === 'drawer-add-github') {
      const url = prompt('Paste GitHub repository URL:');
      if (url) {
        const link = D.model.parseLink(url) || { url: D.model.cleanUrl(url), label: 'GitHub repo' };
        if (link && link.url && D.model.isGithub(link.url)) {
          currentItem.links.unshift(link); // Put Github link first
          D.app.render();
          renderDrawer();
        } else {
          alert('Not a valid GitHub URL.');
        }
      }
    } else if (act === 'drawer-add-link') {
      const url = prompt('Paste link URL:');
      if (url) {
        const link = D.model.parseLink(url) || { url: D.model.cleanUrl(url), label: url };
        if (link && link.url) {
          currentItem.links.push(link);
          D.app.render();
          renderDrawer();
        }
      }
    } else if (act === 'drawer-delete-link') {
      currentItem.links.splice(parseInt(id, 10), 1);
      D.app.render();
      renderDrawer();
    }
  });

  D.drawer = {
    open: function(itemId) {
      if (itemId) {
        currentItem = D.app.state.items.find(i => i.id === itemId);
      }
      if (!currentItem) {
        currentItem = D.model.blank('homework');
        D.app.state.items.push(currentItem);
        D.store.saveItems(D.app.state.items);
      }
      renderDrawer();
      this.isOpen = true;
      returnFocusEl = document.activeElement;
      // Focus drawer title or first input
      setTimeout(() => {
        if (drawerEl) drawerEl.querySelector('.drawer__title').focus();
      }, 0);
    },
    close: function() {
      if (drawerEl) {
        drawerEl.remove();
        drawerEl = null;
      }
      if (scrimEl) {
        scrimEl.remove();
        scrimEl = null;
      }
      currentItem = null;
      this.isOpen = false;
      if (returnFocusEl && document.body.contains(returnFocusEl)) {
        returnFocusEl.focus();
      } else if (currentItem) {
        // Try finding the row by data-key
        const row = document.querySelector(`[data-key="${currentItem.id}"]`);
        if (row) row.focus();
      }
      D.app.render();
    },
    isOpen: false
  };

})(window);
