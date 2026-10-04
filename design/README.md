Daybook is a personal tracker for one student: homework, assignments and personal projects in one place. Every screen answers the same question first: what must I do today, and what is due soon?

## Principles

- **Chrome is neutral, colour is data.** Navigation, buttons and borders use only the `ink`, `surface` and `border` tokens. A hue on screen always means a subject or a time state, nothing else.
- **One meaning per channel.** Hue is the subject. Red, amber and green are the time state. Grey tone is the type of work. Never borrow one for another.
- **Dense, not cramped.** 13px text, 32px rows, 28px controls, laid out for a 1366 × 768 laptop. Let hairlines and spacing separate things before reaching for a box.
- **Keyboard first.** Every action is reachable without the mouse, and focus is always visible.

## Voice and content

- Write short, plain, friendly sentences in sentence case. No exclamation marks, no emoji.
- Start buttons with a verb: “New item”, “Mark done”, “Add”, “Export JSON”.
- Name things the same way everywhere: Homework, Assignment, Project. To do, In progress, Done. Idea, Building, Testing, Done.
- Write dates as “Tue 6 Oct”. Add the year only in the drawer and in date ranges. Put the relative label beside the date, never instead of it: “Today”, “Tomorrow”, “in 3 days”, “3 days late”.
- Write scores as “34 / 40” with the percentage beside it (“85%”). A score that has not come back is “— / 40”.
- Write checklist progress as “4/6”, or “4 of 6” where there is room.
- An empty state is one short title, one sentence that says what to do next, and at most one button: “All clear for today”, “Nothing due. A free day.”, “No homework yet. Type it in the row above and press Enter.”

## Colour

### Surfaces and ink

- Put the page on `bg`. Put the sidebar, panels, cards and table rows on `surface`. Put the drawer and menus on `surface-raised`. Put board columns and group headers on `surface-sunken`.
- Set text in `ink`, secondary text in `ink-muted`, and placeholders, disabled labels and done titles in `ink-faint`. All three hold 4.5:1 on every surface token in both themes.
- Use `border` for hairlines that only decorate. Use `border-strong` wherever the border is the control: inputs, checkboxes, outlined tags, keys.
- The primary button is an `ink` fill with `on-ink` text. There is no accent colour; do not add one.

### Subjects

| Subject | Token | Short label |
| --- | --- | --- |
| Computer Science | `subject-cs` | CS |
| Physics | `subject-physics` | Physics |
| Mathematics | `subject-maths` | Maths |
| Cybersecurity | `subject-cyber` | Cyber |
| Other | `subject-other` | Other |

- Show a subject as an 8px dot followed by its name. Use the same token for that subject's progress bars and chart bars on every screen.
- A subject colour is a mark, never a text colour and never a background for text.
- On a `type-assignment` or `type-project` fill, give the dot a 2px `surface` ring (`.dot--ring`) so it stays visible.
- The four hues are a set that stays distinct for red-green colour-blind readers in both themes. If you change one, re-check all four; if you add a subject, give it a short label and do not rely on a new hue alone.

### Time states

- Overdue: `overdue` text and warning icon on `overdue-soft`. The Overdue panel takes an `overdue` border and an `overdue-soft` header so it never blends into the list below it.
- Due today: `today` text and clock icon on `today-soft`. Today's date in the calendar and the due-today count sit on `today-fill` with `on-today-fill` text.
- Done: `done` text and tick on `done-soft`; a ticked checkbox is a `done` fill with an `on-ink` tick; the title is struck through in `ink-faint`.
- Every time state carries its word or its icon. Colour alone never says overdue, today or done.
- Priority is not coloured. Show it as the signal-bars icon and a label; High is `ink` and bold, Low and Med are `ink-muted`. Red is for overdue only.

### Type of work

