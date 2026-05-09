import express from 'express';
import { User, EduData } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/profile/edu
router.get('/edu', authMiddleware, async (req, res) => {
  try {
    const data = await EduData.findOne({ userId: req.userId });
    res.json({ eduData: data || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch education data.' });
  }
});

// POST /api/profile/edu
router.post('/edu', authMiddleware, async (req, res) => {
  try {
    const { institution, educationLevel, course, semester, specialization, subjects } = req.body;
    if (!institution || !educationLevel || !subjects?.length)
      return res.status(400).json({ error: 'Institution, level and subjects are required.' });

    const doc = {
      userId: req.userId,
      institution,
      educationLevel,
      course: course || '',
      semester: semester || '',
      specialization: specialization || '',
      subjects,
      updatedAt: new Date().toISOString(),
    };

    const eduData = await EduData.findOneAndUpdate(
      { userId: req.userId },
      doc,
      { upsert: true, new: true }
    );

    // Mark user as having completed data collection
    await User.findOneAndUpdate({ id: req.userId }, { hasCompletedDataCollection: true });

    res.json({ success: true, eduData });
  } catch (err) {
    console.error('Save profile/edu error:', err);
    res.status(500).json({ error: 'Failed to save education data.' });
  }
});

// GET /api/profile/user
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasCompletedDataCollection: user.hasCompletedDataCollection,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

export default router;
