// routes/studyMaterials.js — Saved study material recommendations
import express from 'express';
import { StudyMaterial } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/study-materials/:subject
router.get('/:subject', authMiddleware, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const record = await StudyMaterial.findOne({ userId: req.userId, subject });
    res.json({ materials: record?.materials || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch study materials.' });
  }
});

// POST /api/study-materials
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, materials, weakAreas } = req.body;
    if (!subject || !Array.isArray(materials))
      return res.status(400).json({ error: 'Subject and materials array are required.' });

    const record = await StudyMaterial.findOneAndUpdate(
      { userId: req.userId, subject },
      {
        userId:    req.userId,
        subject,
        weakAreas: weakAreas || '',
        materials,
        savedAt:   new Date().toISOString(),
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Study materials saved!', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save study materials.' });
  }
});

export default router;
