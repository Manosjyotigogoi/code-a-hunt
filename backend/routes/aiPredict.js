import express from 'express';
import { Timetable, Session, QuizAttempt, EduData } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── Pure JS replacement for model_predictor.py ──────────────────────────────
function predictStudent(studyHours, focusLevel, breaks, difficultyLevel, previousScore) {
  // Replicate the ML model's regression logic with a weighted formula
  // Based on typical study performance patterns

  // Focus and breaks impact efficiency
  const efficiency = (focusLevel / 10) * (1 + breaks * 0.05);

  // Difficulty reduces performance, previous score is a strong predictor
  const difficultyPenalty = (difficultyLevel - 1) * 4;

  // Predicted performance score
  let predictedPerformance = (
    previousScore * 0.5 +
    focusLevel * 3 +
    studyHours * 2.5 +
    breaks * 1.5 -
    difficultyPenalty
  );

  // Clamp between 0 and 100
  predictedPerformance = Math.min(100, Math.max(0, predictedPerformance));

  // Recommended hours: if performing well study less, if struggling study more
  let recommendedHours = studyHours;
  if (predictedPerformance < 40) recommendedHours = studyHours * 1.4;
  else if (predictedPerformance < 60) recommendedHours = studyHours * 1.2;
  else if (predictedPerformance > 80) recommendedHours = studyHours * 0.9;

  // Adjust for difficulty
  recommendedHours += (difficultyLevel - 3) * 0.3;
  recommendedHours = Math.max(1, Math.min(12, recommendedHours));

  return {
    recommended_hours: Math.round(recommendedHours * 100) / 100,
    predicted_performance: Math.round(predictedPerformance * 100) / 100,
  };
}

// ── Pure JS replacement for timetable_generator.py ──────────────────────────
function generateTimetable(subjects, totalHours) {
  const timetable = {};

  if (!subjects || subjects.length === 0) return timetable;

  const priorities = subjects.map(s => {
    const correct = s.correct_questions ?? 0;
    const total = s.total_questions ?? 1;
    const accuracy = (correct / total) * 100;
    return { name: s.name, priority: 100 - accuracy };
  });

  const totalPriority = priorities.reduce((sum, s) => sum + s.priority, 0) || priorities.length;

  for (const s of priorities) {
    timetable[s.name] = Math.round((s.priority / totalPriority) * totalHours * 100) / 100;
  }

  return timetable;
}

// POST /api/ai-predict
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const body = req.body;

    // ── 1. study_hours from timetable ──────────────────────────────────
    const timetableRecord = await Timetable.findOne({ userId });
    const studyHours = body.study_hours ?? timetableRecord?.hoursPerDay ?? 3;

    // ── 2. focus_level + breaks from today's session ────────────────────
    const today = new Date().toISOString().split('T')[0];
    const sessionRecord = await Session.findOne({ userId, date: today });
    const focusLevel = body.focus_level ?? sessionRecord?.focusLevel ?? 5;
    const breaks = body.breaks ?? sessionRecord?.breaks ?? 1;

    // ── 3. quiz data — latest attempt per subject ──────────────────────
    const quizAttempts = await QuizAttempt.find({ userId });
    const bySubject = {};
    for (const a of quizAttempts) {
      if (!bySubject[a.subject] || new Date(a.createdAt) > new Date(bySubject[a.subject].createdAt)) {
        bySubject[a.subject] = a;
      }
    }
    const subjectList = Object.values(bySubject);

    // ── 4. difficulty_level + previous_score ────────────────────────────
    let difficultyLevel = body.difficulty_level ?? 3;
    let previousScore = body.previous_score ?? 50;
    if (subjectList.length > 0) {
      difficultyLevel = body.difficulty_level ??
        Math.round((subjectList.reduce((s, a) => s + a.difficulty, 0) / subjectList.length) * 100) / 100;
      previousScore = body.previous_score ??
        Math.round(subjectList.reduce((s, a) => s + a.previousScore, 0) / subjectList.length);
    }

    // ── 5. Build subjects array ─────────────────────────────────────────
    const eduRecord = await EduData.findOne({ userId });
    const eduSubjects = eduRecord?.subjects || [];

    let subjects;
    if (body.subjects) {
      subjects = body.subjects;
    } else if (subjectList.length > 0) {
      subjects = subjectList.map(a => ({
        name: a.subject,
        correct_questions: a.correct,
        total_questions: a.total,
      }));
      for (const name of eduSubjects) {
        if (!bySubject[name]) subjects.push({ name, correct_questions: 5, total_questions: 10 });
      }
    } else {
      subjects = eduSubjects.map(name => ({ name, correct_questions: 5, total_questions: 10 }));
    }

    const inputData = { study_hours: studyHours, focus_level: focusLevel, breaks, difficulty_level: difficultyLevel, previous_score: previousScore, subjects };

    // ── 6. Run JS prediction (no Python needed!) ────────────────────────
    const prediction = predictStudent(studyHours, focusLevel, breaks, difficultyLevel, previousScore);
    const timetable = generateTimetable(subjects, studyHours);

    // ── 7. Enrich timetable ─────────────────────────────────────────────
    const enrichedTimetable = Object.entries(timetable).map(([subject, hours]) => {
      const q = bySubject[subject];
      const accuracy = q ? Math.round(q.accuracy * 100) : 50;
      return {
        subject,
        allocatedHours: hours,
        priority: hours >= studyHours * 0.35 ? 'high' : hours >= studyHours * 0.18 ? 'medium' : 'low',
        accuracy,
        lastQuizScore: q?.score ?? null,
        lastQuizDate: q?.date ?? null,
      };
    }).sort((a, b) => b.allocatedHours - a.allocatedHours);

    res.json({
      success: true,
      inputs: inputData,
      recommended_hours: prediction.recommended_hours,
      predicted_performance: prediction.predicted_performance,
      timetable: enrichedTimetable,
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('AI Predict error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;