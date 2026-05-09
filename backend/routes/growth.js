import express from 'express';
import { Growth } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/growth
router.get('/', authMiddleware, async (req, res) => {
  try {
    const records = await Growth.find({ userId: req.userId });
    res.json({ growth: records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch growth data.' });
  }
});

// GET /api/growth/:subject
router.get('/:subject', authMiddleware, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const record = await Growth.findOne({ userId: req.userId, subject });
    res.json({ growth: record || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch growth data.' });
  }
});

// POST /api/growth
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, scores, analysis } = req.body;
    if (!subject) return res.status(400).json({ error: 'subject is required.' });

    const doc = await Growth.findOneAndUpdate(
      { userId: req.userId, subject },
      {
        userId: req.userId,
        subject,
        scores: scores || [],
        analysis: analysis || null,
        updatedAt: new Date().toISOString(),
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, growth: doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save growth data.' });
  }
});

export default router;
