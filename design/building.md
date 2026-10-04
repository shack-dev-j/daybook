# Building it

Plain HTML, CSS and JavaScript, no framework and no build step.

## Files

- `index.html`, one `app.js`, and two stylesheets: the compiled `tokens.css` and `components/bundle.css`.
- `fonts/Geist-Variable.woff2` beside them. `components/bundle.js` gives you the icons and the theme helpers.
- Wrap the app in an element with class `db`; every component class expects it.

## Themes

- Colours are CSS variables. Dark is the default; `<html data-theme="light">` switches every token.
- `Daybook.loadTheme()` returns the saved theme, or the system preference the first time. `Daybook.setTheme('dark')` applies and saves it.
- To change a colour, change the token. Do not write a hex value in a component.

## Data

One item shape for all three kinds, stored as one JSON array.

| Field | Shown as |
| --- | --- |
| `id` | not shown |
| `type` | type tag and icon; decides which screen lists it |
| `title` | row or card title |
| `subject` | dot and name |
| `due_date` | “Tue 6 Oct” and the relative label |
| `priority` | signal icon and Low, Med or High |
| `status` | status tag; for projects the board column |
| `checklist[]` | “4/6” and the progress bar; a project's milestones |
| `notes` | first two lines on cards; all of it in the drawer |
| `links[]` | Links in the drawer; the first GitHub link on a project card |
| `score` | “34 / 40” and the percentage; assignments only |
| `created_at`, `completed_at` | drawer footer; `completed_at` feeds Stats |

- Store `score` as `{ got, outOf }` so the percentage can be worked out.
- Store dates as `YYYY-MM-DD` strings and compare them as strings; no date library is needed.
- Overdue, today and “in 3 days” are never stored. Work them out from `due_date`, `status` and today's date each time you draw.
- On time means `completed_at` is on or before `due_date`.

## Storage

- Keep everything under one `localStorage` key, for example `daybook.items`, and save after every change.
- Export JSON downloads that array as a file; Import reads one back. That file is the backup.
- A few hundred items is a few hundred kilobytes at most. Re-drawing the current screen after each change is fast enough; no virtual list is needed.

## Keyboard

- One `keydown` listener on `document`. Skip single-letter shortcuts when the target is an input, select or textarea.
- Lists use a roving `tabindex`: one focused row at a time, moved with the arrow keys.
