/* Daybook logic tests. No dependencies: run with `node tests/run.js` from the project root.
   They cover js/dates.js and js/model.js, the two files that hold the rules of the app.
   Run them after every change to those files. */
'use strict';
const assert = require('assert');
require('../js/config.js');
require('../js/dates.js');
require('../js/model.js');
const { dates, model: M } = globalThis.Daybook;

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; }
  catch (e) { process.exitCode = 1; console.error('FAIL  ' + name + '\n      ' + e.message); }
}
const eq = (a, b) => assert.deepStrictEqual(a, b);
const TODAY = '2026-10-06';   // a Tuesday, the date the design screens use

/* ---------- dates ---------- */

test('weekday: Monday is 0', () => { eq(dates.weekday('2026-10-05'), 0); eq(dates.weekday(TODAY), 1); eq(dates.weekday('2026-10-04'), 6); });
test('add crosses months and leap days', () => { eq(dates.add('2026-02-28', 1), '2026-03-01'); eq(dates.add('2028-02-28', 1), '2028-02-29'); eq(dates.add(TODAY, -6), '2026-09-30'); });
test('diff counts whole days', () => { eq(dates.diff('2026-10-09', TODAY), 3); eq(dates.diff('2026-10-03', TODAY), -3); });
test('week and month helpers', () => { eq(dates.startOfWeek(TODAY), '2026-10-05'); eq(dates.startOfMonth(TODAY), '2026-10-01'); eq(dates.addMonths('2026-12-15', 1), '2027-01-01'); eq(dates.daysInMonth('2026-02-10'), 28); });
test('isValid rejects impossible dates', () => { eq(dates.isValid('2026-02-30'), false); eq(dates.isValid('2026-2-3'), false); eq(dates.isValid(null), false); eq(dates.isValid(TODAY), true); });
test('formats', () => {
  eq(dates.short(TODAY), 'Tue 6 Oct');
  eq(dates.withYear(TODAY), 'Tue 6 Oct 2026');
  eq(dates.long(TODAY), 'Tuesday 6 October 2026');
  eq(dates.monthYear(TODAY), 'October 2026');
  eq(dates.range('2026-10-05', '2026-10-11'), '5 – 11 October 2026');
  eq(dates.range('2026-08-17', TODAY), '17 Aug – 6 Oct 2026');
  eq(dates.range('2026-12-28', '2027-01-03'), '28 Dec 2026 – 3 Jan 2027');
});
test('relative labels', () => {
  eq(dates.relative(TODAY, TODAY), 'Today');
  eq(dates.relative('2026-10-07', TODAY), 'Tomorrow');
  eq(dates.relative('2026-10-09', TODAY), 'in 3 days');
  eq(dates.relative('2026-10-05', TODAY), '1 day late');
  eq(dates.relative('2026-10-03', TODAY), '3 days late');
});
test('today uses the local clock, not UTC', () => {
  const real = dates.now;
  dates.now = () => new Date(2026, 9, 6, 0, 30);
  eq(dates.today(), TODAY);
  dates.now = real;
});

/* ---------- model: reading messy data ---------- */

test('normalise accepts names as well as ids', () => {
  const i = M.normalise({ type: 'Assignment', subject: 'Computer Science', status: 'In progress', priority: 'Medium', title: '  A   b ', due_date: 'bad' });
  eq([i.type, i.subject, i.status, i.priority, i.title, i.due_date, i.completed_at], ['assignment', 'cs', 'progress', 'med', 'A b', null, null]);
});
test('normalise maps a status onto the right list for the type', () => {
  eq(M.normalise({ type: 'project', status: 'todo' }).status, 'idea');
  eq(M.normalise({ type: 'homework', status: 'testing' }).status, 'progress');
});
test('a done item always has a completion date', () => {
  eq(M.normalise({ status: 'done', due_date: '2026-10-01' }).completed_at, '2026-10-01');
});
test('normaliseAll drops junk and makes ids unique', () => {
  const list = M.normaliseAll([{ id: 'a', title: 'x' }, { id: 'a', title: 'y' }, null, 'nope']);
  eq(list.length, 2);
  assert.notStrictEqual(list[0].id, list[1].id);
});
test('links: only http and https are kept', () => {
  eq(M.cleanUrl('github.com/you/daybook'), 'https://github.com/you/daybook');
  eq(M.cleanUrl('javascript:alert(1)'), null);
  eq(M.cleanUrl('ftp://example.com/x'), null);
  eq(M.cleanUrl('not a link'), null);
  eq(M.parseLink('Lab handout https://example.com/a.pdf'), { url: 'https://example.com/a.pdf', label: 'Lab handout' });
  eq(M.isGithub('https://github.com/you/daybook'), true);
  eq(M.prettyUrl('https://www.github.com/you/daybook/'), 'github.com/you/daybook');
});
test('scores and grades', () => {
  eq(M.scorePct({ got: 34, outOf: 40 }), 85);
  eq(M.scorePct({ got: null, outOf: 25 }), null);
  eq([M.grade(85), M.grade(72), M.grade(39)], ['A', 'B', 'U']);
});

