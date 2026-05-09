import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

    // Fallback for models that do not support OpenAI-style chat completions.
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
  if (!raw) return null;

  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  try { return JSON.parse(cleaned); } catch {}

  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }

  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }

  return null;
}

// ---------------------------------------------------------------------------
// Subject → YouTube channel catalogue (hardcoded, 2 best channels per subject)
// YouTube search URL format: filters by channel using the `channel` param isn't
// reliable without the API, so we use /results?search_query=... which returns
// all results; the channel name in the title makes it clear.
// We build a deep-link per topic so the user lands on a real pre-filled search.
// ---------------------------------------------------------------------------

/**
 * Returns the two best YouTube channels for a given subject keyword.
 * Each entry: { channelName, channelHandle, channelUrl, description }
 */
function getChannelsForSubject(subject) {
  const s = subject.toLowerCase();

  const CHANNELS = {
    physics: [
      {
        channelName: 'Physics Wallah – Alakh Pandey',
        channelHandle: '@PhysicsWallah',
        channelUrl: 'https://www.youtube.com/@PhysicsWallah',
        description: 'Most popular physics channel for JEE/NEET in India. Clear concept-first lectures with solved problems, chapter-wise playlists for Class 11 & 12.',
      },
      {
        channelName: 'Vedantu JEE',
        channelHandle: '@VedantuJEEEnglish',
        channelUrl: 'https://www.youtube.com/@VedantuJEEEnglish',
        description: 'Live classes and recorded sessions for JEE Physics. Strong on optics, mechanics, and electrostatics with NCERT alignment.',
      },
    ],
    chemistry: [
      {
        channelName: 'Physics Wallah – Alakh Pandey',
        channelHandle: '@PhysicsWallah',
        channelUrl: 'https://www.youtube.com/@PhysicsWallah',
        description: 'Excellent organic chemistry mechanism walkthroughs and inorganic shortcuts. Covers full JEE/NEET chemistry syllabus.',
      },
      {
        channelName: 'Unacademy JEE',
        channelHandle: '@UnacademyJEEEnglish',
        channelUrl: 'https://www.youtube.com/@UnacademyJEEEnglish',
        description: 'Paraas Sir chemistry lectures are legendary — complete NCERT coverage with instant JEE-PYQ practice after each concept.',
      },
    ],
    mathematics: [
      {
        channelName: 'Vedantu Math',
        channelHandle: '@VedantuMath',
        channelUrl: 'https://www.youtube.com/@VedantuMath',
        description: 'Comprehensive Class 11–12 math channel with JEE-level problem solving, tricks, and NCERT solutions.',
      },
      {
        channelName: 'Physics Wallah – Alakh Pandey',
        channelHandle: '@PhysicsWallah',
        channelUrl: 'https://www.youtube.com/@PhysicsWallah',
        description: 'Strong maths playlists for JEE Main — calculus, coordinate geometry, algebra with lots of PYQs.',
      },
    ],
    biology: [
      {
        channelName: 'Vedantu Biotonic NEET',
        channelHandle: '@VedantuBiotonic',
        channelUrl: 'https://www.youtube.com/@VedantuBiotonic',
        description: 'NEET-focused biology channel. Covers Zoology and Botany with diagram-rich explanations and NCERT-based strategy.',
      },
      {
        channelName: 'LearnoHub – Class 11 & 12',
        channelHandle: '@LearnoHub',
        channelUrl: 'https://www.youtube.com/@LearnoHub',
        description: 'Free Class 11/12 science channel by award-winning educator Roshni Mukherjee. Structured biology playlists covering full NEET syllabus.',
      },
    ],
    economics: [
      {
        channelName: 'Vedantu Commerce',
        channelHandle: '@VedantuCommerceOfficial',
        channelUrl: 'https://www.youtube.com/@VedantuCommerceOfficial',
        description: 'Covers micro and macro economics for CBSE Class 11/12 with concept clarity and board exam tips.',
      },
      {
        channelName: 'Khan Academy India',
        channelHandle: '@khanacademyindia1',
        channelUrl: 'https://www.youtube.com/@khanacademyindia1',
        description: 'CBSE-aligned economics content focused on deep conceptual understanding. Short, clear videos ideal for building foundations.',
      },
    ],
    history: [
      {
        channelName: 'Unacademy UPSC',
        channelHandle: '@UnacademyIASEnglish',
        channelUrl: 'https://www.youtube.com/@UnacademyIASEnglish',
        description: 'In-depth Indian and world history lectures for UPSC/CBSE. Structured timelines and key events covered systematically.',
      },
      {
        channelName: 'Study IQ Education',
        channelHandle: '@StudyIQEducationLtd',
        channelUrl: 'https://www.youtube.com/@StudyIQEducationLtd',
        description: 'Modern and ancient history coverage with maps, infographics and current affairs integration for competitive exams.',
      },
    ],
    english: [
      {
        channelName: 'Vedantu English',
        channelHandle: '@VedantuEnglish',
        channelUrl: 'https://www.youtube.com/@VedantuEnglish',
        description: 'CBSE Class 11/12 English — literature analysis, grammar, writing skills and board exam strategies.',
      },
      {
        channelName: 'Shiksha House',
        channelHandle: '@ShikshaHouse',
        channelUrl: 'https://www.youtube.com/@ShikshaHouse',
        description: 'Chapter-wise English literature explanations for CBSE, including poem analysis and prose summaries.',
      },
    ],
    // Generic / CS / other
    'computer science': [
      {
        channelName: 'Apna College',
        channelHandle: '@ApnaCollegeOfficial',
        channelUrl: 'https://www.youtube.com/@ApnaCollegeOfficial',
        description: 'Best free DSA and programming course on YouTube in Hindi/English. Full courses on Java, C++, Python and web dev.',
      },
      {
        channelName: 'CodeWithHarry',
        channelHandle: '@CodeWithHarry',
        channelUrl: 'https://www.youtube.com/@CodeWithHarry',
        description: 'Beginner-friendly coding tutorials in Hindi. Complete courses on Python, JavaScript, web dev and more.',
      },
    ],
  };

  // Match subject keyword to catalogue
  if (s.includes('physic')) return CHANNELS.physics;
  if (s.includes('chem')) return CHANNELS.chemistry;
  if (s.includes('math') || s.includes('maths')) return CHANNELS.mathematics;
  if (s.includes('bio')) return CHANNELS.biology;
  if (s.includes('econ')) return CHANNELS.economics;
  if (s.includes('hist')) return CHANNELS.history;
  if (s.includes('english') || s.includes('literature')) return CHANNELS.english;
  if (s.includes('computer') || s.includes('programming') || s.includes('coding')) return CHANNELS['computer science'];

  // Default: PW + Vedantu as the most universal Indian edu channels
  return [
    {
      channelName: 'Physics Wallah – Alakh Pandey',
      channelHandle: '@PhysicsWallah',
      channelUrl: 'https://www.youtube.com/@PhysicsWallah',
      description: 'India largest free education platform. Covers most Class 11/12 and competitive exam subjects with high-quality, relatable lectures.',
    },
    {
      channelName: 'Vedantu',
      channelHandle: '@VedantuClass9and10',
      channelUrl: 'https://www.youtube.com/@Vedantu9and10',
      description: 'Live and recorded sessions covering all CBSE subjects. Strong on concept clarity, live doubt-clearing, and NCERT solutions.',
    },
  ];
}

