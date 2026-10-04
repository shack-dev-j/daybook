/* Daybook model: what an item is, and everything worked out from items.
   One item shape covers homework, assignments and projects (see AGENTS.md, "Data model").
   Nothing here touches the page or storage, so tests/run.js can run it under Node.

   Two ideas to keep in mind:
   1. Overdue, today and "in 3 days" are never stored. They are worked out from the due
      date, the status and today's date every time the screen is drawn.
   2. An "entry" is one deadline on the calendar. Homework and assignments have one entry
      (their due date). A project has one for its own due date and one for every milestone
      that has a date. Today, Next 7 days and Calendar all draw entries. */
(function (root) {
  'use strict';
  const D = (root.Daybook = root.Daybook || {});
  const C = D.config;
  const dates = D.dates;
  const L = C.LIMITS;

  const byId = (list, id) => list.find(x => x.id === id);
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  /* ---------- lookups ---------- */

  const subject = id => {
    const found = byId(C.SUBJECTS, id);
    if (found) return found;
    const title = typeof id === 'string' && id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Other';
    return { id: id || 'other', name: title, short: title };
  };
  const type = id => byId(C.TYPES, id) || C.TYPES[0];
  const priority = id => byId(C.PRIORITIES, id) || byId(C.PRIORITIES, 'med');
  const statusList = typeId => (typeId === 'project' ? C.PROJECT_STATUSES : C.STATUSES);
  const status = (typeId, id) => byId(statusList(typeId), id) || statusList(typeId)[0];

  /* ---------- reading data that might be messy (imports, hand-edited files) ---------- */

  /* "In progress", "in_progress" and "inprogress" all become "inprogress". */
  const key = v => String(v == null ? '' : v).toLowerCase().replace(/[^a-z]/g, '');

  const SUBJECT_ALIASES = {
    cs: 'cs', computerscience: 'cs', compsci: 'cs', computing: 'cs',
    physics: 'physics',
    maths: 'maths', math: 'maths', mathematics: 'maths',
    cyber: 'cyber', cybersecurity: 'cyber', security: 'cyber',
    other: 'other'
  };
  const TYPE_ALIASES = {
    homework: 'homework', hw: 'homework',
    assignment: 'assignment', assignments: 'assignment',
    project: 'project', projects: 'project'
  };
  const PRIORITY_ALIASES = { low: 'low', med: 'med', medium: 'med', normal: 'med', high: 'high' };
  const STATUS_ALIASES = {
    todo: 'todo', open: 'todo', notstarted: 'todo',
    progress: 'progress', inprogress: 'progress', doing: 'progress', started: 'progress',
    done: 'done', complete: 'done', completed: 'done', finished: 'done', returned: 'done',
    idea: 'idea', building: 'building', testing: 'testing'
  };
  const TO_PROJECT = { todo: 'idea', progress: 'building', done: 'done', idea: 'idea', building: 'building', testing: 'testing' };
  const FROM_PROJECT = { idea: 'todo', building: 'progress', testing: 'progress', done: 'done', todo: 'todo', progress: 'progress' };

  /* The nearest status that exists for the given type. */
  function convertStatus(statusId, typeId) {
    const s = STATUS_ALIASES[key(statusId)];
    return typeId === 'project' ? TO_PROJECT[s] || 'idea' : FROM_PROJECT[s] || 'todo';
  }

  const text = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
  const dateOrNull = v => (dates.isValid(v) ? v : null);

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* Ids end up in HTML attributes and in entry keys ("item:step"), so keep them plain. */
  const safeId = v => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : newId());

  /* A link the app is willing to open: http or https only. Returns the full URL or null.
     "github.com/you/daybook" becomes "https://github.com/you/daybook". */
  function cleanUrl(raw) {
    let s = text(raw, L.url).trim();
    if (!s || /\s/.test(s)) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
    let u;
    try { u = new URL(s); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname || (u.hostname.indexOf('.') < 0 && u.hostname !== 'localhost')) return null;
    return u.href;
  }

  /* "https://www.github.com/you/daybook/" -> "github.com/you/daybook" */
  const prettyUrl = url => String(url).replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');

  function isGithub(url) {
    try { return new URL(url).hostname.replace(/^www\./i, '') === 'github.com'; } catch (e) { return false; }
  }

  /* What was typed in "Paste a link": a URL, optionally with a name in front of it. */
  function parseLink(input) {
    const s = String(input || '').trim();
    if (!s) return null;
    const cut = s.search(/\S+$/);
    const url = cleanUrl(s.slice(cut));
    if (!url) return null;
    return { url, label: s.slice(0, cut).trim().slice(0, L.label) };
  }

  function cleanLink(raw) {
    if (typeof raw === 'string') raw = { url: raw };
    if (!raw || typeof raw !== 'object') return null;
    const url = cleanUrl(raw.url || raw.href);
    return url ? { url, label: text(raw.label || raw.title, L.label).trim() } : null;
  }

  function cleanStep(raw) {
    if (typeof raw === 'string') raw = { text: raw };
    if (!raw || typeof raw !== 'object') return null;
    const t = text(raw.text != null ? raw.text : raw.title, L.step).trim();
    if (!t) return null;
    const done = raw.done === true;
    return {
      id: safeId(raw.id),
      text: t,
      done,
      due: dateOrNull(raw.due != null ? raw.due : raw.due_date),
      done_at: done ? dateOrNull(raw.done_at) : null
    };
  }

  function cleanScore(raw) {
    if (typeof raw === 'number') raw = { got: raw };
    if (!raw || typeof raw !== 'object') return null;
    const num = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null);
    const got = num(raw.got);
    const outOf = num(raw.outOf != null ? raw.outOf : raw.out_of);
    if (got == null && !outOf) return null;
    return { got, outOf: outOf || null };
  }

  /* Give every member of a list its own id (a copied step would otherwise share one). */
  function uniqueIds(list) {
    const seen = new Set();
    list.forEach(x => {
      while (seen.has(x.id)) x.id = newId();
      seen.add(x.id);
    });
    return list;
  }

  /* Turn anything item-shaped into a complete, safe item. Every item that enters the app
     (typed in, loaded, imported) goes through here, so the rest of the code can trust it. */
  function normalise(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const typeId = TYPE_ALIASES[key(raw.type)] || 'homework';
    const statusId = byId(statusList(typeId), raw.status) ? raw.status : convertStatus(raw.status, typeId);
    const due = dateOrNull(raw.due_date);
    const created = dateOrNull(raw.created_at) || dates.today();
    const item = {
      id: safeId(raw.id),
      type: typeId,
      title: text(raw.title, L.title).replace(/\s+/g, ' ').trim(),
      subject: SUBJECT_ALIASES[key(raw.subject)] || 'other',
      due_date: due,
      priority: PRIORITY_ALIASES[key(raw.priority)] || 'med',
      status: statusId,
      checklist: uniqueIds((Array.isArray(raw.checklist) ? raw.checklist : []).map(cleanStep).filter(Boolean).slice(0, L.steps)),
      notes: text(raw.notes, L.notes),
      links: (Array.isArray(raw.links) ? raw.links : []).map(cleanLink).filter(Boolean).slice(0, L.links),
      score: cleanScore(raw.score),
      next_action: text(raw.next_action, L.title).trim(),
      created_at: created,
      /* A done item needs a completion date for Stats. If the file has none, assume it
         was finished on its due date. */
      completed_at: statusId === 'done' ? dateOrNull(raw.completed_at) || due || created : null
    };
    if (raw.sample === true) item.sample = true;
    return item;
  }

  /* A whole list: items that are not objects are dropped, and ids are made unique. */
  function normaliseAll(list) {
    if (!Array.isArray(list)) return [];
    return uniqueIds(list.filter(x => x && typeof x === 'object').slice(0, L.items).map(normalise));
  }

  /* A new, empty item of the given type. */
  function blank(typeId, over) {
    const t = byId(C.TYPES, typeId) ? typeId : 'homework';
    return normalise(Object.assign({
      id: newId(), type: t, title: '', subject: 'other', due_date: null,
      priority: 'med', status: statusList(t)[0].id, created_at: dates.today()
    }, over || {}));
  }

  const blankStep = stepText => ({ id: newId(), text: text(stepText, L.step).trim(), done: false, due: null, done_at: null });

  /* ---------- worked out from one item ---------- */

  const isDone = item => item.status === 'done';

  /* Checklist progress: { done, total, pct }. */
  function progress(item) {
    const total = item.checklist.length;
    const done = item.checklist.filter(s => s.done).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  const nextStep = item => item.checklist.find(s => !s.done) || null;

  /* A project's next action: what the user wrote, else the first unticked milestone. */
  function nextAction(item) {
    if (item.next_action) return item.next_action;
    const s = nextStep(item);
    return s ? s.text : '';
  }

  /* The date that matters next. For an open project that is its earliest unticked dated
     milestone (or its own deadline if that comes first); otherwise the due date. */
  function dueOf(item) {
    if (item.type === 'project' && !isDone(item)) {
      const dated = item.checklist.filter(s => !s.done && s.due).map(s => s.due).sort();
      if (dated.length) return item.due_date && item.due_date < dated[0] ? item.due_date : dated[0];
    }
    return item.due_date;
  }

  /* 'done' | 'overdue' | 'today' | 'upcoming' | 'none' */
  function timeState(date, done, today) {
    if (done) return 'done';
    if (!date) return 'none';
    return date < today ? 'overdue' : date === today ? 'today' : 'upcoming';
  }
  const itemState = (item, today) => timeState(dueOf(item), isDone(item), today);

  const githubLink = item => item.links.find(l => isGithub(l.url)) || null;

  /* { got, outOf } -> whole percentage, or null while the mark is missing. */
  function scorePct(score) {
    if (!score || score.got == null || !score.outOf) return null;
    return Math.round((score.got / score.outOf) * 100);
  }

  function grade(pct) {
    if (pct == null) return '';
    const band = C.GRADE_BANDS.find(b => pct >= b[0]);
    return band ? band[1] : '';
  }

  /* ---------- changing one item (these change the item you pass in) ---------- */

  function setStatus(item, statusId, today) {
    item.status = byId(statusList(item.type), statusId) ? statusId : statusList(item.type)[0].id;
    if (item.status === 'done') item.completed_at = item.completed_at || today;
    else item.completed_at = null;
    return item;
  }

  /* The status an item goes back to when "done" is undone. */
  function reopenStatus(item) {
    const p = progress(item);
    if (item.type === 'project') return p.total && p.done === p.total ? 'testing' : 'building';
    return p.done ? 'progress' : 'todo';
  }

  const toggleDone = (item, today) => setStatus(item, isDone(item) ? reopenStatus(item) : 'done', today);

  /* To do -> In progress -> Done -> To do (or the four project columns). */
  function cycleStatus(item, today) {
    const list = statusList(item.type);
    const i = list.findIndex(s => s.id === item.status);
    return setStatus(item, list[(i + 1) % list.length].id, today);
  }

  function setType(item, typeId, today) {
    if (item.type === typeId || !byId(C.TYPES, typeId)) return item;
    const next = convertStatus(item.status, typeId);
    item.type = typeId;
    return setStatus(item, next, today);
  }

  /* Tick or untick one step. The first tick moves a "To do" item to "In progress". */
  function toggleStep(item, stepId, today) {
    const step = byId(item.checklist, stepId);
    if (!step) return item;
    step.done = !step.done;
    step.done_at = step.done ? today : null;
    if (step.done && item.status === 'todo') item.status = 'progress';
    return item;
  }

  /* Move a project one column left (-1) or right (+1). Returns true if it moved. */
  function moveProject(item, dir, today) {
    const list = C.PROJECT_STATUSES;
    const i = list.findIndex(s => s.id === item.status);
    const j = Math.max(0, Math.min(list.length - 1, i + dir));
    if (j === i) return false;
    setStatus(item, list[j].id, today);
    return true;
  }

  /* ---------- entries: one deadline on the calendar ---------- */

  function entry(item, step) {
    const done = isDone(item) || (step ? step.done : false);
    return {
      key: step ? item.id + ':' + step.id : item.id,
      item,
      step: step || null,
      date: step ? step.due : item.due_date,
      done,
      doneAt: step && step.done ? step.done_at : item.completed_at
    };
  }

  function entries(items) {
    const out = [];
    items.forEach(item => {
      if (item.type === 'project') {
        item.checklist.forEach(step => { if (step.due) out.push(entry(item, step)); });
      }
      if (item.due_date) out.push(entry(item, null));
    });
    return out;
  }

  /* Everything finished on one day, dated or not: the "Done today" panel. */
  function doneOn(items, day) {
    const out = [];
    items.forEach(item => {
      if (item.type === 'project') {
        item.checklist.forEach(step => { if (step.done && step.done_at === day) out.push(entry(item, step)); });
      }
      if (isDone(item) && item.completed_at === day) out.push(entry(item, null));
    });
    return out;
  }

  /* "Password strength checker: Common-password list check" */
  const entryTitle = e => (e.item.title || 'Untitled') + (e.step ? ': ' + e.step.text : '');

  /* ---------- sorting ---------- */

  const prioRank = item => priority(item.priority).rank;
  const typeRank = item => type(item.type).rank;
  const byTitle = (a, b) => a.title.localeCompare(b.title, 'en', { numeric: true, sensitivity: 'base' });
  /* Earliest first; anything without a date goes last. */
  const byDate = (a, b) => (a && b ? cmp(a, b) : a ? -1 : b ? 1 : 0);

  const sortItems = {
    due: (a, b) => byDate(dueOf(a), dueOf(b)) || prioRank(a) - prioRank(b) || byTitle(a, b),
    priority: (a, b) => prioRank(a) - prioRank(b) || byDate(dueOf(a), dueOf(b)) || byTitle(a, b),
    title: (a, b) => byTitle(a, b) || byDate(dueOf(a), dueOf(b)),
    /* Most recently finished first. */
    completed: (a, b) => cmp(b.completed_at || '', a.completed_at || '') || byTitle(a, b)
  };

  const sortEntries = {
    /* Overdue: the oldest first. */
    oldest: (a, b) => cmp(a.date, b.date) || prioRank(a.item) - prioRank(b.item) || byTitle(a.item, b.item),
    /* Due today and each coming day: by priority, then assignment, homework, project. */
    day: (a, b) => prioRank(a.item) - prioRank(b.item) || typeRank(a.item) - typeRank(b.item) || byTitle(a.item, b.item),
    /* A calendar day: open ones first in that same order, done ones last. */
    calendar: (a, b) => cmp(a.done, b.done) || sortEntries.day(a, b)
  };

  /* ---------- search ---------- */

  function haystack(item) {
    return [
      item.title, item.notes, item.next_action,
      subject(item.subject).name, subject(item.subject).short,
      type(item.type).name, status(item.type, item.status).name
    ].concat(item.checklist.map(s => s.text), item.links.map(l => l.label + ' ' + l.url)).join('\n').toLowerCase();
  }

  /* Every word of the query must appear somewhere in the item. */
  function matches(item, query) {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const h = haystack(item);
    return words.every(w => h.indexOf(w) >= 0);
  }

  /* ---------- counts and stats ---------- */

  /* The numbers in the sidebar and in the Today summary. */
  function counts(items, today) {
    const open = items.filter(i => !isDone(i));
    const es = entries(items).filter(e => !e.done);
    const weekAhead = dates.add(today, 7);
    const bySubject = {};
    const byType = {};
    C.SUBJECTS.forEach(s => { bySubject[s.id] = 0; });
    C.TYPES.forEach(t => { byType[t.id] = 0; });
    open.forEach(i => { bySubject[i.subject] += 1; byType[i.type] += 1; });
    return {
      open: open.length,
      overdue: es.filter(e => e.date < today).length,
      today: es.filter(e => e.date === today).length,
      next7: es.filter(e => e.date > today && e.date <= weekAhead).length,
      bySubject,
      byType
    };
  }

  /* The Mondays of the last n weeks, oldest first, ending with this week. */
  function weekStarts(today, n) {
    const last = dates.startOfWeek(today);
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(dates.add(last, -7 * i));
    return out;
  }

  /* How many weeks from the week containing `start` up to this week, inclusive. */
  const weeksSince = (start, today) => Math.floor(dates.diff(dates.startOfWeek(today), dates.startOfWeek(start)) / 7) + 1;

  /* One row per week: how many items were completed, and how many of those were on time.
     On time means completed on or before the due date. Items with no due date cannot be
     early or late, so they count as completed but are left out of the rate. */
  function weekly(items, starts) {
    return starts.map(start => {
      const end = dates.add(start, 6);
      const finished = items.filter(i => isDone(i) && i.completed_at >= start && i.completed_at <= end);
      const rated = finished.filter(i => i.due_date);
      const onTime = rated.filter(i => i.completed_at <= i.due_date).length;
      return {
        start, end,
        completed: finished.length,
        rated: rated.length,
        onTime,
        rate: rated.length ? Math.round((onTime / rated.length) * 100) : null
      };
    });
  }

  /* Open items per subject, with the split by type. */
  function workload(items) {
    return C.SUBJECTS.map(s => {
      const open = items.filter(i => !isDone(i) && i.subject === s.id);
      const byType = {};
      C.TYPES.forEach(t => { byType[t.id] = open.filter(i => i.type === t.id).length; });
      return { subject: s, total: open.length, byType };
    });
  }

  /* How many days late the oldest overdue deadline is; 0 when nothing is late. */
  function oldestLate(items, today) {
    const late = entries(items).filter(e => !e.done && e.date < today).map(e => e.date).sort();
    return late.length ? dates.diff(today, late[0]) : 0;
  }

  /* The start of the school year: the most recent 1 September. */
  function defaultTermStart(today) {
    const p = dates.parts(today);
    return (p[1] >= 9 ? p[0] : p[0] - 1) + '-09-01';
  }

  D.model = {
    subject, type, priority, status, statusList, convertStatus,
    newId, cleanUrl, prettyUrl, isGithub, parseLink, normalise, normaliseAll, blank, blankStep,
    isDone, progress, nextStep, nextAction, dueOf, timeState, itemState, githubLink, scorePct, grade,
    setStatus, toggleDone, cycleStatus, setType, toggleStep, moveProject,
    entries, doneOn, entryTitle, sortItems, sortEntries, matches,
    counts, weekStarts, weeksSince, weekly, workload, oldestLate, defaultTermStart
  };
})(typeof window !== 'undefined' ? window : globalThis);
