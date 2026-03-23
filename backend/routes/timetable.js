import express from 'express';
import { findAll, upsertOne } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/timetable — get saved timetable
router.get('/', authMiddleware, (req, res) => {
  const record = findAll('timetable', r => r.userId === req.userId)[0] || null;
  res.json({ timetable: record || null });
});

// POST /api/timetable — save timetable
router.post('/', authMiddleware, (req, res) => {
  const { schedule, hoursPerDay } = req.body;
  if (!Array.isArray(schedule)) return res.status(400).json({ error: 'schedule must be an array.' });

  const doc = {
    userId: req.userId,
    schedule,
    hoursPerDay: hoursPerDay || 3,
    updatedAt: new Date().toISOString(),
  };
  upsertOne('timetable', r => r.userId === req.userId, doc);
  res.json({ success: true, timetable: doc });
});

export default router;
