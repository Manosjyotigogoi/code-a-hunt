import express from 'express';
import { Session } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/session/heartbeat
router.post('/heartbeat', authMiddleware, async (req, res) => {
  try {
    const { activeSeconds = 60, isBreak = false } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const existing = await Session.findOne({ userId: req.userId, date: today });

    if (!existing) {
      await Session.create({
        userId:             req.userId,
        date:               today,
        totalOnlineMinutes: 1,
        activeMinutes:      Math.round(activeSeconds / 60),
        breaks:             isBreak ? 1 : 0,
        focusLevel:         10,
        updatedAt:          new Date().toISOString(),
      });
    } else {
      existing.totalOnlineMinutes = (existing.totalOnlineMinutes || 0) + 1;
      existing.activeMinutes      = (existing.activeMinutes || 0) + Math.round(activeSeconds / 60);
      if (isBreak) existing.breaks = (existing.breaks || 0) + 1;
      existing.focusLevel = existing.totalOnlineMinutes > 0
        ? Math.max(1, Math.round((existing.activeMinutes / existing.totalOnlineMinutes) * 10))
        : 5;
      existing.updatedAt = new Date().toISOString();
      await existing.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Failed to record session.' });
  }
});

// GET /api/session/today
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Session.findOne({ userId: req.userId, date: today });
    res.json({
      session: record || {
        date:               today,
        totalOnlineMinutes: 0,
        activeMinutes:      0,
        breaks:             0,
        focusLevel:         5,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session.' });
  }
});

// GET /api/session/recent
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const records = await Session.find({
      userId: req.userId,
      date:   { $gte: cutoffStr },
    }).sort({ date: -1 });

    res.json({ sessions: records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent sessions.' });
  }
});

export default router;
