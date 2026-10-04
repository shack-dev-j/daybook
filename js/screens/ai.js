(function (root) {
  'use strict';
  const D = root.Daybook;

  let containerRef = null;

  function render(container, items, state) {
    containerRef = container;
    
    if (!state.aiHistory) state.aiHistory = [];
    
    let html = `
      <div class="page" style="display: flex; flex-direction: column; height: 100vh; max-width: 800px; margin: 0 auto; background: var(--surface); box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        
        <div style="padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; background: var(--surface-sunken);">
          <div style="font-size: 24px;">✨</div>
          <div>
            <h2 style="margin: 0; font-size: 16px; font-weight: 600;">Gemini Assistant</h2>
            <div style="font-size: 12px; color: var(--ink-muted);">Always here to help organize your life</div>
          </div>
          <div class="grow"></div>
          <button class="btn" id="ai-clear-chat" style="padding: 4px 8px; font-size: 12px;">Clear Chat</button>
        </div>

        <div id="ai-chat-messages" style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px;">
    `;

    if (state.aiHistory.length === 0) {
      html += `
        <div style="text-align: center; margin: auto; color: var(--ink-faint);">
          <div style="font-size: 48px; margin-bottom: 16px;">👋</div>
          <p>Hi! I'm your Daybook Assistant.</p>
          <p style="font-size: 13px;">You can ask me what's due tomorrow, tell me to add tasks, or just say hello!</p>
        </div>
      `;
    } else {
      state.aiHistory.forEach(msg => {
        const isUser = msg.role === 'user';
        let text = msg.parts[0].text;
        
        // If it's a model message, it's stored as JSON so parse it to show the reply
        if (!isUser) {
          try {
            const parsed = JSON.parse(text);
            text = parsed.reply || text;
          } catch(e) {}
        }
        
        html += `
          <div style="display: flex; flex-direction: column; align-items: ${isUser ? 'flex-end' : 'flex-start'};">
            <div style="
              max-width: 80%;
              padding: 12px 16px;
              border-radius: 16px;
              ${isUser 
                ? 'background: var(--subject-physics); color: white; border-bottom-right-radius: 4px;' 
                : 'background: var(--surface-raised); border: 1px solid var(--border); border-bottom-left-radius: 4px;'
              }
            ">
              ${D.ui.esc(text).replace(/\\n/g, '<br>')}
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
        
        <div style="padding: 16px 24px; border-top: 1px solid var(--border); background: var(--surface-sunken);">
          <div style="display: flex; gap: 12px;">
            <input type="text" id="ai-chat-input" placeholder="Type a message..." style="
              flex: 1;
              padding: 12px 16px;
              border-radius: 24px;
              border: 1px solid var(--border);
              background: var(--surface);
              color: var(--ink);
              outline: none;
            ">
            <button id="ai-chat-send" style="
              background: var(--subject-physics);
              color: white;
              border: none;
              border-radius: 50%;
              width: 44px;
              height: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const messagesDiv = container.querySelector('#ai-chat-messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const input = container.querySelector('#ai-chat-input');
    const sendBtn = container.querySelector('#ai-chat-send');
    const clearBtn = container.querySelector('#ai-clear-chat');

    clearBtn.addEventListener('click', () => {
      state.aiHistory = [];
      D.app.render();
    });

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

    // Auto-focus input if we just rendered the screen
    setTimeout(() => input.focus(), 50);
  }

  async function sendMessage(text) {
    if (!containerRef) return;
    
    // Optimistic UI update
    const state = D.app.state;
    if (!state.aiHistory) state.aiHistory = [];
    
    // We manually push to UI, but ai_global will also push to state. Let's let ai_global do it.
    // Wait, ai_global pushes to state. Let's just pass it to ai_global, then re-render!
    
    const input = containerRef.querySelector('#ai-chat-input');
    const messagesDiv = containerRef.querySelector('#ai-chat-messages');
    const sendBtn = containerRef.querySelector('#ai-chat-send');
    
    if (input) {
      input.value = '';
      input.disabled = true;
    }
    if (sendBtn) sendBtn.disabled = true;

    // Temporarily append the user message visually
    const userDiv = document.createElement('div');
    userDiv.style = "display: flex; flex-direction: column; align-items: flex-end;";
    userDiv.innerHTML = `<div style="max-width: 80%; padding: 12px 16px; border-radius: 16px; background: var(--subject-physics); color: white; border-bottom-right-radius: 4px;">${D.ui.esc(text)}</div>`;
    messagesDiv.appendChild(userDiv);
    
    const typingDiv = document.createElement('div');
    typingDiv.style = "display: flex; flex-direction: column; align-items: flex-start;";
    typingDiv.innerHTML = `<div style="padding: 12px 16px; border-radius: 16px; background: var(--surface-raised); border: 1px solid var(--border); border-bottom-left-radius: 4px; color: var(--ink-muted);">Thinking...</div>`;
    messagesDiv.appendChild(typingDiv);
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      await D.chatWithAI(text);
      D.app.render(); // full re-render captures the state updates
    } catch (e) {
      typingDiv.innerHTML = `<div style="padding: 12px 16px; border-radius: 16px; background: var(--overdue-fill); color: var(--overdue); border: 1px solid var(--overdue); border-bottom-left-radius: 4px;">Error: ${D.ui.esc(e.message)}</div>`;
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
