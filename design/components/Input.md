# Input

Text fields, selects, the segmented control, search and the quick-add row.

- `input`, `select` and `textarea` share one look: `field` fill, 1px `border-strong`, `radius-md`, 28px tall. Use `input--lg` (32px) for a field that stands alone and `input--touch` (44px) on the phone.
- Wrap a control in `field` with a `field__label` above it. An error sets `is-invalid` and a `field__hint--error` line that says how to fix it.
- `seg` is for two to four fixed choices (status, priority, type, view). Mark the chosen one with `aria-pressed="true"`.
- `search` shows the `/` key at its right edge. `quickadd` is the one-line form at the top of Homework: title, subject, due date, priority, Add.
- Placeholders are examples or hints in `ink-faint`, never the only label.
