(function (root) {
  'use strict';
  const D = root.Daybook;

  const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, m => escMap[m]);
  }

  function subjectDot(id) {
    return `<i class="dot dot--${id}"></i>`;
  }

  function badge(text, variantClass) {
    return `<span class="badge ${variantClass} num" title="${esc(text)}">${esc(text)}</span>`;
  }

  function tag(text, variantClass, iconName) {
    const iconStr = iconName ? D.icon(iconName) : '';
    return `<span class="tag ${variantClass}">${iconStr}${esc(text)}</span>`;
  }

  function emptyState(title, text, iconName, buttonHtml) {
    return `
      <div class="empty">
        ${D.icon(iconName)}
        <div class="empty__title">${esc(title)}</div>
        <div class="empty__text">${esc(text)}</div>
        ${buttonHtml || ''}
      </div>
    `;
  }

  function emptyStateInline(text, iconName) {
    return `
      <div class="empty empty--inline">
        ${D.icon(iconName)}
        ${esc(text)}
      </div>
    `;
  }

  function checkbox(isDone) {
    return `
      <span class="check check--round" role="checkbox" tabindex="0" aria-checked="${isDone}" aria-label="Mark done" title="Mark done" data-act="toggle-done">
        ${D.icon('check')}
      </span>
    `;
  }

  function progress(done, total, subjectId) {
    if (total === 0) return '';
    const pct = Math.round((done / total) * 100);
    return `
      <span style="display:inline-flex;align-items:center;gap:6px;width:92px">
        <span class="progress" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}">
          <span class="progress__fill fill--${subjectId}" style="width:${pct}%"></span>
        </span>
        <span class="num">${done}/${total}</span>
      </span>
    `;
  }

  function rowClasses(item) {
    const timeState = D.model.timeState(item.due_date, D.model.isDone(item), D.dates.today());
    let c = 'row';
    if (timeState.isOverdue) c += ' is-overdue';
    if (timeState.isToday) c += ' is-today';
    if (timeState.isDone) c += ' is-done';
    return { classes: c, timeState };
  }

  function renderRow(item, isCompact) {
    const subj = D.model.subject(item.subject);
    const typ = D.model.type(item.type);
    const prio = D.model.priority(item.priority);
    const { classes, timeState } = rowClasses(item);
    const relativeDate = item.due_date ? D.dates.relative(item.due_date, D.dates.today()) : '';

    if (isCompact) {
      return `
        <li class="${classes} row--compact" data-key="${item.id}" data-act="open-item" tabindex="0">
          ${checkbox(timeState.isDone)}
          ${subjectDot(subj.id)}
          <span class="row__title">${esc(item.title)}</span>
          <span class="muted" title="${esc(typ.name)}" style="display:inline-flex">
            ${D.icon(typ.icon, 'ico--sm')}
          </span>
        </li>
      `;
    }

    let subHtml = `<span class="tag tag--plain">${subjectDot(subj.id)}${esc(subj.name)}</span>`;
    subHtml += tag(typ.name, 'tag--' + typ.tag, typ.icon);
    
    if (item.type === 'project' || item.checklist.length > 0) {
      const p = D.model.progress(item);
      subHtml += progress(p.done, p.total, subj.id);
    }

    return `
      <li class="${classes} row--tall" data-key="${item.id}" data-act="open-item" tabindex="0">
        ${checkbox(timeState.isDone)}
        <div class="row__main">
          <span class="row__title">${esc(item.title)}</span>
          <span class="row__sub">${subHtml}</span>
        </div>
        <span class="prio ${prio.id === 'high' ? 'prio--high' : ''}">${D.icon(prio.icon, 'ico--sm')}${esc(prio.name)}</span>
        ${item.due_date ? `<span class="row__due num">${esc(D.dates.short(item.due_date))}</span>` : ''}
        ${timeState.isOverdue ? tag(relativeDate, 'tag--overdue num', 'triangle-alert') : ''}
      </li>
    `;
  }

  function toast(msg, undoAct) {
    // Basic toast, append to body
    let t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--surface-raised);padding:8px 16px;border-radius:var(--radius-md);box-shadow:var(--shadow-pop);border:1px solid var(--border);display:flex;align-items:center;gap:12px;z-index:999;';
    t.innerHTML = `<span>${esc(msg)}</span>${undoAct ? `<button class="btn" data-act="${undoAct}">Undo</button>` : ''}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 5000);
  }

  D.ui = {
    esc, subjectDot, badge, tag, emptyState, emptyStateInline, checkbox, progress, renderRow, toast
  };
})(window);
