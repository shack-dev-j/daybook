(function (root) {
  'use strict';
  const D = root.Daybook;

  function render(container, items, state) {
    const currentZoom = state.prefs.zoom || 1;
    
    // Zoom options
    const options = [
      { value: 0.9, label: 'Small' },
      { value: 1, label: 'Normal' },
      { value: 1.1, label: 'Large' },
      { value: 1.25, label: 'Extra Large' }
    ];

    const zoomHtml = options.map(opt => `
      <label class="row" style="cursor:pointer; display:flex; align-items:center; gap:12px; padding:12px; border-radius:var(--radius-md); background:var(--surface); border:1px solid var(--border);">
        <input type="radio" name="prefs-zoom" value="${opt.value}" ${currentZoom == opt.value ? 'checked' : ''} style="width:16px;height:16px;">
        <span style="font-size:15px;">${D.ui.esc(opt.label)}</span>
      </label>
    `).join('');

    container.innerHTML = `
      <div class="page" style="padding: 24px; max-width: 600px; margin: 0 auto;">
        <h1 class="top__title" style="margin-bottom: 24px;">Preferences</h1>
        
        <section style="margin-bottom: 32px;">
          <h2 class="drawer__label" style="margin-bottom: 12px; font-size: 14px;">Text & UI Size</h2>
          <p style="color: var(--ink-muted); font-size: 13px; margin-bottom: 16px;">
            Choose a comfortable size for the application. This will scale all text, icons, and spacing.
          </p>
          <div style="display:flex; flex-direction:column; gap:8px;" id="prefs-zoom-group">
            ${zoomHtml}
          </div>
        </section>
      </div>
    `;

    // Add event listeners for the radio buttons
    const radios = container.querySelectorAll('input[name="prefs-zoom"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          const val = parseFloat(e.target.value);
          state.prefs.zoom = val;
          document.body.style.zoom = val;
          D.store.savePrefs(state.prefs);
        }
      });
    });
  }

  D.screens = D.screens || {};
  D.screens.prefs = { render };
})(window);
