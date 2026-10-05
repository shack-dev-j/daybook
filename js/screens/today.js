(function (root) {
  'use strict';
  const D = root.Daybook;

  function renderEntry(e, isCompact) {
    const item = e.item;
    const subj = D.model.subject(item.subject);
    const typ = D.model.type(item.type);
    const prio = D.model.priority(item.priority);
    const isOverdue = !e.done && e.date && e.date < D.dates.today();
    const isToday = !e.done && e.date === D.dates.today();
    
    let c = 'row';
    if (isOverdue) c += ' is-overdue';
    if (isToday) c += ' is-today';
    if (e.done) c += ' is-done';
    
    let titleHtml = D.ui.esc(item.title);
    if (e.step) {
      titleHtml += ` <span class="muted" style="font-weight:400">· ${D.ui.esc(e.step.text)}</span>`;
    }
    
    const relativeDate = e.date ? D.dates.relative(e.date, D.dates.today()) : '';

    if (isCompact) {
      return `
        <li class="${c} row--compact" data-key="${e.key}" data-act="open-item" tabindex="0">
          ${D.ui.checkbox(e.done)}
          ${D.ui.subjectDot(subj.id)}
          <span class="row__title">${titleHtml}</span>
          <span class="muted" title="${D.ui.esc(typ.name)}" style="display:inline-flex">
            ${D.icon(typ.icon, 'ico--sm')}
          </span>
        </li>
      `;
    }

    let subHtml = `<span class="tag tag--plain">${D.ui.subjectDot(subj.id)}${D.ui.esc(subj.name)}</span>`;
    subHtml += D.ui.tag(typ.name, 'tag--' + typ.tag, typ.icon);
    
    if (item.type === 'project' || item.checklist.length > 0) {
      const p = D.model.progress(item);
      subHtml += D.ui.progress(p.done, p.total, subj.id);
    }
    
    let endHtml = '';
    endHtml += `<span class="prio ${prio.id === 'high' ? 'prio--high' : ''}">${D.icon(prio.icon, 'ico--sm')}${D.ui.esc(prio.name)}</span>`;

    if (e.done) {
      endHtml += D.ui.tag('Done', 'tag--done', 'check');
    } else if (isOverdue) {
      endHtml += `<span class="row__due num">${D.ui.esc(D.dates.short(e.date))}</span>`;
      endHtml += D.ui.tag(relativeDate, 'tag--overdue num', 'triangle-alert');
    } else if (isToday) {
      const stat = D.model.status(item.type, item.status);
      endHtml += D.ui.tag(stat.name, 'tag--' + stat.tag, stat.icon);
    } else {
      endHtml += `<span class="row__due num">${D.ui.esc(D.dates.short(e.date))}</span>`;
    }

    return `
      <li class="${c} row--tall" data-key="${e.key}" data-act="open-item" tabindex="0">
        ${D.ui.checkbox(e.done)}
        <div class="row__main">
          <span class="row__title">${titleHtml}</span>
          <span class="row__sub">${subHtml}</span>
        </div>
        ${endHtml}
      </li>
    `;
  }

  D.screens = D.screens || {};
  D.screens.today = {
    render: function(container, items, state) {
      const today = D.dates.today();
      const es = D.model.entries(items);
      
      const overdue = es.filter(e => !e.done && e.date < today).sort(D.model.sortEntries.oldest);
      const dueToday = es.filter(e => !e.done && e.date === today).sort(D.model.sortEntries.day);
      const doneToday = D.model.doneOn(items, today);
      
      const next7End = D.dates.add(today, 7);
      const next7 = es.filter(e => !e.done && e.date > today && e.date <= next7End).sort(D.model.sortEntries.day);
      
      const byDay = {};
      for (let i = 1; i <= 7; i++) {
        byDay[D.dates.add(today, i)] = [];
      }
      next7.forEach(e => {
        if (byDay[e.date]) byDay[e.date].push(e);
      });

      const c = D.model.counts(items, today);

      const summaryHtml = `
        <div class="summary">
          <span class="summary__item"><span class="summary__n num">${c.today}</span>due today</span>
          <span class="summary__item"><span class="summary__n num">${c.overdue}</span>overdue</span>
          <span class="summary__item"><span class="summary__n num">${c.next7}</span>in the next 7 days</span>
          <span class="hints" style="margin-left:auto">
            <span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd>Move</span>
            <span><kbd class="kbd">Space</kbd>Done</span>
            <span><kbd class="kbd">Enter</kbd>Open</span>
          </span>
        </div>
      `;

      const allClear = overdue.length === 0 && dueToday.length === 0 && doneToday.length === 0;
      let panelsHtml = '';

      if (allClear) {
        const tmrwCount = byDay[D.dates.add(today, 1)].length;
        panelsHtml = D.ui.emptyState('All clear for today', `Tomorrow has ${tmrwCount} ${tmrwCount === 1 ? 'item' : 'items'} due.`, 'sun');
      } else {
        let oHtml = '';
        if (overdue.length > 0) {
          oHtml = `
            <section class="panel panel--overdue" aria-label="Overdue">
              <h2 class="panel__head">${D.icon('triangle-alert')}Overdue<span class="num">${overdue.length}</span></h2>
              <ul>${overdue.map(e => renderEntry(e, false)).join('')}</ul>
            </section>
          `;
        }

        let tHtml = '';
        if (dueToday.length > 0) {
          tHtml = `
            <section class="panel panel--today" aria-label="Due today">
              <h2 class="panel__head">${D.icon('clock')}Due today<span class="muted num">${dueToday.length}</span></h2>
              <ul>${dueToday.map(e => renderEntry(e, false)).join('')}</ul>
            </section>
          `;
        } else {
          tHtml = `
            <section class="panel panel--today" aria-label="Due today">
              <h2 class="panel__head">${D.icon('clock')}Due today<span class="muted num">0</span></h2>
              ${D.ui.emptyStateInline('All done for today.', 'check')}
            </section>
          `;
        }

        let dHtml = '';
        if (doneToday.length > 0) {
          dHtml = `
            <section class="panel panel--done" aria-label="Done today">
              <h2 class="panel__head">${D.icon('check-circle')}Done today<span class="num">${doneToday.length}</span><span class="muted" style="margin-left:auto;display:inline-flex">${D.icon('chevron-down')}</span></h2>
              <ul>${doneToday.map(e => renderEntry(e, false)).join('')}</ul>
            </section>
          `;
        }

        panelsHtml = oHtml + tHtml + dHtml;
      }

      let next7Html = `
        <section class="panel" aria-label="Next 7 days" style="align-self:start">
          <h2 class="panel__head">${D.icon('calendar-days')}Next 7 days<span class="muted num">${c.next7}</span><a href="#/calendar" class="btn btn--ghost" style="margin-left:auto;height:24px;padding:0 6px;font-size:12px">Calendar${D.icon('arrow-right', 'ico--sm')}</a></h2>
      `;
      
      for (let i = 1; i <= 7; i++) {
        const d = D.dates.add(today, i);
        const dayEntries = byDay[d];
        const dayTitle = D.dates.short(d);
        
        next7Html += `
          <div class="day__head">
            <span class="num">${D.ui.esc(dayTitle)}</span>
            <span style="font-weight:400">${i === 1 ? 'Tomorrow' : ''}</span>
            <span class="num" style="margin-left:auto;font-weight:400">${dayEntries.length > 0 ? dayEntries.length : ''}</span>
          </div>
        `;
        
        if (dayEntries.length > 0) {
          next7Html += `<ul>${dayEntries.map(e => renderEntry(e, true)).join('')}</ul>`;
        } else {
          next7Html += D.ui.emptyStateInline('Nothing due. A free day.', 'coffee');
        }
      }
      next7Html += `</section>`;

      container.innerHTML = `
        <div class="today">
          <div class="today__main">
            ${summaryHtml}
            ${panelsHtml}
          </div>
          ${next7Html}
        </div>
      `;
    }
  };
})(window);
