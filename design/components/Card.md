# Card

A bordered surface for one item that needs more than a row: an assignment, a project, or a stat.

- `card` is a column with `space-2` gaps on `surface`, `radius-lg`, 1px `border`. Add `card--interactive` when the whole card opens the drawer; its border turns `border-strong` on hover.
- **Parts:** `card__row` (a line of tags, dates or progress), `card__title` (two lines at most), `card__note` (two lines of notes), `card__foot` (optional: a hairline, then secondary details).
- **You provide:** the item. Show the subject first, the status or date at the top right, then the title.
- A stat uses `tile` instead: label, value in `text-display`, one line of context.
- No shadow, no coloured edge, no cards inside cards. If the content fits on one line, use a TaskRow.
