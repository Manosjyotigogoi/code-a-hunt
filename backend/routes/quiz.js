import express from 'express';
import { findAll, upsertOne, readDB, writeDB } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quiz/:subject — get quiz history for a subject
router.get('/:subject', authMiddleware, (req, res) => {
  const subject = decodeURIComponent(req.params.subject);
  const records = findAll('quiz_attempts', r => r.userId === req.userId && r.subject === subject);
  // Sort newest first
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ attempts: records });
});

// GET /api/quiz — all quiz attempts for user (all subjects)
router.get('/', authMiddleware, (req, res) => {
  const records = findAll('quiz_attempts', r => r.userId === req.userId);
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ attempts: records });
});

// POST /api/quiz/save — save a completed quiz attempt
// Body: { subject, correct, total, questions: [...], timeTakenSeconds }
router.post('/save', authMiddleware, (req, res) => {
  const { subject, correct, total, questions, timeTakenSeconds } = req.body;
  if (!subject || total == null) return res.status(400).json({ error: 'subject and total are required.' });

  const accuracy = total > 0 ? correct / total : 0;
  const score = Math.round(accuracy * 100);
  // difficulty = 5 - (accuracy * 4), clamped 1–5
  const difficulty = Math.max(1, Math.min(5, 5 - accuracy * 4));

  const now = new Date().toISOString();

  // Get previous attempts for this subject to set previous_score
  const existing = findAll('quiz_attempts', r => r.userId === req.userId && r.subject === subject);
  existing.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  // previous_score = last attempt's score; if first attempt, it's this score itself
  const previousScore = existing.length > 0 ? existing[0].score : score;

  const attempt = {
    id: `${req.userId}_${subject}_${Date.now()}`,
    userId: req.userId,
    subject,
    correct: correct || 0,
    total,
    score,
    accuracy: Math.round(accuracy * 100) / 100,
    difficulty: Math.round(difficulty * 100) / 100,
    previousScore,
    timeTakenSeconds: timeTakenSeconds || 0,
    questions: questions || [],
    createdAt: now,
    date: now.split('T')[0],
    time: now.split('T')[1].slice(0, 5),
  };

  // Push new attempt (we keep full history, not upsert)
  const all = readDB('quiz_attempts');
  all.push(attempt);
  writeDB('quiz_attempts', all);

  res.json({ success: true, attempt });
});

// GET /api/quiz/summary/all — aggregated per-subject summary for AI model input
// Returns: [{ subject, correct_questions, total_questions, latest_score, difficulty, previous_score }]
router.get('/summary/all', authMiddleware, (req, res) => {
  const attempts = findAll('quiz_attempts', r => r.userId === req.userId);

  // Group by subject — use the LATEST attempt per subject
  const bySubject = {};
  for (const a of attempts) {
    if (!bySubject[a.subject] || new Date(a.createdAt) > new Date(bySubject[a.subject].createdAt)) {
      bySubject[a.subject] = a;
    }
  }

  const summary = Object.values(bySubject).map(a => ({
    name: a.subject,
    correct_questions: a.correct,
    total_questions: a.total,
    latest_score: a.score,
    difficulty: a.difficulty,
    previous_score: a.previousScore,
  }));

  res.json({ summary });
});

export default router;
