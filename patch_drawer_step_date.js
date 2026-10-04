const fs = require('fs');
let code = fs.readFileSync('js/drawer.js', 'utf8');

const newCode = `
    } else if (act === 'drawer-step-date') {
      const menu = document.createElement('div');
      menu.style.cssText = 'position:absolute;background:var(--surface-raised);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-pop);padding:8px;display:flex;flex-direction:column;gap:4px;z-index:100;width:200px;';
      const rect = t.getBoundingClientRect();
      menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      menu.style.left = (rect.left + window.scrollX) + 'px';
      
      const step = currentItem.checklist.find(s => s.id === id);
      if (!step) return;
      
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
          step.due = o.date;
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
      input.value = step.due || '';
      input.onchange = () => {
        if (input.value) {
          step.due = input.value;
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

code = code.replace("} else if (act === 'drawer-pick-subject') {", newCode + "\n    } else if (act === 'drawer-pick-subject') {");

fs.writeFileSync('js/drawer.js', code);
