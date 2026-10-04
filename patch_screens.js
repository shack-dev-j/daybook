const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');
code = code.replace(
  "{ id: 'ai', name: 'AI Assistant', icon: 'sparkles' }",
  "{ id: 'ai', name: 'AI Assistant', icon: 'sparkles' },\n    { id: 'prefs', name: 'Preferences', icon: 'settings' }"
);
// Also add applyPrefs zoom logic
code = code.replace(
  "D.setTheme(state.prefs.theme);",
  "D.setTheme(state.prefs.theme);\n    document.body.style.zoom = state.prefs.zoom || 1;"
);
fs.writeFileSync('js/app.js', code);
