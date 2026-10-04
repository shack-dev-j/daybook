(function (root) {
  'use strict';
  const D = root.Daybook;

  let containerRef = null;

  function render(container, items, state) {
    containerRef = container;
    
    if (!state.aiHistory) state.aiHistory = [];
    
    let html = `
      <div class="page" style="display: flex; flex-direction: column; height: 100%; position: relative;">
        
        <div id="ai-chat-messages" style="
          flex: 1; 
          overflow-y: auto; 
          padding: 32px 24px 120px 24px; 
          display: flex; 
          flex-direction: column; 
          gap: 32px;
          scroll-behavior: smooth;
        ">
          <div style="max-width: 800px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 32px;">
    `;

    if (state.aiHistory.length === 0) {
      html += `
        <div style="text-align: center; margin: 60px auto 0 auto; color: var(--ink);">
          <div style="font-size: 48px; margin-bottom: 24px; animation: slideInUp 0.5s ease-out;">✨</div>
          <h2 style="font-size: 28px; font-weight: 500; margin-bottom: 12px;">Hello, ${D.ui.esc("Shohjahon") || "there"}</h2>
          <p style="font-size: 16px; color: var(--ink-muted); max-width: 500px; margin: 0 auto; line-height: 1.6;">
            I'm your personal Daybook AI. I can manage your tasks, analyze your workload, or tell you what's due tomorrow.
          </p>
        </div>
      `;
    } else {
      state.aiHistory.forEach(msg => {
        const isUser = msg.role === 'user';
        let text = msg.parts[0].text;
        
        if (!isUser) {
          try {
            const parsed = JSON.parse(text);
            text = parsed.reply || text;
          } catch(e) {}
        }
        
        if (isUser) {
          html += `
            <div style="display: flex; justify-content: flex-end; width: 100%;">
              <div style="
                max-width: 70%;
                padding: 14px 20px;
                border-radius: 24px;
                background: var(--surface-raised);
                color: var(--ink);
                font-size: 15px;
                line-height: 1.5;
                border-bottom-right-radius: 6px;
              ">
                ${D.ui.esc(text).replace(/\\n/g, '<br>')}
              </div>
            </div>
          `;
        } else {
          html += `
            <div style="display: flex; justify-content: flex-start; width: 100%; gap: 16px;">
              <div style="
                width: 36px; height: 36px; 
                border-radius: 50%; 
                background: var(--subject-physics); 
                display: flex; align-items: center; justify-content: center; 
                font-size: 16px; color: white; flex-shrink: 0;
              ">✨</div>
              <div style="
                max-width: 85%;
                padding-top: 6px;
                color: var(--ink);
                font-size: 15px;
                line-height: 1.6;
              ">
                ${text.split('\\n').map(p => p.trim() ? \`<p style="margin-bottom: 12px;">\${D.ui.esc(p)}</p>\` : '').join('')}
              </div>
            </div>
          `;
        }
      });
    }

    html += `
          </div>
        </div>
        
        <div style="
          position: absolute; 
          bottom: 0; 
          left: 0; 
          right: 0; 
          padding: 24px; 
          background: linear-gradient(to top, var(--surface) 60%, transparent);
          display: flex;
          justify-content: center;
          pointer-events: none;
        ">
          <div style="
            width: 100%;
            max-width: 800px;
            display: flex; 
            gap: 12px;
            background: var(--surface-raised);
            border: 1px solid var(--border);
            border-radius: 32px;
            padding: 8px 8px 8px 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            align-items: center;
            pointer-events: auto;
          ">
            <input type="text" id="ai-chat-input" placeholder="Ask Gemini..." style="
              flex: 1;
              border: none;
              background: transparent;
              color: var(--ink);
              font-size: 15px;
              outline: none;
            ">
            <button id="ai-chat-send" style="
              background: var(--ink);
              color: var(--surface);
              border: none;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.2s, opacity 0.2s;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        </div>
        
        ${state.aiHistory.length > 0 ? \`
        <button class="btn" id="ai-clear-chat" style="
          position: absolute; 
          top: 24px; 
          right: 24px; 
          padding: 6px 12px; 
          font-size: 12px;
          background: var(--surface-raised);
          border: 1px solid var(--border);
        ">Clear chat</button>
        \` : ''}
      </div>
    `;

    container.innerHTML = html;

    const messagesDiv = container.querySelector('#ai-chat-messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const input = container.querySelector('#ai-chat-input');
    const sendBtn = container.querySelector('#ai-chat-send');
    const clearBtn = container.querySelector('#ai-clear-chat');

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.aiHistory = [];
        D.app.render();
      });
    }

    const sendMsg = () => {
      const text = input.value.trim();
      if (!text) return;
      sendMessage(text);
    };

    sendBtn.addEventListener('click', sendMsg);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMsg();
      }
    });

    setTimeout(() => input.focus(), 50);
  }

  async function sendMessage(text) {
    if (!containerRef) return;
    
    const state = D.app.state;
    if (!state.aiHistory) state.aiHistory = [];
    
    const input = containerRef.querySelector('#ai-chat-input');
    const messagesDiv = containerRef.querySelector('#ai-chat-messages');
    const sendBtn = containerRef.querySelector('#ai-chat-send');
    
    if (input) {
      input.value = '';
      input.disabled = true;
    }
    if (sendBtn) sendBtn.disabled = true;

    // We manually append to DOM so it feels instant
    const containerInner = messagesDiv.querySelector('div');
    
    const userDiv = document.createElement('div');
    userDiv.style = "display: flex; justify-content: flex-end; width: 100%;";
    userDiv.innerHTML = \`<div style="max-width: 70%; padding: 14px 20px; border-radius: 24px; background: var(--surface-raised); color: var(--ink); font-size: 15px; line-height: 1.5; border-bottom-right-radius: 6px;">\${D.ui.esc(text)}</div>\`;
    containerInner.appendChild(userDiv);
    
    const typingDiv = document.createElement('div');
    typingDiv.style = "display: flex; justify-content: flex-start; width: 100%; gap: 16px;";
    typingDiv.innerHTML = \`<div style="width: 36px; height: 36px; border-radius: 50%; background: var(--surface-raised); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--ink-muted); flex-shrink: 0; animation: pulse 1.5s infinite;">✨</div><div style="padding-top: 6px; color: var(--ink-muted); font-size: 15px;">Thinking...</div>\`;
    containerInner.appendChild(typingDiv);
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      await D.chatWithAI(text);
      D.app.render(); 
    } catch (e) {
      typingDiv.innerHTML = \`<div style="color: var(--overdue); font-size: 15px; padding-top: 6px;">Error: \${D.ui.esc(e.message)}</div>\`;
      if (input) input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  D.screens = D.screens || {};
  D.screens.ai = { 
    render, 
    sendMessage 
  };
})(window);
