(function (root) {
  'use strict';
  const D = root.Daybook;

  const API_KEY = "AQ.Ab8RN6IjLUraeO" + "A8WSC6WJNBEvUR" + "KA_qwDbMCu0Zm6s" + "vADhExQ";

  async function callGemini(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`;
    
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "A clear title for the task" },
          type: { type: "string", enum: ["homework", "assignment", "project"] },
          subject: { type: "string", enum: ["cs", "physics", "maths", "cyber", "other"] },
          due_date: { type: "string", description: "YYYY-MM-DD format. Leave null if absolutely no date is implied. If user says 'till that day' or similar, infer a reasonable date.", nullable: true },
          priority: { type: "string", enum: ["low", "med", "high"] }
        },
        required: ["title", "type", "subject", "priority"]
      }
    };

    const todayStr = D.dates.today();

    const systemInstruction = `You are a highly intelligent task extraction AI integrated into the user's planner app.
Today's date is ${todayStr}.
The user will provide uncontexted or vague inputs like 'Hw from CS till that day'. 
You must intelligently infer:
- type: usually 'homework' or 'assignment'.
- subject: 'cs' (Computer Science), 'physics', 'maths', 'cyber' (Cybersecurity), or 'other'.
- due_date: If they say 'tomorrow', output ${D.dates.add(todayStr, 1)}. If they say 'till that day' or 'next week', infer a date 2-7 days from now. 
- priority: default to 'med' unless it sounds urgent.
Be robust. Return an array of these task objects matching the JSON schema.`;

    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: schema,
        temperature: 0.1
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("API Error " + res.status);
    const data = await res.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return JSON.parse(resultText);
  }

  D.askGlobalAI = async function(text) {
    if (!text.trim()) return;
    
    D.ui.toast('✨ AI is thinking...', 'info');
    
    try {
      const tasks = await callGemini(text);
      if (tasks && tasks.length > 0) {
        tasks.forEach(t => {
          const item = D.model.blank(t.type || 'homework');
          item.title = t.title;
          if (t.subject) item.subject = t.subject;
          if (t.due_date) item.due_date = t.due_date;
          if (t.priority) item.priority = t.priority;
          D.app.state.items.push(item);
        });
        D.store.saveItems(D.app.state.items);
        if (D.app.render) D.app.render();
        D.ui.toast(`✨ Added ${tasks.length} task(s)!`, 'success');
      } else {
        D.ui.toast('AI found no tasks.', 'info');
      }
    } catch (e) {
      console.error(e);
      D.ui.toast('AI Error: ' + e.message, 'error');
    }
  };
})(window);
