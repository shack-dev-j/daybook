# Daybook: handover for the coding agent

Daybook is a personal tracker for one student: homework, assignments and personal
projects in one place. Every screen answers one question first: what must I do today,
and what is due soon?

The design is finished. The rules of the app (dates and items) are written and tested.
**Your job is to build the interface on top of them.** Read this whole file before you
write anything.

## Hard rules

1. Plain HTML, CSS and JavaScript. No framework, no npm packages, no build step, no CDN.
2. The app must work when `index.html` is opened by double-click (`file://`), offline.
   That means classic `<script src>` tags, not ES modules, and no `fetch()` of local files.
3. It must stay light: the laptop has 8 GB of RAM. Do not start dev servers, bundlers or
   watchers.
4. Follow `design/README.md` exactly. It is the brand book: colour, type, voice, states,
   keyboard, icons. `design/screens.md` says how each screen behaves.
5. Colours, spacing and radii come from tokens (`var(--ink)`, `var(--space-3)`). Never
   write a hex value outside `tokens.css`. Do not add colours, gradients or shadows.
6. Do not edit `components/bundle.css`, `components/bundle.js` or `tokens.css` by hand.
   They come from the design system. To change a token, edit `design/tokens.json` and run
   `python3 tools/build_tokens.py`. App-only CSS goes in a new `app.css`.
7. Every piece of text that came from the user goes through an `esc()` function before it
   is put into HTML. Links are opened only if `Daybook.model.cleanUrl()` accepts them.
8. No emoji, no exclamation marks, sentence case, verb-first buttons (see the brand book).
9. Work in small steps. After each step: run `node tests/run.js`, open `index.html`, check
   the browser console is clean, then stop and report.

## What is already here

| Path | What it is | Status |
| --- | --- | --- |
| `tokens.css` | Colours (dark default, light via `<html data-theme="light">`), spacing, radius, sizes, type classes, the font face | done, generated |
| `components/bundle.css` | Every component class: buttons, tags, rows, cards, panels, drawer, board, calendar, charts, phone | done, do not edit |
| `components/bundle.js` | `Daybook.icon(name, cls)`, `Daybook.setTheme(id)`, `Daybook.loadTheme()` | done, do not edit |
| `fonts/Geist-Variable.woff2` | The one font, local so the app works offline | done |
| `js/config.js` | Subjects, types, statuses, priorities, grade bands, limits, storage keys | done |
| `js/dates.js` | `Daybook.dates`: date maths and formats on `YYYY-MM-DD` strings | done, tested |
| `js/model.js` | `Daybook.model`: clean items, time states, entries, sorting, search, counts, stats | done, tested |
| `tests/run.js` | `node tests/run.js` (no dependencies) | done, passing |
| `tools/build_tokens.py` | Compiles `design/tokens.json` into `tokens.css` | done |
| `design/` | The design system: brand book, screen behaviour, component notes | reference |
| `design/previews/*.html` | Every screen and component as real HTML. Open them in a browser | reference |
| `design/screenshots/*.png` | The same screens as images, dark and light | reference |

Nothing else exists yet: no `index.html`, no `app.css`, no storage, no screens.

## How to use the design previews

`design/previews/Screen1Today.html` and the others are the source of truth for markup.
Each file holds a dark frame and a light frame. **Copy the class structure from inside
`<div class="db app" data-theme="dark">`** and fill it with real data. Do not invent new
markup when a preview already shows it.

- In the previews the icons are pasted in as raw `<svg>`. In the app, call
  `Daybook.icon('book-open')` or `Daybook.icon('calendar', 'ico--sm')` instead.
- The preview frame is a fixed 1366 x 768 box. The real app fills the window: in `app.css`
  override `.db.app { width: 100%; height: 100dvh; outline: 0 }` and
  `.db .page { overflow: auto }`.
- Selects in the previews are `<div class="select">`. Use `<button type="button" class="select">`.
- The phone previews use `<div class="db phone">`. Under 720px wide, render that shell
  (top bar `m-top`, body `m-body`, `fab`, `tabbar`) and override its fixed 375 x 720 size.
- Wrap the whole app in one element with class `db`.

## File plan

`design/building.md` says "one `app.js`". This project deliberately splits it into small
classic scripts that share the `window.Daybook` object, so each file stays short and the
logic can be tested under Node. Keep that split:

