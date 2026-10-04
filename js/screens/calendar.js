(function (root) {
  'use strict';
  const D = root.Daybook;

  function render(container, items, state) {
    state.calendarView = state.calendarView || 'month';
    state.calendarDate = state.calendarDate || D.dates.today();

    const isMonth = state.calendarView === 'month';
    const today = D.dates.today();
    
    const allEntries = D.model.entries(items);
    const byDate = {};
    allEntries.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });

    for (let d in byDate) {
      byDate[d].sort(D.model.sortEntries.calendar);
    }

    let calHtml = '';
    let titleStr = '';

    if (isMonth) {
      const monthStart = D.dates.startOfMonth(state.calendarDate);
      const daysInMonth = D.dates.daysInMonth(monthStart);
      const monthEnd = D.dates.add(monthStart, daysInMonth - 1);
      const calStart = D.dates.startOfWeek(monthStart);
      const calEnd = D.dates.add(D.dates.startOfWeek(monthEnd), 6);
      
      titleStr = D.dates.monthYear(monthStart);
      
      const daysTotal = D.dates.diff(calEnd, calStart) + 1;
      const weeks = daysTotal / 7;
      const maxChips = weeks === 6 ? 2 : 3;

      let cells = '';
      const dows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      cells += dows.map(d => `<div class="cal__dow">${d}</div>`).join('');

      for (let i = 0; i < daysTotal; i++) {
        const d = D.dates.add(calStart, i);
        const p = D.dates.parts(d);
        const isOut = d < monthStart || d > monthEnd;
        const isToday = d === today;
        let cClass = 'cal__cell';
        if (isOut) cClass += ' is-out';
        if (isToday) cClass += ' is-today';

        let dateNum = parseInt(p[2], 10).toString();
        if (d === calStart || dateNum === '1') {
          dateNum += ' ' + D.dates.MONTHS[p[1] - 1];
        }

        let evsHtml = '';
        const dayEntries = byDate[d] || [];
        
        let toShow = dayEntries;
        let moreCount = 0;
        if (dayEntries.length > maxChips) {
          toShow = dayEntries.slice(0, maxChips);
          moreCount = dayEntries.length - maxChips;
        }

        toShow.forEach(e => {
          const typ = D.model.type(e.item.type);
          const subj = D.model.subject(e.item.subject);
          const tState = D.model.timeState(e.date, e.done, today);
          
          let eClass = `ev ev--${typ.tag}`;
          if (tState.isDone) eClass += ' is-done';
          else if (tState.isOverdue) eClass += ' is-overdue';

          let title = `${typ.name} · ${subj.name}`;
          if (tState.isDone) title += ' · done';
          else if (tState.isOverdue) title += ' · overdue';

          let stateIcon = '';
          if (tState.isDone) stateIcon = D.icon('check');
          else if (tState.isOverdue) stateIcon = D.icon('triangle-alert');

          evsHtml += `
            <div class="${eClass}" title="${D.ui.esc(title)}" data-act="open-item" data-key="${e.item.id}">
              <i class="dot dot--${subj.id} dot--ring"></i>
              ${D.icon(typ.icon)}
              <span class="ev__t">${D.ui.esc(D.model.entryTitle(e))}</span>
              ${stateIcon}
            </div>
          `;
        });

        if (moreCount > 0) {
          evsHtml += `<span class="cal__more num">+${moreCount} more</span>`;
        }

        cells += `<div class="${cClass}"><span class="cal__date num">${dateNum}</span>${evsHtml}</div>`;
      }

      const inlineStyle = (weeks === 4 || weeks === 6) ? ` style="grid-template-rows: 28px repeat(${weeks}, 1fr)"` : '';
      calHtml = `<div class="cal" role="grid" aria-label="${D.ui.esc(titleStr)}"${inlineStyle}>${cells}</div>`;
      
    } else {
      const wkStart = D.dates.startOfWeek(state.calendarDate);
      const wkEnd = D.dates.add(wkStart, 6);
      titleStr = D.dates.range(wkStart, wkEnd);

      let colsHtml = '';
      for (let i = 0; i < 7; i++) {
        const d = D.dates.add(wkStart, i);
        const isToday = d === today;
        const dayEntries = byDate[d] || [];
        
        const dowStr = D.dates.DAYS[D.dates.weekday(d)];
        const nStr = parseInt(D.dates.parts(d)[2], 10).toString();

        let headExtra = isToday ? `<span class="badge badge--today" style="margin-left:auto">Today</span>` : '';
        let head = `<h3 class="wday__head"><span class="wday__dow">${dowStr}</span><span class="wday__n num">${nStr}</span>${headExtra}</h3>`;

        let bodyHtml = '';
        let doneC = 0, todoC = 0;

        if (dayEntries.length === 0) {
          bodyHtml = `
            <div class="empty" style="padding:16px 4px">
              ${D.icon('coffee')}
              <span class="empty__text">Nothing due.</span>
            </div>
          `;
        } else {
          dayEntries.forEach(e => {
            if (e.done) doneC++; else todoC++;

            const typ = D.model.type(e.item.type);
            const subj = D.model.subject(e.item.subject);
            const tState = D.model.timeState(e.date, e.done, today);
            
            let eClass = `wk wk--${typ.tag}`;
            if (tState.isDone) eClass += ' is-done';
            else if (tState.isOverdue) eClass += ' is-overdue';

            let stateIcon = '';
            if (tState.isDone) stateIcon = `<span style="margin-left:auto;display:inline-flex;color:var(--done)">${D.icon('check')}</span>`;
            else if (tState.isOverdue) stateIcon = `<span style="margin-left:auto;display:inline-flex">${D.icon('triangle-alert')}</span>`;

            bodyHtml += `
              <div class="${eClass}" data-act="open-item" data-key="${e.item.id}">
                <span class="wk__t">${D.ui.esc(D.model.entryTitle(e))}</span>
                <span class="wk__meta">
                  <i class="dot dot--${subj.id} dot--ring"></i>${D.ui.esc(subj.short)}
                  <span style="display:inline-flex" title="${D.ui.esc(typ.name)}">${D.icon(typ.icon)}</span>
                  ${stateIcon}
                </span>
              </div>
            `;
          });
        }

        let footStr = '';
        if (dayEntries.length === 0) {
          footStr = 'Free';
        } else {
          if (todoC > 0 && doneC > 0) footStr = `${todoC} to do · ${doneC} done`;
          else if (todoC > 0) footStr = `${todoC} to do`;
          else footStr = `${doneC} done`;
        }

        let sClass = 'wday';
        if (isToday) sClass += ' is-today';
        colsHtml += `
          <section class="${sClass}">
            ${head}
            <div class="wday__body">${bodyHtml}</div>
            <div class="wday__foot num">${footStr}</div>
          </section>
        `;
      }
      calHtml = `<div class="week">${colsHtml}</div>`;
    }

    const legendHw = `<span><span class="tag tag--hw">${D.icon('book-open')}Homework</span></span>`;
    const legendAs = `<span><span class="tag tag--assign">${D.icon('file-text')}Assignment</span></span>`;
    const legendPr = `<span><span class="tag tag--project">${D.icon('square-kanban')}Project</span></span>`;
    const dotsHtml = D.config.SUBJECTS.map(s => `<i class="dot dot--${s.id}"></i>`).join('');
    const legend = `<div class="legend" aria-label="Legend">${legendHw}${legendAs}${legendPr}<span>${dotsHtml} dot = subject</span></div>`;

    container.innerHTML = `
      <div class="toolbar">
        <button class="btn btn--icon" aria-label="Previous" data-act="cal-prev">${D.icon('chevron-left')}</button>
        <button class="btn btn--icon" aria-label="Next" data-act="cal-next">${D.icon('chevron-right')}</button>
        <button class="btn" data-act="cal-today">Today</button>
        <h2 class="section-title num" style="margin-left:4px;font-size:15px">${D.ui.esc(titleStr)}</h2>
        <div class="toolbar__end">
          ${legend}
          <div class="seg" role="group" aria-label="View">
            <button class="seg__opt" aria-pressed="${isMonth}" data-act="cal-view" data-id="month">Month</button>
            <button class="seg__opt" aria-pressed="${!isMonth}" data-act="cal-view" data-id="week">Week</button>
          </div>
        </div>
      </div>
      ${calHtml}
    `;
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.getAttribute('data-act');
    const id = t.getAttribute('data-id');
    const state = D.app.state;

    let redraw = false;
    if (act === 'cal-prev') {
      if (state.calendarView === 'month') {
        state.calendarDate = D.dates.addMonths(D.dates.startOfMonth(state.calendarDate), -1);
      } else {
        state.calendarDate = D.dates.add(state.calendarDate, -7);
      }
      redraw = true;
    } else if (act === 'cal-next') {
      if (state.calendarView === 'month') {
        state.calendarDate = D.dates.addMonths(D.dates.startOfMonth(state.calendarDate), 1);
      } else {
        state.calendarDate = D.dates.add(state.calendarDate, 7);
      }
      redraw = true;
    } else if (act === 'cal-today') {
      state.calendarDate = D.dates.today();
      redraw = true;
    } else if (act === 'cal-view') {
      state.calendarView = id;
      redraw = true;
    }

    if (redraw && D.app && D.app.render) {
      D.app.render();
    }
  });

  D.screens = D.screens || {};
  D.screens.calendar = { render };
})(window);
