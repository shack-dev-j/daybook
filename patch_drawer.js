const fs = require('fs');
let code = fs.readFileSync('js/drawer.js', 'utf8');

code = code.replace(
  'return html;',
  `if (currentItem.type === 'project' && !D.model.githubLink(currentItem)) {
      html += \`
        <div class="checklist__add" data-act="drawer-add-github">
          \${D.icon('github')}<span>Add GitHub link</span>
        </div>
      \`;
    }
    return html;`
);

code = code.replace(
  "} else if (act === 'drawer-add-link') {",
  `} else if (act === 'drawer-add-github') {
      const url = prompt('Paste GitHub repository URL:');
      if (url) {
        const link = D.model.parseLink(url) || { url: D.model.cleanUrl(url), label: 'GitHub repo' };
        if (link && link.url && D.model.isGithub(link.url)) {
          currentItem.links.unshift(link); // Put Github link first
          D.app.render();
          renderDrawer();
        } else {
          alert('Not a valid GitHub URL.');
        }
      }
    } else if (act === 'drawer-add-link') {`
);

fs.writeFileSync('js/drawer.js', code);
