import express from 'express';
import { findAll, upsertOne } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/growth — get all growth data for user
router.get('/', authMiddleware, (req, res) => {
  const records = findAll('growth', r => r.userId === req.userId);
  res.json({ growth: records });
});

// GET /api/growth/:subject — get growth data for specific subject
router.get('/:subject', authMiddleware, (req, res) => {
  const subject = decodeURIComponent(req.params.subject);
  const record = findAll('growth', r => r.userId === req.userId && r.subject === subject)[0] || null;
  res.json({ growth: record || null });
});

// POST /api/growth — save growth/scores for a subject
router.post('/', authMiddleware, (req, res) => {
  const { subject, scores, analysis } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required.' });

  const doc = {
    userId: req.userId,
    subject,
    scores: scores || [],
    analysis: analysis || null,
    updatedAt: new Date().toISOString(),
  };
  upsertOne('growth', r => r.userId === req.userId && r.subject === subject, doc);
  res.json({ success: true, growth: doc });
});

export default router;
