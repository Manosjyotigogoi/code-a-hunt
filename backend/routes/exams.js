import express from 'express';
import { Exam } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/exams
router.get('/', authMiddleware, async (req, res) => {
  try {
    const record = await Exam.findOne({ userId: req.userId });
    res.json({ exams: record?.exams || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exams.' });
  }
});

// POST /api/exams
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { exams } = req.body;
    if (!Array.isArray(exams))
      return res.status(400).json({ error: 'exams must be an array.' });

    const doc = await Exam.findOneAndUpdate(
      { userId: req.userId },
      { userId: req.userId, exams, updatedAt: new Date().toISOString() },
      { upsert: true, new: true }
    );
    res.json({ success: true, exams: doc.exams });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save exams.' });
  }
});

export default router;
