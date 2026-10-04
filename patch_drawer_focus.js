const fs = require('fs');
let code = fs.readFileSync('js/drawer.js', 'utf8');

code = code.replace(
  'let currentItem = null;',
  `let currentItem = null;
  let returnFocusEl = null;`
);

code = code.replace(
  'this.isOpen = true;',
  `this.isOpen = true;
      returnFocusEl = document.activeElement;
      // Focus drawer title or first input
      setTimeout(() => {
        if (drawerEl) drawerEl.querySelector('.drawer__title').focus();
      }, 0);`
);

code = code.replace(
  'this.isOpen = false;',
  `this.isOpen = false;
      if (returnFocusEl && document.body.contains(returnFocusEl)) {
        returnFocusEl.focus();
      } else if (currentItem) {
        // Try finding the row by data-key
        const row = document.querySelector(\`[data-key="\${currentItem.id}"]\`);
        if (row) row.focus();
      }`
);

fs.writeFileSync('js/drawer.js', code);
