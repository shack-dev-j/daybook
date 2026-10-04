const fs = require('fs');
let code = fs.readFileSync('js/drawer.js', 'utf8');

const navCode = `
    } else if (act === 'drawer-prev' || act === 'drawer-next') {
      const rows = Array.from(document.querySelectorAll('[data-key]'));
      if (!rows.length) return;
      let idx = rows.findIndex(r => r.getAttribute('data-key') === currentItem.id);
      if (idx === -1) return;
      if (act === 'drawer-prev' && idx > 0) {
        D.drawer.open(rows[idx - 1].getAttribute('data-key'));
      } else if (act === 'drawer-next' && idx < rows.length - 1) {
        D.drawer.open(rows[idx + 1].getAttribute('data-key'));
      }
`;

code = code.replace("} else if (act === 'drawer-close') {", navCode + "\n    } else if (act === 'drawer-close') {");

fs.writeFileSync('js/drawer.js', code);
