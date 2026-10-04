(function (root) {
  'use strict';
  const D = root.Daybook;

  function renderCard(item, today) {
    const subj = D.model.subject(item.subject);
    const stat = D.model.status(item.type, item.status);
    const prio = D.model.priority(item.priority);
    const timeState = D.model.timeState(item.due_date, D.model.isDone(item), today);
    const rel = item.due_date ? D.dates.relative(item.due_date, today) : '';
    const dateStr = item.due_date ? D.dates.short(item.due_date) : '';

    const statHtml = D.ui.tag(stat.name, 'tag--' + stat.tag, stat.icon);

    let dateHtml = '';
    if (item.due_date) {
      dateHtml += `${D.icon('calendar', 'ico--sm')}<span class="num">${D.ui.esc(dateStr)}</span>`;
      if (timeState === 'today') {
        dateHtml += `<span class="tag tag--today">${D.icon('clock')}Today</span>`;
      } else if (timeState === 'overdue') {
        dateHtml += `<span class="tag tag--overdue num">${D.icon('triangle-alert')}${D.ui.esc(rel)}</span>`;
      } else {
        dateHtml += `<span class="muted num" style="font-size:12px">${D.ui.esc(rel)}</span>`;
      }
    }

    const prioHtml = `<span class="prio ${prio.id === 'high' ? 'prio--high' : ''}">${D.icon(prio.icon, 'ico--sm')}${D.ui.esc(prio.name)}</span>`;

    const p = D.model.progress(item);
    const progHtml = p.total > 0
      ? `<span class="progress" role="progressbar" aria-valuenow="${p.done}" aria-valuemin="0" aria-valuemax="${p.total}"><span class="progress__fill fill--${D.ui.subjectClass(subj.id)}" style="width:${p.pct}%"></span></span><span class="muted num" style="font-size:12px">${p.done}/${p.total} steps</span>`
      : '';

    const notesHtml = item.notes ? `<p class="card__note">${D.ui.esc(item.notes)}</p>` : '';

    return `
<article class="card card--interactive" data-key="${item.id}" data-act="open-item" tabindex="0">
  <div class="card__row">
    <span class="tag tag--plain">${D.ui.subjectDot(subj.id)}${D.ui.esc(subj.name)}</span>
    <span style="margin-left:auto">${statHtml}</span>
  </div>
  <h3 class="card__title">${D.ui.esc(item.title)}</h3>
  <div class="card__row">
    ${dateHtml}
    <span style="margin-left:auto">${prioHtml}</span>
  </div>
  ${progHtml ? `<div class="card__row">${progHtml}</div>` : ''}
  ${notesHtml}
</article>`;
  }

  function renderTableRow(item, today) {
    const subj = D.model.subject(item.subject);
    const isReturned = D.model.isDone(item);
    
    let dateStr = '';
    if (isReturned) {
      dateStr = item.completed_at ? D.dates.short(item.completed_at) : (item.due_date ? D.dates.short(item.due_date) : '');
    } else {
      dateStr = item.due_date ? D.dates.short(item.due_date) : '';
    }

    let scoreHtml = '<span class="muted">— / 25</span>';
    let pctHtml = '—';
    let gradeHtml = '<span class="tag tag--todo">Awaiting</span>';

    if (!isReturned) {
      scoreHtml = '<span class="muted">—</span>';
      pctHtml = '—';
      gradeHtml = '<span class="muted">—</span>';
    } else if (item.score && item.score.outOf) {
      scoreHtml = `<span class="score">${item.score.got}</span><span class="muted"> / ${item.score.outOf}</span>`;
      const pct = D.model.scorePct(item.score);
      pctHtml = pct !== null ? `${pct}%` : '—';
      const g = D.model.grade(pct);
      gradeHtml = g ? `<span class="tag">${D.ui.esc(g)}</span>` : '<span class="muted">—</span>';
    }

    return `
<li class="row" data-key="${item.id}" data-act="open-item" tabindex="0">
  ${D.ui.checkbox(isReturned)}
  <span class="row__title" style="font-weight:500">${D.ui.esc(item.title)}</span>
  <span class="c-subj"><span class="tag tag--plain">${D.ui.subjectDot(subj.id)}${D.ui.esc(subj.name)}</span></span>
  <span class="c-due num muted" style="width:96px">${D.ui.esc(dateStr)}</span>
  <span class="c-score num">${scoreHtml}</span>
  <span class="c-pct num">${pctHtml}</span>
  <span class="c-grade" style="width:76px">${gradeHtml}</span>
  <span class="c-note clip muted" style="font-size:12px">${D.ui.esc(item.notes)}</span>
</li>`;
  }

  D.screens = D.screens || {};
  D.screens.assignments = {
    render: function (container, items, state) {
      state = state || {};
      const show = state.show || 'all';
      const subjectFilter = state.subject || '';
      const view = state.view || 'cards';

      const today = D.dates.today();
      let assigns = items.filter(i => i.type === 'assignment');
      if (subjectFilter) {
        assigns = assigns.filter(i => i.subject === subjectFilter);
      }

      const active = assigns.filter(i => !D.model.isDone(i));
      const returned = assigns.filter(i => D.model.isDone(i));

      active.sort(D.model.sortItems.due);
      returned.sort(D.model.sortItems.completed);

      let totalPct = 0;
      let countPct = 0;
      returned.forEach(i => {
        const pct = D.model.scorePct(i.score);
        if (pct !== null) {
          totalPct += pct;
          countPct++;
        }
      });
      const avgPct = countPct > 0 ? Math.round(totalPct / countPct) : null;

      const allCount = active.length + returned.length;
      const subjName = subjectFilter ? D.model.subject(subjectFilter).name : 'All subjects';

      let html = `
<div class="toolbar">
  <div class="seg" role="group" aria-label="Show">
    <button class="seg__opt" aria-pressed="${show === 'active'}" data-act="set-filter" data-key="show" data-val="active">Active <span class="num">${active.length}</span></button>
    <button class="seg__opt" aria-pressed="${show === 'returned'}" data-act="set-filter" data-key="show" data-val="returned">Returned <span class="num">${returned.length}</span></button>
    <button class="seg__opt" aria-pressed="${show === 'all'}" data-act="set-filter" data-key="show" data-val="all">All <span class="num">${allCount}</span></button>
  </div>
  <button type="button" class="select" style="width:auto" data-act="open-subject-menu">${D.ui.esc(subjName)}${D.icon('chevron-down', 'ico--sm')}</button>
  <div class="toolbar__end">
    <div class="seg" role="group" aria-label="View">
      <button class="seg__opt" aria-pressed="${view === 'cards'}" data-act="set-view" data-val="cards">${D.icon('grid', 'ico--sm')}Cards</button>
      <button class="seg__opt" aria-pressed="${view === 'table'}" data-act="set-view" data-val="table">${D.icon('table', 'ico--sm')}Table</button>
    </div>
  </div>
</div>`;

      function drawSection(title, subtitle, list, isRet, isSecond) {
        if (list.length === 0) {
          return `
<h2 class="section-title" ${isSecond ? 'style="margin-top:4px"' : ''}>${D.ui.esc(title)}<span class="muted num">0</span></h2>
${D.ui.emptyStateInline(`No ${title.toLowerCase()} assignments`, 'file-text')}`;
        }

        let secHtml = `<h2 class="section-title" ${isSecond ? 'style="margin-top:4px"' : ''}>${D.ui.esc(title)}<span class="muted num">${list.length}</span><span class="muted" style="font-size:12px">· ${subtitle}</span></h2>`;

        if (view === 'cards') {
          secHtml += `<div class="grid3">`;
          secHtml += list.map(i => renderCard(i, today)).join('');
          secHtml += `</div>`;
        } else {
          secHtml += `
<div class="table">
  <div class="cols"><span style="width:16px"></span><span class="grow">Assignment</span><span class="c-subj">Subject</span><span style="width:96px;flex:none">${isRet ? 'Submitted' : 'Due'}</span><span class="c-score">Score</span><span class="c-pct">%</span><span style="width:76px;flex:none;text-align:center">Grade</span><span class="c-note">Notes</span></div>
  <ul>`;
          secHtml += list.map(i => renderTableRow(i, today)).join('');
          secHtml += `</ul></div>`;
        }
        return secHtml;
      }

      let drawn = 0;
      if (show === 'active' || show === 'all') {
        html += drawSection('Active', 'sorted by deadline', active, false, drawn > 0);
        drawn++;
      }
      if (show === 'returned' || show === 'all') {
        const avgStr = avgPct !== null ? `average <span class="num">${avgPct}%</span>` : 'no marks yet';
        html += drawSection('Returned', avgStr, returned, true, drawn > 0);
      }

      container.innerHTML = html;
    }
  };
})(window);
