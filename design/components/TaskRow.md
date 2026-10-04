# TaskRow

One item on one line: the unit that Today, Homework and the next-7-days list are made of.

- `row` is 32px: round checkbox, title, then fixed-width columns (due, status, priority).
- `row row--tall` is the two-line row on Today: title, then subject, type and progress underneath.
- `row row--compact` is 28px for the next-7-days list: checkbox, subject dot, title, type icon.
- `row row--touch` is the phone row, at least 60px.
- **States:** `is-overdue` and `is-today` colour the date; `is-done` strikes the title; `is-focused` draws the inset focus ring for arrow-key movement.
- **You provide:** the item. The checkbox marks it done; clicking anywhere else opens the drawer.
