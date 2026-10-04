const fs = require('fs');
let code = fs.readFileSync('js/drawer.js', 'utf8');

const newClickHandlers = `
    } else if (act === 'drawer-pick-subject') {
      const menu = document.createElement('div');
      menu.style.cssText = 'position:absolute;background:var(--surface-raised);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-pop);padding:4px;display:flex;flex-direction:column;gap:4px;z-index:100;';
      const rect = t.getBoundingClientRect();
      menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      menu.style.left = (rect.left + window.scrollX) + 'px';
      
      D.config.SUBJECTS.forEach(s => {
        const b = document.createElement('button');
        b.className = 'btn btn--ghost';
        b.style.justifyContent = 'flex-start';
        b.innerHTML = D.ui.subjectDot(s.id) + D.ui.esc(s.name);
        b.onclick = () => {
          currentItem.subject = s.id;
          D.app.render();
          renderDrawer();
          menu.remove();
        };
        menu.appendChild(b);
      });
      
      document.body.appendChild(menu);
      
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== t) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);

    } else if (act === 'drawer-pick-date') {
      const menu = document.createElement('div');
      menu.style.cssText = 'position:absolute;background:var(--surface-raised);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-pop);padding:8px;display:flex;flex-direction:column;gap:4px;z-index:100;width:200px;';
      const rect = t.getBoundingClientRect();
      menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      menu.style.left = (rect.left + window.scrollX) + 'px';
      
      const today = D.dates.today();
      const options = [
        { label: 'Today', date: today },
        { label: 'Tomorrow', date: D.dates.add(today, 1) },
        { label: 'In a week', date: D.dates.add(today, 7) },
        { label: 'No date', date: null }
      ];
      
      options.forEach(o => {
        const b = document.createElement('button');
        b.className = 'btn btn--ghost';
        b.style.justifyContent = 'flex-start';
        b.innerText = o.label + (o.date ? ' (' + D.dates.short(o.date) + ')' : '');
        b.onclick = () => {
          currentItem.due_date = o.date;
          D.app.render();
          renderDrawer();
          menu.remove();
        };
        menu.appendChild(b);
      });
      
      const inputWrap = document.createElement('div');
      inputWrap.style.marginTop = '8px';
      inputWrap.style.borderTop = '1px solid var(--border)';
      inputWrap.style.paddingTop = '8px';
      
      const input = document.createElement('input');
      input.type = 'date';
      input.className = 'input';
      input.style.width = '100%';
      input.value = currentItem.due_date || '';
      input.onchange = () => {
        if (input.value) {
          currentItem.due_date = input.value;
          D.app.render();
          renderDrawer();
        }
        menu.remove();
      };
      inputWrap.appendChild(input);
      menu.appendChild(inputWrap);
      
      document.body.appendChild(menu);
      
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== t) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);
`;

code = code.replace("} else if (act === 'drawer-set-type') {", newClickHandlers + "\n    } else if (act === 'drawer-set-type') {");

fs.writeFileSync('js/drawer.js', code);
