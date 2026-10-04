# Button

The quiet default is the grey outline button; use the solid primary once per screen, for the main action of that screen (“New item”, “Mark done”).

- **Kinds:** `btn btn--primary` (ink fill), `btn` (default), `btn btn--ghost` (no border, for Cancel and toolbar links), `btn btn--danger` (Delete, text in `overdue`), `btn btn--icon` (square, icon only; give it an `aria-label`).
- **Sizes:** 28px by default (`control-h`), `btn--lg` 36px, `btn--touch` 44px on the phone.
- **You provide:** a verb-first label in sentence case, an optional leading icon, and an optional `.kbd` hint after the label when a key triggers it.
- Do not colour a button by subject or status. Do not put two primary buttons side by side.