/**
 * Build a YouTube search URL pre-filled with the topic and channel name.
 * This always works without any API key.
 */
function buildYouTubeSearchUrl(topic, channelName) {
  const query = encodeURIComponent(`${topic} ${channelName}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

// ---------------------------------------------------------------------------
// Free legal book / PDF resources per subject
// ---------------------------------------------------------------------------

/**
 * Returns 2 free, legal book/PDF resources for the given subject + topic.
 */
function getFreeBooksForSubject(subject, topic) {
  const s = subject.toLowerCase();
  const topicQuery = encodeURIComponent(topic || subject);
  const subjectQuery = encodeURIComponent(subject);

  // Always include a generic Archive.org and NPTEL link, then add subject-specific ones
  const archiveUrl = `https://archive.org/search?query=${topicQuery}&mediatype=texts`;
  const nptelUrl = `https://swayam.gov.in/explorer?searchText=${encodeURIComponent(subject)}`;

  const books = {
    physics: [
      {
        type: 'book',
        title: 'HC Verma – Concepts of Physics (Free PDF via Archive.org)',
        description: 'The gold-standard textbook for JEE Physics. Covers mechanics, thermodynamics, optics, and modern physics with solved examples.',
        url: `https://archive.org/search?query=HC+Verma+concepts+of+physics&mediatype=texts`,
      },
      {
        type: 'book',
        title: `NPTEL Physics Lecture Notes – ${topic || 'All Topics'}`,
        description: 'Free lecture notes from IIT professors covering the full physics curriculum. Downloadable PDFs for every chapter.',
        url: `https://swayam.gov.in/explorer?searchText=${encodeURIComponent(topic || subject)}`,
      },
    ],
    chemistry: [
      {
        type: 'book',
        title: 'NCERT Chemistry Class 11 & 12 (Free PDF)',
        description: 'Official NCERT textbooks – the foundation for all board exams and competitive exams like JEE and NEET.',
        url: `https://ncert.nic.in/textbook.php?kech1=0-16`,
      },
      {
        type: 'book',
        title: `OpenStax Chemistry – Free Textbook`,
        description: 'A peer-reviewed, freely available chemistry textbook covering general, organic and biochemistry concepts.',
        url: `https://openstax.org/details/books/chemistry-2e`,
      },
    ],
    mathematics: [
      {
        type: 'book',
        title: 'NCERT Mathematics Class 11 & 12 (Free PDF)',
        description: 'Official NCERT maths textbooks. Essential for board exams and the base for JEE Main.',
        url: `https://ncert.nic.in/textbook.php?kemh1=0-16`,
      },
      {
        type: 'book',
        title: 'OpenStax Calculus (Free Textbook)',
        description: 'Comprehensive free calculus textbook with interactive examples. Covers differentiation, integration, and multivariable calculus.',
        url: `https://openstax.org/details/books/calculus-volume-1`,
      },
    ],
    biology: [
      {
        type: 'book',
        title: 'NCERT Biology Class 11 & 12 (Free PDF)',
        description: 'NEET syllabus is almost entirely NCERT-based. Download official PDFs chapter by chapter.',
        url: `https://ncert.nic.in/textbook.php?kebo1=0-22`,
      },
      {
        type: 'book',
        title: 'OpenStax Biology 2e (Free Textbook)',
        description: 'College-level biology covering cell biology, genetics, evolution, and ecology — freely available online and as PDF.',
        url: `https://openstax.org/details/books/biology-2e`,
      },
    ],
  };

  if (s.includes('physic')) return books.physics;
  if (s.includes('chem')) return books.chemistry;
  if (s.includes('math') || s.includes('maths')) return books.mathematics;
  if (s.includes('bio')) return books.biology;

  // Generic fallback — Archive.org + NPTEL
  return [
    {
      type: 'book',
      title: `Free Study Materials for ${subject} – Archive.org`,
      description: 'Browse thousands of free, legally available textbooks, lecture notes and academic PDFs on Internet Archive.',
      url: archiveUrl,
    },
    {
      type: 'book',
      title: `NPTEL Free Course Notes – ${subject}`,
      description: 'Free lecture notes and video transcripts from IIT and IISc professors. Downloadable PDFs for most subjects.',
      url: nptelUrl,
    },
  ];
}

// ---------------------------------------------------------------------------
// Free article / web resources per subject
// ---------------------------------------------------------------------------

function getFreeArticlesForSubject(subject, topic) {
  const s = subject.toLowerCase();
  const topicQuery = encodeURIComponent(topic || subject);

  return [
    {
      type: 'article',
      title: `Khan Academy – ${topic || subject}`,
      description: 'Free, in-depth articles and exercises on this topic. Works great alongside video lectures for concept reinforcement.',
      url: `https://www.khanacademy.org/search?page_search_query=${topicQuery}`,
    },
    {
      type: 'article',
      title: `Google Scholar – Research Papers on ${topic || subject}`,
      description: 'Access free academic papers, journal articles, and research on this topic from Google Scholar.',
      url: `https://scholar.google.com/scholar?q=${topicQuery}`,
    },
    {
      type: 'article',
      title: `Wikipedia – ${topic || subject} (Quick Reference)`,
      description: 'Quick, reliable overview with key definitions, formulas, and links to deeper resources.',
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${topicQuery}`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Practice / mock test resources
// ---------------------------------------------------------------------------

function getPracticeResourcesForSubject(subject, topic) {
  const s = subject.toLowerCase();
  const topicQuery = encodeURIComponent(topic || subject);

  const resources = [
    {
      type: 'practice',
      title: `PW Test Series – Free Mock Tests for ${subject}`,
      description: 'Free chapter-wise and full-length mock tests on Physics Wallah platform, aligned with JEE/NEET/CBSE patterns.',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic || subject} mock test Physics Wallah`)}`,
    },
  ];

  if (s.includes('physic') || s.includes('chem') || s.includes('bio') || s.includes('math')) {
    resources.push({
      type: 'practice',
      title: 'NCERT Exemplar Problems (Free PDF)',
      description: 'Higher-order thinking problems from NCERT. Essential for Board toppers and JEE/NEET aspirants.',
      url: `https://ncert.nic.in/exemplar-problems.php`,
    });
  }

  return resources;
}

