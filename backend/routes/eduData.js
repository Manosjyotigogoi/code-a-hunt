// routes/eduData.js — Education profile / onboarding data
import express from 'express';
import { EduData, User } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/edu-data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await EduData.findOne({ userId: req.userId });
    res.json({ eduData: data || null });
  } catch (err) {
    console.error('Get eduData error:', err);
    res.status(500).json({ error: 'Failed to fetch education data.' });
  }
});

// POST /api/edu-data
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { institution, educationLevel, course, semester, specialization, subjects } = req.body;

    if (!institution || !educationLevel || !subjects || subjects.length === 0) {
      return res.status(400).json({ error: 'Institution, education level, and at least one subject are required.' });
    }

    const record = {
      userId: req.userId,
      institution: institution.trim(),
      educationLevel,
      course: course?.trim() || '',
      semester: semester?.trim() || '',
      specialization: specialization?.trim() || '',
      subjects,
      updatedAt: new Date().toISOString(),
    };

    const eduData = await EduData.findOneAndUpdate(
      { userId: req.userId },
      record,
      { upsert: true, new: true }
    );

    // Mark onboarding as complete
    await User.findOneAndUpdate({ id: req.userId }, { hasCompletedDataCollection: true });

    res.json({ message: 'Education data saved!', eduData });
  } catch (err) {
    console.error('Save eduData error:', err);
    res.status(500).json({ error: 'Failed to save education data.' });
  }
});

export default router;
