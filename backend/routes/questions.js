// routes/questions.js — Generated practice questions
import express from 'express';
import { Question } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/questions/:subject
router.get('/:subject', authMiddleware, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const record = await Question.findOne({ userId: req.userId, subject });
    res.json({ questions: record?.questions || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

// POST /api/questions
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, questions, topic } = req.body;
    if (!subject || !Array.isArray(questions))
      return res.status(400).json({ error: 'Subject and questions array are required.' });

    const record = await Question.findOneAndUpdate(
      { userId: req.userId, subject },
      {
        userId:    req.userId,
        subject,
        topic:     topic || '',
        questions,
        savedAt:   new Date().toISOString(),
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Questions saved!', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save questions.' });
  }
});

export default router;
