# Drawer

The one place an item is edited: a panel that slides in from the right over a dimmed page.

- `drawer` is `drawer-w` wide on `surface-raised` with `shadow-drawer`; put a `scrim` behind it.
- **Parts:** `drawer__head` (type and time tags, previous, next, close), `drawer__body` (scrolls), `drawer__foot` (dates, Delete, Mark done).
- **Body order:** title, `props` list (type, subject, due date, priority, status, score), checklist, notes, links.
- Move focus into the drawer when it opens and back to the row when it closes. Esc closes it.
- Changes save as they are made. Do not add a Save button.
- On the phone the drawer fills the screen.
