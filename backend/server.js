import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from './middleware/db.js';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import examsRoutes from './routes/exams.js';
import growthRoutes from './routes/growth.js';
import timetableRoutes from './routes/timetable.js';
import subjectsRoutes from './routes/subjects.js';
import aiRoutes from './routes/ai.js';
import contactRoutes from './routes/contact.js';
import quizRoutes from './routes/quiz.js';
import sessionRoutes from './routes/session.js';
import aiPredictRoutes from './routes/aiPredict.js';
import eduDataRoutes from './routes/eduData.js';
import questionsRoutes from './routes/questions.js';
import studyMaterialsRoutes from './routes/studyMaterials.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/ai-predict', aiPredictRoutes);
app.use('/api/edu-data', eduDataRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/study-materials', studyMaterialsRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, _, res, __) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 STAI Backend running on http://localhost:${PORT}`);
      console.log(`🌿 MongoDB connected successfully`);
      console.log(`🔑 AI Key: ${process.env.HF_API_KEY ? '✅ Set' : '❌ Missing — add to .env'}`);
      console.log(`📧 Mail:   ${process.env.MAIL_USER ? '✅ Set' : '❌ Missing — add to .env'}\n`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
