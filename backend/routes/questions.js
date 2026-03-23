// routes/questions.js — Generated practice questions

import express from 'express';
import { readDB, writeDB, findMany } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ─── GET /api/questions/:subject ──────────────────────────
router.get('/:subject', authMiddleware, (req, res) => {
  try {
    const all = readDB('questions');
    const record = all.find(r => r.userId === req.user.id && r.subject === decodeURIComponent(req.params.subject));
    res.json({ questions: record?.questions || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

// ─── POST /api/questions ──────────────────────────────────
// Save generated questions for a subject
router.post('/', authMiddleware, (req, res) => {
  try {
    const { subject, questions, topic } = req.body;

    if (!subject || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Subject and questions array are required.' });
    }

    const all = readDB('questions');
    const index = all.findIndex(r => r.userId === req.user.id && r.subject === subject);

    const record = {
      userId: req.user.id,
      subject,
      topic: topic || '',
      questions,
      savedAt: new Date().toISOString(),
    };

    if (index === -1) {
      all.push(record);
    } else {
      all[index] = record;
    }
    writeDB('questions', all);

    res.json({ message: 'Questions saved!', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save questions.' });
  }
});

export default router;
