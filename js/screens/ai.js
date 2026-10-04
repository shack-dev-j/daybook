(function (root) {
  'use strict';
  const D = root.Daybook;

  function render(container, items, state) {
    container.innerHTML = `
      <div class="page" style="padding: 24px; max-width: 600px; margin: 0 auto; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px; margin-top: 48px;">✨</div>
        <h1 class="top__title" style="margin-bottom: 16px;">AI Assistant is Active</h1>
        <p style="color: var(--ink-muted); font-size: 15px; margin-bottom: 32px; line-height: 1.5;">
          The Gemini AI is permanently integrated into Daybook. You can type commands like <br>
          <strong style="color:var(--ink);">"Hw from CS till tomorrow"</strong> <br>
          directly into the shiny new AI bar at the top of any screen!
        </p>
        <div style="padding: 24px; background: var(--surface-sunken); border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <div class="input ai-bar" style="border: 1px solid var(--subject-physics); background: var(--surface); box-shadow: 0 0 15px rgba(127,73,254,0.15);">
            <span style="color:var(--subject-physics)">✨</span>
            <input type="text" id="ai-screen-input" placeholder="Or try it right here..." style="border:none;background:transparent;outline:none;flex:1;min-width:0;color:inherit;">
          </div>
          <p style="font-size:12px; color:var(--ink-muted); margin-top:12px;">Press Enter to magically add tasks.</p>
        </div>
      </div>
    `;

    const input = container.querySelector('#ai-screen-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          D.askGlobalAI(e.target.value);
          e.target.value = '';
        }
      });
      // Focus it for convenience
      setTimeout(() => input.focus(), 0);
    }
  }

  D.screens = D.screens || {};
  D.screens.ai = { render };
})(window);