- Homework is `type-homework` (lightest), Assignment is `type-assignment` (middle), Project is `type-project` (strongest, with `on-type-project` text). Each also has its own icon.
- Use the tone on type tags and on calendar chips. Elsewhere the icon is enough.
- The tones are greys on purpose: every hue is already taken by a subject or a time state.

## Type

- One family, Geist, loaded from `fonts/Geist-Variable.woff2` so the app works offline. The fallback is the system UI font.
- Use `text-title` for the page title, `text-strong` for panel and card headings, `text-body` for rows and inputs, `text-small` for metadata, `text-label` (capitals) for column headers only, `text-display` for stat values, `text-subtitle` for the drawer title. On the phone, rows use `text-body-lg`.
- Add `.num` (tabular figures) to every date, score, count and table column so digits line up. Leave stat-tile values in default figures.
- Weights are 400, 500 and 600. Do not use italics or lighter weights.

## Layout

- Desktop is a `sidebar-w` sidebar and a main column with a `topbar-h` top bar. The page has `space-4` padding above and `space-6` at the sides; panels sit `space-3` apart.
- Rows are `row-h` tall; two-line rows on Today are 48px. Controls are `control-h`.
- Below 720px wide, switch to the phone layout: the sidebar becomes a five-item bottom tab bar, New item becomes a floating button, rows become two lines and at least 60px tall, every control is at least `control-h-touch`, and the drawer opens full screen.

## Shape, borders and shadow

- `radius-sm` for tags, checkboxes and calendar chips; `radius-md` for buttons and inputs; `radius-lg` for cards, panels and columns; `radius-full` for dots, the round task checkbox and progress bars.
- Separate with a 1px `border` hairline. Only the drawer (`shadow-drawer`) and floating menus (`shadow-pop`) cast a shadow. No gradients.

## States

- Hover: `surface-hover` on rows, nav items and default buttons; cards switch their border to `border-strong`.
- Focus: a solid 2px `focus-ring` outline with a 2px offset; on list rows the outline is inset. Never remove it.
- Selected: the current nav item and the pressed segment take the raised fill and `text-strong`.
- Disabled: `surface-sunken` fill and `ink-faint` label.
- Motion is optional. If the drawer slides, keep it under 150ms and skip it when the system asks for reduced motion.

## Keyboard

| Key | Action |
| --- | --- |
| `N` | New item (opens the drawer on an empty item; on Homework it focuses the quick-add row) |
| `/` | Focus search |
| `↑` `↓` | Move through the current list |
| `Enter` | Open the focused item in the drawer |
| `Space` | Mark the focused item done, or undo |
| `Esc` | Close the drawer or clear the search |
| `1` to `6` | Go to Today, Homework, Assignments, Projects, Calendar, Stats |

Show the key beside the control it triggers with the `.kbd` style. Ignore single-letter shortcuts while the cursor is in a text field.

## Iconography

- Icons are Lucide 1.52 (ISC licence), outline, drawn inline as SVG at 16px with a 1.75 stroke in `currentColor`. `components/bundle.js` carries the set: `Daybook.icon('check')` returns the markup.
- Meanings are fixed. Screens and types: `house` Today, `book-open` Homework, `file-text` Assignment, `square-kanban` Project, `calendar-days` Calendar, `chart-column` Stats. Status: `circle` To do, `circle-dot` In progress, `check` Done. Time: `triangle-alert` overdue, `clock` today. Priority: `signal-low`, `signal-medium`, `signal-high`.
- No emoji and no brand logos. The GitHub field uses `git-branch`.

## Charts

- Use plain bars and a 2px line. Bars are at most 24px thick with a 4px rounded end and a square base.
- Colour a bar by subject only when the bar is a subject. Everything else is `ink-faint`, with the current period in `ink`.
- Set axis text and values in `ink-muted` and `ink`, never in the bar's colour. Label only the latest value and the extreme; the rest is on hover and in the Table view.
- Gridlines are `border`, the baseline is `border-strong`. One axis per chart.
