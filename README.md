# Daybook

Daybook is a personal tracker for homework, assignments, and personal projects in one place.
Every screen answers one question first: what must I do today, and what is due soon?

## Features
- **Offline first:** Runs entirely in your browser using `localStorage`. No accounts, no backend.
- **Fast:** Vanilla JavaScript, plain HTML, CSS tokens. No build steps.
- **Everything in one place:** Consolidate Homework, Assignments, Projects, and Calendar timelines.
- **Stats:** Simple completion visualizations.
- **Privacy first:** Data stays on your laptop. Import and Export backups as plain JSON.

## How to use

1. Double click `index.html` to open it in your web browser.
2. The app stores its data in your browser's local storage.
3. You can click "Export JSON" at any time from the bottom of the sidebar to save a backup to your computer.
4. You can click "Import" next to it to load data from a previous backup.

## Development

- There is no dev server or bundler. Just edit the `js/*.js` files or `app.css`.
- Open `index.html` in your browser. Refresh to see your changes.
- CSS components and colours are driven by `tokens.css` and `components/bundle.css`. Do not edit these directly (they are output by `tools/build_tokens.py`).

### Tests

To verify data logic rules (dates, sorting, item schemas):
```
node tests/run.js
```
