const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const MODEL = "llama3.2:3b"; // change later if you switch models

function buildMentorPrompt({ problemTitle, problemText, userCode, userMessage }) {
    return `
You are "Kai" — a friendly, calm LeetCode mentor.
Your personality: warm, conversational, human-like, slightly playful, never robotic.
You do NOT mention being an AI. You do NOT say "as an AI model".

MENTOR RULES (must follow):
- Do NOT provide a full solution.
- Do NOT provide final code or runnable functions.
- Do NOT give a complete end-to-end plan that reaches the final answer.
- Do NOT reveal the final approach in one message.
- Give at most: 1 short leading question + up to 2 hints + 1 concrete next action.
- Prefer questions, small nudges, and quick checks for understanding.
- If user asks for the solution, refuse gently and offer a smaller hint instead.
- Keep it concise. Friendly tone. No fluff.

STYLE:
- Use casual phrasing like: "Okay", "Let’s zoom out", "Quick check".
- Encourage: "Good instinct", "You're close", "Nice".
- If user pasted code, focus on one issue at a time (complexity, invariant, edge case).
- Avoid code blocks entirely.

CONTEXT:
Problem: ${problemTitle || "(unknown)"}

Statement (partial):
${(problemText || "").slice(0, 6000)}

User code (partial):
${(userCode || "").slice(0, 4000)}

User message:
${userMessage || ""}

Respond exactly in this format:

Kai:
Leading question: <one sentence>

Hint 1: <one sentence>
Hint 2: <one sentence>

Next action: <one clear step the user should do next>

Optional (only if helpful): "Common pitfall: <one sentence>"
`.trim();
}


async function callOllama(prompt) {
    const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: MODEL,
            prompt,
            stream: false,
            options: { temperature: 0.4 }
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.response;
}

// Safety clamp: if the model starts dumping code/solutions, replace it
function safetyClamp(text) {
    const bad = ["```", "class Solution", "def ", "here is the solution", "full solution"];
    const lower = (text || "").toLowerCase();
    if (bad.some(x => lower.includes(x.toLowerCase()))) {
        return `Leading question:
What is the brute-force approach here, and what makes it too slow?

Hints:
- Identify what information you repeatedly recompute; can you store it in a map/set?
- Try expressing each step as "need X; have we seen it already?"

Next action:
Write down the exact key/value you would store and when you would check it (before coding).`;
    }
    return text;
}

app.get("/health", (_, res) => res.json({ ok: true, model: MODEL }));

app.post("/mentor", async (req, res) => {
    try {
        const { problemTitle, problemText, userCode, userMessage } = req.body || {};
        const prompt = buildMentorPrompt({ problemTitle, problemText, userCode, userMessage });
        const reply = await callOllama(prompt);
        res.json({ reply: safetyClamp(reply) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(3333, () => console.log("Mentor server running at http://localhost:3333"));

app.post("/explain", async (req, res) => {
    const { problemTitle, problemText, userCode, mode } = req.body || {};

    const style =
        mode === "beginner"
            ? "Explain in beginner-friendly terms with intuition and a small example. No long code. No fluff."
            : mode === "technical"
                ? "Explain technically: algorithm, invariants, edge cases. Keep it crisp. No full code."
                : "Give time and space complexity with justification. Mention best/average/worst if relevant.";

    const prompt = `
You are Kai, a friendly LeetCode mentor.
User pasted their final solution/code. Your job:
- ${style}
- Also include: Time complexity and Space complexity at the end (even for beginner/technical).
- Do not output full solution code.

Problem: ${problemTitle}
Statement: ${(problemText || "").slice(0, 4000)}
User code: ${(userCode || "").slice(0, 8000)}
`.trim();

    try {
        const reply = await callOllama(prompt); // reuse your existing ollama helper
        res.json({ reply });
    } catch (e) {
        res.status(500).json({ error: String(e.message || e) });
    }
});

