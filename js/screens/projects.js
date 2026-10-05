(function (root) {
  'use strict';
  const D = root.Daybook;

  let draggedId = null;

  function handleDragStart(e) {
    const card = (e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('article.card');
    if (!card) return;
    draggedId = card.getAttribute('data-key');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
  }

  function handleDragOver(e) {
    if ((e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('section.col')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(e) {
    const col = (e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('section.col');
    if (!col || !draggedId) return;
    e.preventDefault();
    
    const newStatus = col.getAttribute('data-status');
    const item = D.app.state.items.find(i => i.id === draggedId);
    if (item && item.status !== newStatus && D.model.statusList(item.type).find(s => s.id === newStatus)) {
      D.store.snapshot(D.app.state.items);
      D.model.setStatus(item, newStatus, D.dates.today());
      D.app.render();
    }
    draggedId = null;
  }

  function handleKeyDown(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    
    const card = (e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('article.card');
    if (!card || e.ctrlKey || e.altKey || e.metaKey) return;
    
    const itemId = card.getAttribute('data-key');
    const item = D.app.state.items.find(i => i.id === itemId);
    if (!item) return;

    e.preventDefault();
    D.store.snapshot(D.app.state.items);
    if (D.model.moveProject(item, e.key === 'ArrowLeft' ? -1 : 1, D.dates.today())) {
      D.app.render();
      restoreFocus(itemId);
    }
  }

  function restoreFocus(id) {
    setTimeout(() => {
      const el = document.querySelector(`article.card[data-key="${id}"]`);
      if (el) el.focus();
    }, 0);
  }

  function handleNewProject(e) {
    const t = (e.target.nodeType === 3 ? e.target.parentNode : e.target).closest('[data-act="new-project"]');
    if (t) {
      e.preventDefault();
      e.stopPropagation();
      const statusId = t.getAttribute('data-id') || 'idea';
      const subj = D.app.state.activeSubject || 'other';
      const item = D.model.blank('project');
      item.status = statusId;
      item.subject = subj;
      D.app.state.items.push(item);
      D.app.render();
      if (D.drawer) D.drawer.open(item.id);
    }
  }

  function renderCard(item) {
    const subj = D.model.subject(item.subject);
    const p = D.model.progress(item);
    const nextAct = D.model.nextAction(item);
    const link = D.model.githubLink(item);
    const date = D.model.dueOf(item);
    const isDone = D.model.isDone(item);
    const timeState = D.model.timeState(date, isDone, D.dates.today());

    let dateTag = '';
    if (isDone && item.completed_at) {
      dateTag = `<span class="tag tag--done num">${D.icon('check')}${D.dates.short(item.completed_at)}</span>`;
    } else if (!isDone && timeState === 'today') {
      dateTag = `<span class="tag tag--today">${D.icon('clock')}Today</span>`;
    } else if (!isDone && timeState === 'overdue') {
      dateTag = `<span class="tag tag--overdue num">${D.icon('triangle-alert')}${D.dates.short(date)}</span>`;
    } else if (date) {
      dateTag = `<span class="muted num" style="font-size:12px">${D.dates.short(date)}</span>`;
    }

    let progressHtml = '';
    if (p.total > 0) {
      progressHtml = `
        <span class="progress" role="progressbar" aria-valuenow="${p.done}" aria-valuemin="0" aria-valuemax="${p.total}">
          <span class="progress__fill fill--${isDone ? 'done' : D.ui.subjectClass(subj.id)}" style="width:${p.pct}%"></span>
        </span>
        <span class="muted num" style="font-size:12px">${p.done}/${p.total}</span>
      `;
    }
    const cardRowProgress = progressHtml ? `<div class="card__row">${progressHtml}</div>` : '';

    let nextHtml = '';
    if (isDone) {
      nextHtml = `<div class="next muted">${D.icon('check', 'ico--sm')}<span>All milestones done</span></div>`;
    } else if (nextAct) {
      nextHtml = `<div class="next">${D.icon('arrow-right', 'ico--sm')}<span><span class="muted">Next: </span>${D.ui.esc(nextAct)}</span></div>`;
    }

    let repoHtml = '';
    if (link) {
      repoHtml = `<div class="repo">${D.icon('git-branch', 'ico--sm')}<a class="clip" href="${D.ui.esc(link.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${D.ui.esc(D.model.prettyUrl(link.url))}</a>${D.icon('external-link', 'ico--sm')}</div>`;
    } else {
      repoHtml = `<div class="repo">${D.icon('git-branch', 'ico--sm')}<span class="placeholder">Add GitHub link</span></div>`;
    }

    return `
      <article class="card card--interactive" draggable="true" data-key="${item.id}" data-act="open-item" tabindex="0">
        <div class="card__row">
          <span class="tag tag--plain">${D.ui.subjectDot(subj.id)}${D.ui.esc(subj.name)}</span>
          <span style="margin-left:auto">${dateTag}</span>
        </div>
        <h3 class="card__title">${D.ui.esc(item.title)}</h3>
        ${cardRowProgress}
        ${nextHtml}
        ${repoHtml}
      </article>
    `;
  }

  function render(container, items, state) {
    const projects = items.filter(i => i.type === 'project');
    const cols = D.config.PROJECT_STATUSES;
    
    const colHtml = cols.map(col => {
      const colItems = projects.filter(i => i.status === col.id);
      colItems.sort(D.model.sortItems.due);
      
      const cardsHtml = colItems.map(renderCard).join('');
      
      return `
        <section class="col" aria-label="${D.ui.esc(col.name)}" data-status="${col.id}">
          <h2 class="col__head">${D.ui.esc(col.name)}<span class="num">${colItems.length}</span><button class="btn btn--ghost btn--icon" data-act="new-project" data-id="${col.id}" aria-label="Add project to ${D.ui.esc(col.name)}" style="height:24px;width:24px">${D.icon('plus')}</button></h2>
          ${cardsHtml}
        </section>
      `;
    }).join('');

    const currentSubjectName = state.activeSubject ? (D.config.SUBJECTS.find(s => s.id === state.activeSubject)?.name || 'All subjects') : 'All subjects';

    container.innerHTML = `
      <div class="toolbar">
        <button type="button" class="select" style="width:auto" data-act="menu-subject">${D.ui.esc(currentSubjectName)}${D.icon('chevron-down', 'ico--sm')}</button>
        <span class="muted" style="font-size:12px">Progress counts ticked milestones. Drag a card, or press <kbd class="kbd">←</kbd> <kbd class="kbd">→</kbd> to move it.</span>
        <div class="toolbar__end">
          <button class="btn" data-act="new-project" data-id="idea">${D.icon('plus')}New project</button>
        </div>
      </div>
      <div class="board">
        ${colHtml}
      </div>
    `;

    if (!container.dataset.projectsBound) {
      container.addEventListener('dragstart', handleDragStart);
      container.addEventListener('dragover', handleDragOver);
      container.addEventListener('drop', handleDrop);
      container.addEventListener('keydown', handleKeyDown);
      container.addEventListener('click', handleNewProject);
      container.dataset.projectsBound = 'true';
    }
  }

  D.screens = D.screens || {};
  D.screens.projects = { render };

})(window);
