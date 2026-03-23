import express from 'express';
import { findAll, upsertOne } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/subjects/:subject — get all saved data for a subject
router.get('/:subject', authMiddleware, (req, res) => {
  const subject = decodeURIComponent(req.params.subject);
  const record = findAll('subject_data', r => r.userId === req.userId && r.subject === subject)[0] || null;
  res.json({ subjectData: record || { subject, notes: '', youtubeLink: '', summary: '', questions: [] } });
});

// POST /api/subjects/:subject — save subject data (notes, summary, questions)
router.post('/:subject', authMiddleware, (req, res) => {
  const subject = decodeURIComponent(req.params.subject);
  const { notes, youtubeLink, summary, questions } = req.body;

  const existing = findAll('subject_data', r => r.userId === req.userId && r.subject === subject)[0] || {};

  const doc = {
    userId: req.userId,
    subject,
    notes: notes !== undefined ? notes : existing.notes || '',
    youtubeLink: youtubeLink !== undefined ? youtubeLink : existing.youtubeLink || '',
    summary: summary !== undefined ? summary : existing.summary || '',
    questions: questions !== undefined ? questions : existing.questions || [],
    updatedAt: new Date().toISOString(),
  };
  upsertOne('subject_data', r => r.userId === req.userId && r.subject === subject, doc);
  res.json({ success: true, subjectData: doc });
});

export default router;