// ---------------------------------------------------------------------------
// Main materials builder — assembles 8–10 results, no AI required
// ---------------------------------------------------------------------------

function buildMaterials(subject, topic, level) {
  const channels = getChannelsForSubject(subject);
  const books = getFreeBooksForSubject(subject, topic);
  const articles = getFreeArticlesForSubject(subject, topic);
  const practice = getPracticeResourcesForSubject(subject, topic);

  const materials = [];

  // 2 YouTube videos (channel search links)
  for (const ch of channels) {
    materials.push({
      type: 'video',
      title: `${ch.channelName} – ${topic || subject}`,
      description: ch.description,
      url: buildYouTubeSearchUrl(topic || subject, ch.channelName),
      channelUrl: ch.channelUrl,
      channelName: ch.channelName,
    });
  }

  // 2 free books / PDFs
  materials.push(...books);

  // 3 free articles
  materials.push(...articles);

  // 1–2 practice resources (fills up to 8–10 total)
  materials.push(...practice);

  // Trim to max 10
  return materials.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

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
// Now returns 8–10 curated, real resources — no AI hallucination.
// YouTube: 2 best channels per subject (hardcoded, search-linked by topic)
// Books:   2 free legal PDFs (NCERT, OpenStax, Archive.org, NPTEL)
// Articles: 3 free resources (Khan Academy, Google Scholar, Wikipedia)
// Practice: 1–2 mock test / exemplar links
router.post('/materials', authMiddleware, async (req, res) => {
  const { subject, level, weakAreas, topic } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required.' });

  try {
    // Use topic > weakAreas > subject as the search keyword
    const searchTopic = topic || weakAreas || subject;
    const materials = buildMaterials(subject, searchTopic, level);

    console.log(`[ai/materials] Generated ${materials.length} resources for subject="${subject}", topic="${searchTopic}"`);
    res.json({ materials });
  } catch (err) {
    console.error('[ai/materials] error:', err.message);
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