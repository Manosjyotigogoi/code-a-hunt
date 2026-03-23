import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

function getModel() {
  return process.env.AI_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
}

function getHfApiKey() {
  return process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
}

async function readErrorBody(response) {
  try {
    const data = await response.json();
    return data?.error?.message || data?.error || data?.message || JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return '';
    }
  }
}

async function callAI(systemPrompt, userPrompt, maxTokens = 1000) {
  const MODEL = getModel();
  const HF_API_KEY = getHfApiKey();

  if (!HF_API_KEY) {
    throw new Error('Missing Hugging Face API key. Set HF_API_KEY (or HUGGINGFACE_API_KEY).');
  }

  const modelCandidates = [...new Set([
    MODEL,
    'meta-llama/Llama-3.1-8B-Instruct',
    'meta-llama/Meta-Llama-3.1-8B-Instruct',
  ])];

  const basePayload = {
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  let lastError = '';
  for (const model of modelCandidates) {
    const endpoints = [
      'https://router.huggingface.co/v1/chat/completions',
      `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}/v1/chat/completions`,
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HF_API_KEY}`,
        },
        body: JSON.stringify({ ...basePayload, model }),
      });

      if (!response.ok) {
        const body = await readErrorBody(response);
        lastError = `HF ${response.status} [${model}] at ${endpoint}: ${body || 'No error details'}`;
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) return content;
      if (Array.isArray(content)) {
        const merged = content.map((item) => (typeof item === 'string' ? item : item?.text || '')).join('\n').trim();
        if (merged) return merged;
      }

      lastError = `Empty AI response [${model}] at ${endpoint}`;
    }

    // Fallback for models/tokens that do not support OpenAI-style chat completions.
    const legacyEndpoint = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;
    const legacyResponse = await fetch(legacyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HF_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: `${systemPrompt}\n\n${userPrompt}`,
        parameters: {
          max_new_tokens: maxTokens,
          return_full_text: false,
        },
      }),
    });

    if (!legacyResponse.ok) {
      const body = await readErrorBody(legacyResponse);
      lastError = `HF ${legacyResponse.status} [${model}] at ${legacyEndpoint}: ${body || 'No error details'}`;
      continue;
    }

    const legacyData = await legacyResponse.json();
    const generated = Array.isArray(legacyData)
      ? legacyData?.[0]?.generated_text
      : legacyData?.generated_text;
    if (typeof generated === 'string' && generated.trim()) return generated.trim();

    lastError = `Empty AI response [${model}] at ${legacyEndpoint}`;
  }

  throw new Error(lastError || 'AI call failed for all Hugging Face endpoints.');
}

function parseJSON(raw) {
  try {
    return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return null;
  }
}

// POST /api/ai/questions
router.post('/questions', authMiddleware, async (req, res) => {
  const { subject, context, count = 5 } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required.' });
  try {
    const system = `You are an expert educator. Generate clear, well-structured practice questions.
Return ONLY a JSON array of question objects with fields: "question", "type" (mcq/short/long), "options" (array of 4 for mcq, null otherwise), "answer".`;
    const prompt = `Subject: ${subject}\nContext: ${context || 'General concepts'}\nGenerate ${count} practice questions of mixed types.`;
    const raw = await callAI(system, prompt, 1500);
    const questions = parseJSON(raw) || [];
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/summarize
router.post('/summarize', authMiddleware, async (req, res) => {
  const { subject, text } = req.body;
  if (!subject || !text) return res.status(400).json({ error: 'subject and text are required.' });
  try {
    const system = `You are a study assistant. Summarize study material clearly and concisely with key points, important definitions, and main concepts. Use structured formatting with bullet points and sections.`;
    const prompt = `Subject: ${subject}\n\nNotes:\n${text}\n\nProvide a comprehensive summary.`;
    const summary = await callAI(system, prompt, 1500);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/schedule
router.post('/schedule', authMiddleware, async (req, res) => {
  const { subjects, examDates, hoursPerDay } = req.body;
  if (!subjects?.length) return res.status(400).json({ error: 'subjects are required.' });
  try {
    const system = `You are a study planner. Create a realistic, personalized study schedule. Return a JSON object with a "schedule" array. Each item: { "date": "YYYY-MM-DD", "subject": "...", "topic": "...", "duration": "X hours", "priority": "high/medium/low" }`;
    const prompt = `Subjects: ${subjects.join(', ')}\nExam dates: ${JSON.stringify(examDates || [])}\nAvailable hours per day: ${hoursPerDay || 3}\nCreate a 2-week study schedule starting from today.`;
    const raw = await callAI(system, prompt, 2000);
    const result = parseJSON(raw) || { schedule: [] };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/ask
router.post('/ask', authMiddleware, async (req, res) => {
  const { question, subject, eduContext } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required.' });
  try {
    const system = `You are STAI, an intelligent study assistant. Answer questions clearly, accurately, and helpfully. Use examples where helpful. Keep answers student-friendly.\nStudent context: ${JSON.stringify(eduContext || {})}`;
    const prompt = `Subject: ${subject || 'General'}\nQuestion: ${question}`;
    const answer = await callAI(system, prompt, 1200);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/materials
router.post('/materials', authMiddleware, async (req, res) => {
  const { subject, level, weakAreas } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required.' });
  try {
    const system = `You are a study resource expert. Recommend specific, actionable study materials. Return JSON: { "materials": [{ "type": "book/video/website/practice", "title": "...", "description": "...", "url": "..." }] }`;
    const prompt = `Subject: ${subject}\nLevel: ${level || 'general'}\nWeak areas: ${weakAreas || 'general understanding'}\nRecommend 5-6 study materials.`;
    const raw = await callAI(system, prompt, 1000);
    const result = parseJSON(raw) || { materials: [] };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/growth
router.post('/growth', authMiddleware, async (req, res) => {
  const { subject, scores, topics } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required.' });
  try {
    const system = `You are a learning analyst. Analyze student performance data and provide insights. Return JSON: { "strengths": [], "weaknesses": [], "suggestions": [], "overallScore": 0-100, "trend": "improving/declining/stable" }`;
    const prompt = `Subject: ${subject}\nQuiz scores: ${JSON.stringify(scores || [])}\nTopics covered: ${(topics || []).join(', ')}`;
    const raw = await callAI(system, prompt, 800);
    const result = parseJSON(raw) || { strengths: [], weaknesses: [], suggestions: [], overallScore: 70, trend: 'stable' };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