```
index.html
tokens.css  components/bundle.css  app.css        (loaded in that order)
components/bundle.js                              (first script: creates window.Daybook)
js/config.js  js/dates.js  js/model.js            (exist)
js/store.js           load, save, export, import, undo snapshot, preferences
js/ui.js              esc(), tags, rows, checkbox, progress, empty state, menu, date picker, toast
js/screens/today.js   homework.js  assignments.js  projects.js  calendar.js  stats.js
js/drawer.js          the task detail drawer
js/app.js             state, routing (location.hash), render, click delegation, keyboard, boot
```

Each new file follows the pattern of the existing ones:

```js
(function (root) {
  'use strict';
  const D = root.Daybook;          // config, dates, model are already on it
  D.store = { /* ... */ };
})(window);
```

## Data model

One item shape for all three kinds. Always create items with `Daybook.model.blank(type, fields)`
and pass anything loaded or imported through `Daybook.model.normaliseAll(list)`.

```js
{
  id: 'm8k2x1a9bc',
  type: 'homework' | 'assignment' | 'project',
  title: 'Vectors worksheet: resolving forces',
  subject: 'cs' | 'physics' | 'maths' | 'cyber' | 'other',
  due_date: '2026-10-08' | null,
  priority: 'low' | 'med' | 'high',
  status: 'todo' | 'progress' | 'done'               // homework, assignment
        | 'idea' | 'building' | 'testing' | 'done',  // project: the board column
  checklist: [{ id, text, done, due: '2026-10-10' | null, done_at }],
  notes: '',
  links: [{ url, label }],
  score: { got: 34, outOf: 40 } | null,              // shown for assignments only
  next_action: '',                                   // projects: overrides "first unticked milestone"
  created_at: '2026-09-28',
  completed_at: '2026-10-06' | null
}
```

- `subject`, `type`, `status` and `priority` are stored as ids. The ids are also the CSS
  suffixes: `dot--physics`, `fill--physics`, `ch-physics`, `tag--hw`, `ev--assign`.
  Names and icons come from `Daybook.config`.
- Dates are `YYYY-MM-DD` strings and are compared as strings. Get today with
  `Daybook.dates.today()`. Never use `toISOString()` for dates: it returns the UTC day.
- Overdue, today and "in 3 days" are never stored. Use `model.timeState(date, done, today)`
  and `dates.relative(date, today)` each time you draw.
- **Entries.** A project's milestones (its checklist) can each have a date. `model.entries(items)`
  returns one entry per deadline: one per homework or assignment, and for a project one per
  dated milestone plus one for its own due date. Today, Next 7 days and Calendar draw
  entries, not items. An entry is `{ key, item, step, date, done, doneAt }`. Ticking the
  checkbox on a milestone entry ticks that milestone (`model.toggleStep`); on any other
  entry it finishes the item (`model.toggleDone`). `model.entryTitle(e)` gives
  "Project title: milestone".
- Returned assignments are simply assignments with status `done`. Grade is worked out:
  `model.grade(model.scorePct(item.score))`.

## What `Daybook.dates` and `Daybook.model` give you

Read the two files; they are short and commented. The main calls:

- `dates`: `today() add(d, n) diff(a, b) weekday(d) startOfWeek(d) startOfMonth(d) addMonths(d, n)
  daysInMonth(d) isValid(d)` and formats `short(d)` "Tue 6 Oct", `withYear(d)`, `long(d)`,
  `dayMonth(d)`, `monthYear(d)`, `range(a, b)` "5 - 11 October 2026", `relative(d, today)`.
- `model` lookups: `subject(id) type(id) priority(id) status(type, id) statusList(type)`.
- `model` items: `blank(type, fields) blankStep(text) normalise(raw) normaliseAll(list)`.
- `model` derived: `isDone progress nextStep nextAction dueOf timeState itemState githubLink
  scorePct grade`.
- `model` changes (they change the item you pass): `setStatus toggleDone cycleStatus setType
  toggleStep moveProject`.
- `model` lists: `entries doneOn entryTitle sortItems.{due,priority,title,completed}
  sortEntries.{oldest,day,calendar} matches(item, query)`.
- `model` numbers: `counts(items, today) weekStarts(today, n) weeksSince(start, today)
  weekly(items, starts) workload(items) oldestLate(items, today) defaultTermStart(today)`.
- `model` links: `cleanUrl(text) parseLink(text) prettyUrl(url) isGithub(url)`.

If you need a new rule, add it to `model.js` with a test in `tests/run.js`. Do not put
date or status logic inside screen files.

## Storage

- Keep the items array under the `localStorage` key `daybook.items` (see `config.KEYS`) and
  save after every change. Wrap every read and write in `try/catch`.
