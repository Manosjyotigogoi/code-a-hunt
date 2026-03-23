// routes/studyMaterials.js — Saved study material recommendations

import express from 'express';
import { readDB, writeDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ─── GET /api/study-materials/:subject ────────────────────
router.get('/:subject', authMiddleware, (req, res) => {
  try {
    const all = readDB('study_materials');
    const record = all.find(r => r.userId === req.user.id && r.subject === decodeURIComponent(req.params.subject));
    res.json({ materials: record?.materials || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch study materials.' });
  }
});

// ─── POST /api/study-materials ────────────────────────────
router.post('/', authMiddleware, (req, res) => {
  try {
    const { subject, materials, weakAreas } = req.body;

    if (!subject || !Array.isArray(materials)) {
      return res.status(400).json({ error: 'Subject and materials array are required.' });
    }

    const all = readDB('study_materials');
    const index = all.findIndex(r => r.userId === req.user.id && r.subject === subject);

    const record = {
      userId: req.user.id,
      subject,
      weakAreas: weakAreas || '',
      materials,
      savedAt: new Date().toISOString(),
    };

    if (index === -1) {
      all.push(record);
    } else {
      all[index] = record;
    }
    writeDB('study_materials', all);

    res.json({ message: 'Study materials saved!', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save study materials.' });
  }
});

export default router;
