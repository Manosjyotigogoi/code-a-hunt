import express from 'express';
import { execFile } from 'child_process';
import { findAll } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREDICT_SCRIPT = path.join(__dirname, '..', 'ai_service', 'predict.py');

function runPythonCommand(command, baseArgs, inputData) {
  return new Promise((resolve, reject) => {
    const proc = execFile(command, [...baseArgs, PREDICT_SCRIPT], {
      timeout: 20000,
      maxBuffer: 2 * 1024 * 1024,
    }, (err, stdout, stderr) => {
      if (err) {
        const details = (stderr || err.message || '').trim();
        return reject(new Error(`[${command} ${baseArgs.join(' ')}] ${details}`.trim()));
      }
      try {
        const lines = stdout.trim().split('\n');
        // grab last line that looks like JSON (suppress any extra prints)
        const jsonLine = lines.slice().reverse().find(l => l.trim().startsWith('{'));
        if (!jsonLine) throw new Error(`No JSON in output: ${stdout.slice(0, 200)}`);
        resolve(JSON.parse(jsonLine));
      } catch (e) {
        reject(new Error(`Parse error: ${e.message} | stdout: ${stdout.slice(0, 200)}`));
      }
    });
    proc.stdin.write(JSON.stringify(inputData));
    proc.stdin.end();
  });
}

async function runPythonPredict(inputData) {
  const configured = process.env.PYTHON_BIN?.trim();
  const candidates = configured
    ? [[configured, []]]
    : [
      ['python3', []],
      ['python', []],
      ['py', ['-3']],
      ['py', []],
    ];

  const failures = [];
  for (const [command, baseArgs] of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await runPythonCommand(command, baseArgs, inputData);
    } catch (err) {
      failures.push(err.message);
    }
  }

  throw new Error(
    `Python runtime not available. Tried: ${candidates.map(([c, a]) => `${c} ${a.join(' ')}`.trim()).join(', ')}. `
    + `Install Python 3 and ensure PATH works, or set PYTHON_BIN in backend/.env. `
    + `Details: ${failures.join(' | ')}`
  );
}

// POST /api/ai-predict
// Collects all user metrics automatically, runs ML model, returns prediction + timetable
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const body = req.body;

    // ── 1. study_hours from timetable setting or body ──────────────────
    const timetableRecord = findAll('timetable', r => r.userId === userId)[0];
    const studyHours = body.study_hours ?? timetableRecord?.hoursPerDay ?? 3;

    // ── 2. focus_level + breaks from today's session ───────────────────
    const today = new Date().toISOString().split('T')[0];
    const sessionRecord = findAll('sessions', r => r.userId === userId && r.date === today)[0];
    const focusLevel = body.focus_level ?? sessionRecord?.focusLevel ?? 5;
    const breaks     = body.breaks     ?? sessionRecord?.breaks     ?? 1;

    // ── 3. quiz data — latest attempt per subject ──────────────────────
    const quizAttempts = findAll('quiz_attempts', r => r.userId === userId);
    const bySubject = {};
    for (const a of quizAttempts) {
      if (!bySubject[a.subject] || new Date(a.createdAt) > new Date(bySubject[a.subject].createdAt)) {
        bySubject[a.subject] = a;
      }
    }
    const subjectList = Object.values(bySubject);

    // ── 4. difficulty_level + previous_score — average across subjects ──
    let difficultyLevel = body.difficulty_level ?? 3;
    let previousScore   = body.previous_score   ?? 50;
    if (subjectList.length > 0) {
      difficultyLevel = body.difficulty_level ??
        Math.round((subjectList.reduce((s, a) => s + a.difficulty, 0) / subjectList.length) * 100) / 100;
      previousScore = body.previous_score ??
        Math.round(subjectList.reduce((s, a) => s + a.previousScore, 0) / subjectList.length);
    }

    // ── 5. Build subjects array ────────────────────────────────────────
    const eduRecord   = findAll('edu_data', r => r.userId === userId)[0];
    const eduSubjects = eduRecord?.subjects || [];

    let subjects;
    if (body.subjects) {
      subjects = body.subjects;
    } else if (subjectList.length > 0) {
      // Use quiz data — subjects that have been tested
      subjects = subjectList.map(a => ({
        name: a.subject,
        correct_questions: a.correct,
        total_questions:   a.total,
      }));
      // Add edu subjects not yet quizzed (equal 5/10 accuracy placeholder)
      for (const name of eduSubjects) {
        if (!bySubject[name]) subjects.push({ name, correct_questions: 5, total_questions: 10 });
      }
    } else {
      // No quiz data yet — all edu subjects with equal 50% accuracy placeholder
      subjects = eduSubjects.map(name => ({ name, correct_questions: 5, total_questions: 10 }));
    }

    const inputData = { study_hours: studyHours, focus_level: focusLevel, breaks, difficulty_level: difficultyLevel, previous_score: previousScore, subjects };

    const prediction = await runPythonPredict(inputData);

    // ── 6. Enrich timetable with metadata ──────────────────────────────
    const enrichedTimetable = Object.entries(prediction.timetable || {}).map(([subject, hours]) => {
      const q = bySubject[subject];
      const accuracy = q ? Math.round(q.accuracy * 100) : 50;
      return {
        subject,
        allocatedHours: hours,
        priority: hours >= studyHours * 0.35 ? 'high' : hours >= studyHours * 0.18 ? 'medium' : 'low',
        accuracy,
        lastQuizScore: q?.score    ?? null,
        lastQuizDate:  q?.date     ?? null,
      };
    }).sort((a, b) => b.allocatedHours - a.allocatedHours);

    res.json({
      success: true,
      inputs: inputData,
      recommended_hours:     prediction.recommended_hours,
      predicted_performance: prediction.predicted_performance,
      timetable:             enrichedTimetable,
      generatedAt:           new Date().toISOString(),
    });

  } catch (err) {
    console.error('AI Predict error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
