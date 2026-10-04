const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');
code = code.replace(
  '<h1 class="top__title grow">${D.ui.esc(title)}</h1>\n        <span class="muted num">${D.ui.esc(dateStr)}</span>\n        <div class="top__actions">',
  '<h1 class="top__title grow">${D.ui.esc(title)}</h1>\n        <span class="muted num">${D.ui.esc(dateStr)}</span>\n        \n        <div class="input ai-bar" style="max-width: 350px; margin: 0 16px; flex:1; border: 1px solid var(--subject-physics); background: var(--surface-sunken); box-shadow: 0 0 8px rgba(127,73,254,0.15);">\n          <span style="color:var(--subject-physics)">✨</span>\n          <input type="text" id="global-ai-input" data-act="global-ai-submit" placeholder="Tell AI what to add..." style="border:none;background:transparent;outline:none;flex:1;min-width:0;color:inherit;">\n        </div>\n\n        <div class="top__actions">'
);
fs.writeFileSync('js/app.js', code);
