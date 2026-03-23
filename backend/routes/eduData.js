// routes/eduData.js — Education profile / onboarding data

import express from 'express';
import { findOne, upsertOne, updateOne } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ─── GET /api/edu-data ─────────────────────────────────────
// Fetch the logged-in user's education data
router.get('/', authMiddleware, (req, res) => {
  try {
    const data = findOne('edu_data', 'userId', req.user.id);
    if (!data) {
      return res.json({ eduData: null });
    }
    res.json({ eduData: data });
  } catch (err) {
    console.error('Get eduData error:', err);
    res.status(500).json({ error: 'Failed to fetch education data.' });
  }
});

// ─── POST /api/edu-data ────────────────────────────────────
// Save / update education data (onboarding)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { institution, educationLevel, course, semester, specialization, subjects } = req.body;

    if (!institution || !educationLevel || !subjects || subjects.length === 0) {
      return res.status(400).json({ error: 'Institution, education level, and at least one subject are required.' });
    }

    const record = {
      userId: req.user.id,
      institution: institution.trim(),
      educationLevel,
      course: course?.trim() || '',
      semester: semester?.trim() || '',
      specialization: specialization?.trim() || '',
      subjects,
      updatedAt: new Date().toISOString(),
    };

    upsertOne('edu_data', 'userId', req.user.id, record);

    // Mark onboarding as complete in users file
    updateOne('users', 'id', req.user.id, { hasCompletedOnboarding: true });

    res.json({ message: 'Education data saved!', eduData: record });
  } catch (err) {
    console.error('Save eduData error:', err);
    res.status(500).json({ error: 'Failed to save education data.' });
  }
});

export default router;
