import express from 'express';
import { SubjectData } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/subjects/:subject
router.get('/:subject', authMiddleware, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const record = await SubjectData.findOne({ userId: req.userId, subject });
    res.json({
      subjectData: record || { subject, notes: '', youtubeLink: '', summary: '', questions: [] },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subject data.' });
  }
});

// POST /api/subjects/:subject
router.post('/:subject', authMiddleware, async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const { notes, youtubeLink, summary, questions } = req.body;

    const existing = await SubjectData.findOne({ userId: req.userId, subject });

    const doc = await SubjectData.findOneAndUpdate(
      { userId: req.userId, subject },
      {
        userId: req.userId,
        subject,
        notes:       notes       !== undefined ? notes       : existing?.notes       || '',
        youtubeLink: youtubeLink !== undefined ? youtubeLink : existing?.youtubeLink || '',
        summary:     summary     !== undefined ? summary     : existing?.summary     || '',
        questions:   questions   !== undefined ? questions   : existing?.questions   || [],
        updatedAt: new Date().toISOString(),
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, subjectData: doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save subject data.' });
  }
});

export default router;
