import express from 'express';
import { Timetable } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/timetable
router.get('/', authMiddleware, async (req, res) => {
  try {
    const record = await Timetable.findOne({ userId: req.userId });
    res.json({ timetable: record || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetable.' });
  }
});

// POST /api/timetable
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { schedule, hoursPerDay } = req.body;
    if (!Array.isArray(schedule))
      return res.status(400).json({ error: 'schedule must be an array.' });

    const doc = await Timetable.findOneAndUpdate(
      { userId: req.userId },
      {
        userId: req.userId,
        schedule,
        hoursPerDay: hoursPerDay || 3,
        updatedAt: new Date().toISOString(),
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, timetable: doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save timetable.' });
  }
});

export default router;
