(function (root) {
  'use strict';
  const D = root.Daybook;

  async function parseTasksWithGemini(text, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // We want the AI to return an array of objects matching the Daybook item schema.
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "A clear, concise title for the task" },
          type: { type: "string", enum: ["homework", "assignment", "project"], description: "Type of task" },
          subject: { type: "string", enum: ["cs", "physics", "maths", "cyber", "other"], description: "Subject of the task" },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format. Null if none.", nullable: true },
          priority: { type: "string", enum: ["low", "med", "high"] }
        },
        required: ["title", "type", "subject", "priority"]
      }
    };

    const prompt = `
You are an AI assistant for a student's Daybook task manager.
Parse the following user input and extract a list of tasks.
Map subjects to: cs, physics, maths, cyber, or other.
Map types to: homework, assignment, or project.
Map priority to: low, med, or high.
Extract due dates into YYYY-MM-DD format (assume the current year is 2026 if not specified).

User input:
${text}
`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: schema
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to call Gemini API');
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
  }

  function render(container, items, state) {
    const hasKey = !!state.prefs.geminiKey;
    
    let html = `
      <div class="panel" style="max-width: 600px; margin: 24px auto;">
        <h2 class="panel__head">${D.icon('sparkles')}Gemini Assistant</h2>
        <div style="padding: 16px;">
    `;

    if (!hasKey) {
      html += `
          <p style="margin-bottom: 12px; color: var(--ink-faint);">
            Enter your Gemini API Key to enable the AI assistant. This key is stored securely in your browser's local storage.
          </p>
          <div class="input">
            <input type="password" id="ai-key-input" placeholder="AIzaSy...">
          </div>
          <button class="btn btn--primary" id="ai-key-save" style="margin-top: 12px;">Save Key</button>
      `;
    } else {
      html += `
          <p style="margin-bottom: 12px; color: var(--ink-faint);">
            Tell me about your new homework, projects, or assignments, and I'll organize them for you.
          </p>
          <div class="input">
            <textarea id="ai-task-input" rows="4" placeholder="e.g., I have a physics assignment due next Friday and I need to do the math worksheet by tomorrow..."></textarea>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn btn--primary" id="ai-task-submit">${D.icon('wand-2')}Organize Tasks</button>
            <button class="btn" id="ai-key-clear">Clear API Key</button>
          </div>
          <div id="ai-status" style="margin-top: 16px; color: var(--ink-faint);"></div>
      `;
    }

    html += `</div></div>`;
    container.innerHTML = html;

    // Attach listeners
    if (!hasKey) {
      const btn = container.querySelector('#ai-key-save');
      btn.addEventListener('click', () => {
        const val = container.querySelector('#ai-key-input').value.trim();
        if (val) {
          state.prefs.geminiKey = val;
          D.store.savePrefs(state.prefs);
          D.app.render();
          D.ui.toast('Gemini Key saved');
        }
      });
    } else {
      const clearBtn = container.querySelector('#ai-key-clear');
      clearBtn.addEventListener('click', () => {
        state.prefs.geminiKey = null;
        D.store.savePrefs(state.prefs);
        D.app.render();
      });

      const submitBtn = container.querySelector('#ai-task-submit');
      const input = container.querySelector('#ai-task-input');
      const status = container.querySelector('#ai-status');

      submitBtn.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Thinking...';
        status.innerHTML = '';

        try {
          const newTasks = await parseTasksWithGemini(text, state.prefs.geminiKey);
          
          if (!newTasks || newTasks.length === 0) {
            status.innerHTML = 'No tasks found in your input.';
          } else {
            // Convert plain objects to Daybook items
            const generatedItems = newTasks.map(t => D.model.blank(t.type || 'homework', {
              title: t.title,
              subject: t.subject,
              due_date: t.due_date,
              priority: t.priority
            }));
            
            D.store.backupItems(state.items);
            state.items = state.items.concat(generatedItems);
            D.app.render();
            D.ui.toast(`Successfully imported ${generatedItems.length} task(s)!`);
          }
        } catch (err) {
          status.innerHTML = `<span style="color:var(--overdue)">Error: ${D.ui.esc(err.message)}</span>`;
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `${D.icon('wand-2')}Organize Tasks`;
        }
      });
    }
  }

  D.screens = D.screens || {};
  D.screens.ai = { render };
})(window);
