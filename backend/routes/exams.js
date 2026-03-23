import express from 'express';
import { findAll, upsertOne } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/exams — get all exams for user
router.get('/', authMiddleware, (req, res) => {
  const record = findAll('exams', r => r.userId === req.userId)[0] || null;
  res.json({ exams: record?.exams || [] });
});

// POST /api/exams — save/replace all exams for user
router.post('/', authMiddleware, (req, res) => {
  const { exams } = req.body;
  if (!Array.isArray(exams))
    return res.status(400).json({ error: 'exams must be an array.' });

  const doc = {
    userId: req.userId,
    exams,
    updatedAt: new Date().toISOString(),
  };
  upsertOne('exams', r => r.userId === req.userId, doc);
  res.json({ success: true, exams });
});

export default router;