- Export JSON downloads `{ "daybook": 1, "exported_at": "...", "items": [...] }`. Import
  accepts that or a bare array, runs it through `normaliseAll`, and asks "replace" or "add".
  Before a replace, copy the old array to `daybook.items.backup`.
- Mark done and Delete take effect at once and show a toast with Undo for five seconds.
  The simplest undo is to keep a copy of the items array from before the change.
- Keep small preferences (theme, filters, last quick-add subject and due date) under
  `daybook.ui`.

## Build order

Do one step, verify it, report, then wait. Do not start the next step on your own.

1. **Shell.** `index.html`, `app.css`, `js/store.js`, `js/ui.js`, `js/app.js`. Sidebar with
   the six screens and the subject filter, top bar with title, search and New item, theme
   switch, `location.hash` routing, and one hard-coded sample item to prove a render.
   Check: matches the sidebar and top bar of `design/screenshots/Screen1Today-dark.png`.
2. **Today.** Summary line, Overdue panel (hidden when empty), Due today, collapsed Done
   today, Next 7 days grouped by day. Round checkbox marks done with Undo.
3. **Homework.** Quick-add row (Enter adds, remembers subject and due date), Open / Done /
   All, groups by subject that collapse, status tag cycles on click.
4. **Drawer.** Opens from any row. Title, type, subject, due date, priority, status, score
   (assignments), checklist, notes, links, Delete, Mark done. Saves as you type, no Save
   button. Esc closes and focus returns to the row.
5. **Assignments.** Active cards in three columns, returned table with score, %, grade.
6. **Projects.** Four-column board, drag a card or use the left and right arrow keys,
   milestone progress, next action, GitHub link.
7. **Calendar.** Month and week views drawn from `model.entries`.
8. **Stats.** Four tiles, completed per week, on-time rate, workload per subject, Table view.
9. **Keyboard and search.** The key table in `design/README.md`; search filters by
   `model.matches`.
10. **Phone layout** under 720px, from `Mobile1Today.html` and `Mobile2Homework.html`.
11. **Export, import, sample data**, then write `README.md` (how to open it, how to back up).

## Notes that will save you time

- **Rendering.** Redrawing the current screen after each change is fast enough. Build HTML
  strings and set `innerHTML` on the page area only. Never redraw an input the user is
  typing in (search box, quick-add, drawer fields): redraw around it.
- **Clicks.** One `click` listener on `document` that reads `data-act` and `data-id` from
  `event.target.closest('[data-act]')` keeps every screen file free of listeners.
- **Keyboard.** One `keydown` listener. Skip single-letter shortcuts when the target is an
  input, select or textarea, or when Ctrl, Alt or Meta is held. Lists use a roving
  `tabindex`: one focusable row at a time, moved with the arrow keys. After a redraw, put
  focus back on the row with the same `data-key`.
- **Focus ring.** Rows sit inside panels with `overflow: hidden`, so give focused rows an
  inset ring: `outline-offset: -2px`.
- **Not in the design system yet:** the dropdown menu, the date picker and the toast. Build
  them from existing tokens only: `surface-raised` fill, 1px `border`, `radius-md`,
  `shadow-pop`. The date picker needs Today, Tomorrow, In a week and No date shortcuts.
- **Calendar month.** `bundle.css` assumes five week rows. Some months need four or six: set
  `grid-template-rows: 28px repeat(N, 1fr)` inline, and show two chips instead of three
  when there are six rows.
- **Scrolling.** Board columns and week columns need their own `overflow-y: auto`, or cards
  are clipped.
- **Charts** are inline SVG, no library. Geometry from the Stats preview: bar chart
  `viewBox="0 0 640 190"`, plot from x 24 to 632, baseline y 168, tallest bar top y 14, bars
  at most 24 wide with a 4px rounded top; line chart `viewBox="0 0 420 190"`, x 36 to 376.
  Label only the latest value and the extreme.
- **Midnight.** The app can stay open overnight. Redraw when the tab becomes visible and
  when `dates.today()` changes.
- **Subjects** are fixed at five. To add one: a `subject-xxx` colour in `design/tokens.json`
  (both themes), `dot--xxx`, `fill--xxx` and `ch-xxx` rules in `app.css`, and one line in
  `config.SUBJECTS`.

## Done means

- `node tests/run.js` prints "All tests passed."
- `index.html` opens by double-click with no console errors and no network requests.
- Each screen matches its screenshot in dark and light at 1366 x 768 with no horizontal
  scroll, and is usable at 375px wide.
- Reloading the page keeps every item. Export then Import gives back the same items.
- Every action works from the keyboard, and the focus ring is always visible.