/* ---------- model: changing items ---------- */

test('toggleDone stamps and clears completed_at', () => {
  const i = M.blank('homework', { title: 'x' });
  M.toggleDone(i, TODAY);
  eq([i.status, i.completed_at], ['done', TODAY]);
  M.toggleDone(i, TODAY);
  eq([i.status, i.completed_at], ['todo', null]);
});
test('the first ticked step moves To do to In progress', () => {
  const i = M.blank('homework', { title: 'x', checklist: [{ id: 's1', text: 'one' }, { id: 's2', text: 'two' }] });
  M.toggleStep(i, 's1', TODAY);
  eq([i.status, i.checklist[0].done_at, M.progress(i)], ['progress', TODAY, { done: 1, total: 2, pct: 50 }]);
});
test('changing type keeps the nearest status', () => {
  const i = M.blank('homework', { title: 'x', status: 'progress' });
  eq(M.setType(i, 'project', TODAY).status, 'building');
  i.status = 'testing';
  eq(M.setType(i, 'assignment', TODAY).status, 'progress');
});
test('moveProject walks the board and stops at the ends', () => {
  const p = M.blank('project', { title: 'x' });
  eq(M.moveProject(p, -1, TODAY), false);
  M.moveProject(p, 1, TODAY); M.moveProject(p, 1, TODAY); M.moveProject(p, 1, TODAY);
  eq([p.status, p.completed_at, M.moveProject(p, 1, TODAY)], ['done', TODAY, false]);
});

/* ---------- model: entries, counts, stats ---------- */

const project = () => M.blank('project', {
  id: 'p1', title: 'Checker', status: 'building', due_date: '2026-10-20',
  checklist: [{ id: 's1', text: 'List check', due: '2026-10-10' }, { id: 's2', text: 'No date' }]
});
test('a project has one entry per dated milestone plus its own deadline', () => {
  const es = M.entries([project()]);
  eq(es.map(e => e.key), ['p1:s1', 'p1']);
  eq(M.entryTitle(es[0]), 'Checker: List check');
});
test('dueOf is the next dated milestone, then the project deadline', () => {
  const p = project();
  eq(M.dueOf(p), '2026-10-10');
  M.toggleStep(p, 's1', TODAY);
  eq(M.dueOf(p), '2026-10-20');
  eq(M.nextAction(p), 'No date');
});
test('counts', () => {
  const items = [
    M.blank('homework', { title: 'late', due_date: '2026-10-03', subject: 'physics' }),
    M.blank('homework', { title: 'now', due_date: TODAY, subject: 'maths' }),
    M.blank('homework', { title: 'soon', due_date: '2026-10-09', subject: 'maths' }),
    M.blank('homework', { title: 'done', due_date: TODAY, status: 'done', completed_at: TODAY }),
    project()
  ];
  const c = M.counts(items, TODAY);
  eq([c.overdue, c.today, c.next7, c.open, c.bySubject.maths, c.byType.project], [1, 1, 2, 4, 2, 1]);
  eq(M.oldestLate(items, TODAY), 3);
  eq(M.doneOn(items, TODAY).length, 1);
});
test('weekly: on time means completed on or before the due date', () => {
  const done = (completed, due) => M.blank('homework', { title: 'x', status: 'done', completed_at: completed, due_date: due });
  const w = M.weekly([done('2026-10-05', TODAY), done(TODAY, '2026-10-05'), done(TODAY, null)], M.weekStarts(TODAY, 8));
  eq(w.length, 8);
  eq(w[0].start, '2026-08-17');
  const last = w[7];
  eq([last.start, last.completed, last.rated, last.onTime, last.rate], ['2026-10-05', 3, 2, 1, 50]);
  eq(w[6].rate, null);
});
test('search needs every word', () => {
  const i = M.blank('homework', { title: 'Vectors worksheet', subject: 'physics' });
  eq([M.matches(i, 'vect phys'), M.matches(i, 'vect maths'), M.matches(i, '')], [true, false, true]);
});
test('term start is the most recent 1 September', () => {
  eq([M.defaultTermStart(TODAY), M.defaultTermStart('2027-03-01')], ['2026-09-01', '2026-09-01']);
});

console.log(process.exitCode ? 'Some tests failed.' : `All ${passed} tests passed.`);
