import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { QuizAttempt } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quiz/:subject
router.get('/:subject', authMiddleware, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const records = await QuizAttempt.find({ userId: req.userId, subject }).sort({ createdAt: -1 });
    res.json({ attempts: records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz attempts.' });
  }
});

// GET /api/quiz
router.get('/', authMiddleware, async (req, res) => {
  try {
    const records = await QuizAttempt.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ attempts: records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz attempts.' });
  }
});

// POST /api/quiz/save
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { subject, correct, total, questions, timeTakenSeconds } = req.body;
    if (!subject || total == null)
      return res.status(400).json({ error: 'subject and total are required.' });

    const accuracy   = total > 0 ? correct / total : 0;
    const score      = Math.round(accuracy * 100);
    const difficulty = Math.max(1, Math.min(5, 5 - accuracy * 4));

    const now = new Date().toISOString();

    // Get last attempt for previousScore
    const lastAttempt = await QuizAttempt.findOne(
      { userId: req.userId, subject },
      {},
      { sort: { createdAt: -1 } }
    );
    const previousScore = lastAttempt ? lastAttempt.score : score;

    const attempt = new QuizAttempt({
      id:               uuidv4(),   // Bug 5 fix: use uuid instead of string with subject
      userId:           req.userId,
      subject,
      correct:          correct || 0,
      total,
      score,
      accuracy:         Math.round(accuracy * 100) / 100,
      difficulty:       Math.round(difficulty * 100) / 100,
      previousScore,
      timeTakenSeconds: timeTakenSeconds || 0,
      questions:        questions || [],
      createdAt:        now,
      date:             now.split('T')[0],
      time:             now.split('T')[1].slice(0, 5),
    });
    await attempt.save();

    res.json({ success: true, attempt });
  } catch (err) {
    console.error('Quiz save error:', err);
    res.status(500).json({ error: 'Failed to save quiz attempt.' });
  }
});

// GET /api/quiz/summary/all
router.get('/summary/all', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.userId });

    const bySubject = {};
    for (const a of attempts) {
      if (!bySubject[a.subject] || new Date(a.createdAt) > new Date(bySubject[a.subject].createdAt)) {
        bySubject[a.subject] = a;
      }
    }

    const summary = Object.values(bySubject).map(a => ({
      name:              a.subject,
      correct_questions: a.correct,
      total_questions:   a.total,
      latest_score:      a.score,
      difficulty:        a.difficulty,
      previous_score:    a.previousScore,
    }));

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz summary.' });
  }
});

export default router;
