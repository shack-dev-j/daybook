const fs = require('fs');
let code = fs.readFileSync('js/drawer.js', 'utf8');
code = code.replace(
  '<span class="checklist__date num" data-act="drawer-step-date"',
  '<span class="checklist__date num muted" style="margin-left:8px;font-size:12px;cursor:pointer;white-space:nowrap" data-act="drawer-step-date"'
);
fs.writeFileSync('js/drawer.js', code);
