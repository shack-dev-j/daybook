const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');
code = code.replace(
  "state.activeScreen = hash;\n    render();",
  "if (state.activeScreen !== hash && document.startViewTransition) {\n      state.activeScreen = hash;\n      document.startViewTransition(() => {\n        render();\n      });\n    } else {\n      state.activeScreen = hash;\n      render();\n    }"
);
fs.writeFileSync('js/app.js', code);
