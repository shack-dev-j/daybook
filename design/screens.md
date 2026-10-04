# Screens

Each screen below has a card under Components, in dark and light. All desktop frames are 1366 × 768; the two phone frames are 375 × 720.

## 1. Today

- Left column, top to bottom: a one-line summary (due today, overdue, next 7 days), the **Overdue** panel, the **Due today** panel, and a collapsed **Done today** panel.
- Overdue is its own panel with an `overdue` border and header. It disappears when nothing is overdue.
- Rows are two lines: title, then subject, type and checklist progress. The round checkbox marks the item done in one click and moves it to Done today; offer Undo for five seconds.
- Right column: **Next 7 days**, grouped by day, compact rows. A day with nothing shows “Nothing due. A free day.”
- Sort Overdue by oldest first. Sort Due today by priority, then by type (assignment, homework, project).
- Empty: “All clear for today” with tomorrow's count.

## 2. Homework

- The quick-add row is always first: title, subject, due date, priority, then Enter. Subject and due date remember the last values used.
- One table grouped by subject, each group collapsible. Columns: done checkbox, title, due date with relative label, status, priority.
- Filter with Open, Done, All. Clicking the status tag cycles To do, In progress, Done.
- Empty: “No homework yet. Type it in the row above and press Enter.”

## 3. Assignments

- Active assignments are cards in three columns, sorted by deadline: subject, status, title, deadline, priority, checklist progress, and the first two lines of notes.
- Returned assignments are a table so scores line up: submitted date, score, percentage, grade, notes. A returned item with no mark yet shows “— / 25” and an Awaiting tag.
- The Cards and Table switch shows everything in one form or the other.

## 4. Projects

- A board with four columns: Idea, Building, Testing, Done. Move a card by dragging, or with the left and right arrow keys when it has focus.
- A card shows subject, the next milestone's date, title, a progress bar (ticked milestones over all milestones, in the subject colour), the next action, and the GitHub link.
- The next action is the first unticked milestone unless the user writes one.
- A card with no link shows “Add GitHub link” in `ink-faint`.

## 5. Calendar

- Month and Week share one toolbar: previous, next, Today, the range title, the legend, and the Month or Week switch.
- A chip is filled with its type tone and carries the type icon; the dot is the subject. Overdue chips take an `overdue` ring and the warning icon. Done chips lose their fill and are struck through.
- Month: up to three chips per day, then “+2 more”. Today's date sits on `today-fill`.
- Week: seven day columns with larger items (title, subject, type) and a count at the foot. Deadlines are dates, not times, so there is no hour grid.

## 6. Task detail drawer

- Opens from any row, card or chip, `drawer-w` wide on the right, over a `scrim`. Esc closes it; the up and down buttons step through the list underneath.
- Order: type and time tags, title, properties (type, subject, due date, priority, status, score), checklist, notes, links. Created and completed dates stay in the footer beside Delete and Mark done.
- Score shows only for assignments. For a project the checklist is its milestones and a GitHub link field appears under Links.
- Every change saves immediately; there is no Save button.

## 7. Stats

- Four tiles: completed this week, on-time rate, open items, overdue.
- Tasks completed per week: eight columns, the current week solid.
- On-time rate: one line, completed on or before the due date over all completed, per week.
- Workload per subject: one bar per subject in its colour, with the split by type beside it.
- The Table switch shows the same numbers as rows.

## Phone

- Today and Homework keep the same order as on the laptop: Overdue, Due today, then the rest.
- Rows are two lines with a 22px round checkbox inside a 44px tap area. High priority shows the signal icon; other priorities are in the drawer.
- Homework keeps quick add at the top and the Open, Done, All filter as chips.
