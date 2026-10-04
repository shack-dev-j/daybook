const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');
code = code.replace(
  "if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {",
  "if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {\n      if (e.key === 'Enter' && e.target.id === 'global-ai-input') {\n        e.preventDefault();\n        D.askGlobalAI(e.target.value);\n        e.target.value = '';\n        return;\n      }"
);
fs.writeFileSync('js/app.js', code);
