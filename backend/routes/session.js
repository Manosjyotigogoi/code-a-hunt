import express from 'express';
import { findAll, upsertOne, readDB, writeDB } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * Session tracking model:
 *
 * A "session" = one continuous visit (login → logout / tab close).
 * The frontend sends heartbeats every 60s while the user is active.
 * When the tab goes hidden / user is idle >5min, a "break" is recorded.
 *
 * Stored fields per day:
 *   userId, date, totalOnlineMinutes, activeMinutes, breaks, focusLevel
 *
 * focusLevel = (activeMinutes / totalOnlineMinutes) * 10  →  0–10 scale
 */

// POST /api/session/heartbeat  — called every 60s by frontend
// Body: { activeSeconds: 60 }  (60 if user was active, 0 if tab was hidden)
router.post('/heartbeat', authMiddleware, (req, res) => {
  const { activeSeconds = 60, isBreak = false } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const all = readDB('sessions');
  const idx = all.findIndex(r => r.userId === req.userId && r.date === today);

  if (idx === -1) {
    all.push({
      userId: req.userId,
      date: today,
      totalOnlineMinutes: 1,
      activeMinutes: Math.round(activeSeconds / 60),
      breaks: isBreak ? 1 : 0,
      focusLevel: 10,
      updatedAt: new Date().toISOString(),
    });
  } else {
    const s = all[idx];
    s.totalOnlineMinutes = (s.totalOnlineMinutes || 0) + 1;
    s.activeMinutes = (s.activeMinutes || 0) + Math.round(activeSeconds / 60);
    if (isBreak) s.breaks = (s.breaks || 0) + 1;
    // focusLevel: active / total * 10, min 1
    s.focusLevel = s.totalOnlineMinutes > 0
      ? Math.max(1, Math.round((s.activeMinutes / s.totalOnlineMinutes) * 10))
      : 5;
    s.updatedAt = new Date().toISOString();
    all[idx] = s;
  }

  writeDB('sessions', all);
  res.json({ success: true });
});

// GET /api/session/today — today's session stats
router.get('/today', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const record = findAll('sessions', r => r.userId === req.userId && r.date === today)[0];
  res.json({
    session: record || {
      date: today,
      totalOnlineMinutes: 0,
      activeMinutes: 0,
      breaks: 0,
      focusLevel: 5,
    }
  });
});

// GET /api/session/recent — last 7 days aggregated
router.get('/recent', authMiddleware, (req, res) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const records = findAll('sessions', r =>
    r.userId === req.userId && new Date(r.date) >= cutoff
  ).sort((a, b) => b.date.localeCompare(a.date));
  res.json({ sessions: records });
});

export default router;
