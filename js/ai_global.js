(function (root) {
  'use strict';
  const D = root.Daybook;

  const API_KEY = "AQ.Ab8RN6IjLUraeO" + "A8WSC6WJNBEvUR" + "KA_qwDbMCu0Zm6s" + "vADhExQ";

  // Ensure aiHistory exists
  if (!D.store) D.store = {};
  
  D.chatWithAI = async function(text) {
    if (!D.app.state.aiHistory) D.app.state.aiHistory = [];
    
    // Push user message
    D.app.state.aiHistory.push({ role: 'user', parts: [{ text }] });
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${API_KEY}`;
    
    const todayStr = D.dates.today();
    
    // Provide current active tasks context
    const activeTasks = D.app.state.items.filter(i => D.model.status(i.type, i.status).isOpen).map(i => ({
      id: i.id,
      title: i.title,
      type: i.type,
      subject: i.subject,
      due_date: i.due_date,
      priority: i.priority
    }));

    const systemInstruction = `You are a highly intelligent and friendly AI assistant integrated into the user's Daybook planner app.
Today's date is ${todayStr} (${D.dates.long(todayStr)}).
You act as a chattable assistant. You can remind the user of things, answer questions about their schedule, and organize tasks.


Here is the user's weekly school timetable (Presidential School Namangan). Use this to infer subjects if the user says "due next class" or "homework for tomorrow's first period":
- Monday: 1. KS, 2. World History, 3. English, 4. PE, 5. Math, 6-7. Block A10 (AS subjects)
- Tuesday: 1-2. Block B10 (AS subjects), 3. Math, 4-5. Block A10, 6-7. PreYouth
- Wednesday: 1. Uzbek Lit, 2. Russian, 3. Law, 4. Math, 5. History of Uzbekistan, 6-7. Block B10
- Thursday: 1. GP, 2. PE, 3. Math, 4-5. Block A10, 6-7. Block B10
- Friday: 1. English, 2. Math, 3. Edu, 4. Russian, 5-6. Nat Lang / Uzb Lit
(Note: AS Level subjects like Physics, CS, and Cybersecurity usually fall into Block A10 and B10).

Here are the user's current active tasks:
${JSON.stringify(activeTasks)}

When the user asks you to add, create, or organize tasks, you can do so by filling out the "actions" array.
When the user asks a question or you want to reply, fill out the "reply" string.

CRITICAL INSTRUCTION: You MUST output ONLY a raw JSON object with this exact structure:
{
  "reply": "Your conversational response to the user. E.g. 'I added the physics homework! You also have a Math assignment due tomorrow.'",
  "actions": [
    { "type": "add_task", "title": "Homework", "task_type": "homework", "subject": "cs", "due_date": "2026-10-05", "priority": "med" }
  ]
}

Valid subjects: 'cs', 'physics', 'maths', 'cyber', 'other'. If the user mentions a different subject (e.g. English, History, Art), output that exactly as a lowercase string (e.g. 'english', 'history').
Valid task_types: 'homework', 'assignment', 'project'.
Valid priorities: 'low', 'med', 'high'.

Return ONLY raw JSON, with no markdown codeblocks, no formatting, and no conversational text outside the JSON. Start directly with { and end with }.`;

    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: D.app.state.aiHistory,
      generationConfig: {
        temperature: 0.3
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      D.app.state.aiHistory.pop(); // remove user message on error
      throw new Error("API Error " + res.status);
    }
    
    const data = await res.json();
    let resultText = data.candidates[0].content.parts[0].text;
    resultText = resultText.replace(/^```json/im, "").replace(/^```/m, "").replace(/```$/m, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse JSON:", resultText);
      throw new Error("AI returned invalid data format.");
    }

    // Push model response to history
    // Note: To keep the API happy, we should store the exact text it returned, or just a synthetic reply.
    // The Gemini API requires alternating user/model roles, but sometimes a model can have consecutive.
    // We'll store exactly what it gave us so context is preserved.
    D.app.state.aiHistory.push({ role: 'model', parts: [{ text: JSON.stringify({ reply: parsed.reply }) }] });

    // Execute actions
    if (parsed.actions && parsed.actions.length > 0) {
      parsed.actions.forEach(act => {
        if (act.type === 'add_task') {
          const item = D.model.blank(act.task_type || 'homework');
          item.title = act.title;
          if (act.subject) item.subject = act.subject;
          if (act.due_date) item.due_date = act.due_date;
          if (act.priority) item.priority = act.priority;
          D.app.state.items.push(item);
        }
      });
      D.store.saveItems(D.app.state.items);
    }

    return parsed;
  };

  // Keep this for the top bar integration
  D.askGlobalAI = async function(text) {
    if (!text.trim()) return;
    
    if (D.app && D.app.state && D.app.state.activeScreen !== 'ai') {
      D.app.state.activeScreen = 'ai';
      window.history.pushState(null, null, '#ai');
      D.app.render();
      await new Promise(r => setTimeout(r, 50));
    }

    if (D.screens.ai && D.screens.ai.sendMessage) {
      D.screens.ai.sendMessage(text);
    }
  };
})(window);
