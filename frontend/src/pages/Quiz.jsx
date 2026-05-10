import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashHeader from '../components/DashHeader';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Timer, CheckCircle2, XCircle, Trophy, ChevronRight, RotateCcw, Brain, Loader2 } from 'lucide-react';

const pad = n => String(n).padStart(2, '0');
function fmtTime(secs) { return `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`; }
function now() { return new Date(); }
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const PHASE = { SETUP: 'setup', LOADING: 'loading', QUIZ: 'quiz', GRADING: 'grading', RESULT: 'result' };

export default function Quiz() {
  const { eduData } = useAuth();
  const navigate = useNavigate();
  const subjects = eduData?.subjects || [];

  const [phase, setPhase] = useState(PHASE.SETUP);
  const [subject, setSubject] = useState(subjects[0] || '');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState({});       // MCQ: { qIdx: chosenOption }
  const [textAnswers, setTextAnswers] = useState({});  // short/long: { qIdx: typedText }
  const [grades, setGrades] = useState([]);            // AI grades per question after submit
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => { if (subject) loadHistory(subject); }, []);
  useEffect(() => { if (subject) loadHistory(subject); }, [subject]);

  const loadHistory = async (sub) => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/quiz/${encodeURIComponent(sub)}`);
      setHistory(data.attempts || []);
    } catch { setHistory([]); }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (phase === PHASE.QUIZ) {
      setStartedAt(now());
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleStart = async () => {
    setPhase(PHASE.LOADING);
    setSelected({}); setTextAnswers({}); setGrades([]);
    try {
      const { data } = await api.post('/ai/questions', { subject, context: topic || `General ${subject}`, count });
      const qs = (data.questions || []).map(q => ({
        ...q,
        type: q.type || 'mcq',
        options: q.options || [],
      }));
      setQuestions(qs);
      setCurrentIdx(0);
      setPhase(PHASE.QUIZ);
    } catch (err) {
      alert(`Failed to generate questions: ${err?.response?.data?.error || err?.message}`);
      setPhase(PHASE.SETUP);
    }
  };

  const selectAnswer = (qIdx, answer) => {
    if (selected[qIdx] !== undefined) return;
    setSelected(s => ({ ...s, [qIdx]: answer }));
  };

  const setTextAnswer = (qIdx, text) => {
    setTextAnswers(t => ({ ...t, [qIdx]: text }));
  };

  // Check how many questions are answered
  const answeredCount = questions.reduce((count, q, i) => {
    if (q.type === 'mcq') return selected[i] !== undefined ? count + 1 : count;
    return textAnswers[i]?.trim() ? count + 1 : count;
  }, 0);

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    const timeTaken = Math.round((now() - startedAt) / 1000);
    setPhase(PHASE.GRADING);

    // ── 1. Grade MCQs locally ──────────────────────────────────────────
    let mcqCorrect = 0;
    let mcqTotal = 0;
    const mcqResults = questions.map((q, i) => {
      if (q.type !== 'mcq') return null;
      mcqTotal++;
      const userAnswer = selected[i];
      const correctLetter = q.answer?.trim().charAt(0).toUpperCase();
      const selectedLetter = userAnswer ? String.fromCharCode(65 + (q.options || []).indexOf(userAnswer)) : '';
      const isCorrect = (correctLetter && selectedLetter === correctLetter) || userAnswer === q.answer;
      if (isCorrect) mcqCorrect++;
      return { score: isCorrect ? 10 : 0, feedback: isCorrect ? 'Correct!' : `Correct answer: ${q.answer}`, isCorrect };
    });

    // ── 2. Grade short/long answers via AI ────────────────────────────
    const openAnswers = questions
      .map((q, i) => ({ ...q, idx: i }))
      .filter(q => q.type !== 'mcq');

    let aiGrades = [];
    if (openAnswers.length > 0) {
      try {
        const { data } = await api.post('/ai/grade', {
          answers: openAnswers.map(q => ({
            question: q.question,
            userAnswer: textAnswers[q.idx] || '',
            correctAnswer: q.answer,
            type: q.type,
          })),
        });
        aiGrades = data.grades || [];
      } catch {
        aiGrades = openAnswers.map(() => ({ score: 0, feedback: 'Could not grade.', isCorrect: false }));
      }
    }

    // ── 3. Merge all grades ───────────────────────────────────────────
    const allGrades = [];
    let aiIdx = 0;
    questions.forEach((q, i) => {
      if (q.type === 'mcq') {
        allGrades.push(mcqResults[i]);
      } else {
        allGrades.push(aiGrades[aiIdx++] || { score: 0, feedback: 'Not graded.', isCorrect: false });
      }
    });
    setGrades(allGrades);

    // ── 4. Calculate final score ──────────────────────────────────────
    // Each question worth 10 points → total = questions.length * 10
    const totalPointsEarned = allGrades.reduce((sum, g) => sum + (g?.score || 0), 0);
    const totalPointsPossible = questions.length * 10;
    const score = Math.round((totalPointsEarned / totalPointsPossible) * 100);
    const correct = mcqCorrect + allGrades.filter((g, i) => questions[i]?.type !== 'mcq' && g?.isCorrect).length;

    // ── 5. Save to backend ────────────────────────────────────────────
    const resultData = {
      subject,
      correct,
      total: questions.length,
      totalPointsEarned,
      totalPointsPossible,
      timeTakenSeconds: timeTaken,
      questions: questions.map((q, i) => ({
        question: q.question,
        type: q.type,
        userAnswer: q.type === 'mcq' ? (selected[i] || null) : (textAnswers[i] || null),
        correctAnswer: q.answer,
        pointsEarned: allGrades[i]?.score || 0,
        feedback: allGrades[i]?.feedback || '',
      })),
    };

    try {
      const { data } = await api.post('/quiz/save', resultData);
      setResult({ ...data.attempt, score, totalPointsEarned, totalPointsPossible });
    } catch {
      setResult({ ...resultData, score });
    }
    setPhase(PHASE.RESULT);
    loadHistory(subject);
  };

  const q = questions[currentIdx];
  const totalQ = questions.length;
  const progress = totalQ > 0 ? ((currentIdx + 1) / totalQ) * 100 : 0;

  const scoreColor = (score) => score >= 80 ? '#2d8a4e' : score >= 50 ? '#d97706' : '#e53e3e';
  const scoreBg = (score) => score >= 80 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#fff5f5';
  const scoreBorder = (score) => score >= 80 ? '#bbf7d0' : score >= 50 ? '#fde68a' : '#fecaca';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        <DashHeader title="Quiz" />
        <div className="p-8 flex flex-col gap-6 flex-1 max-md:p-4">

          {/* ── SETUP ─────────────────────────────────────────────── */}
          {phase === PHASE.SETUP && (
            <div className="flex flex-col gap-5 animate-fadeUp">
              <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] p-8">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-10 h-10 bg-[#FFB6C1] border-2 border-[#0D0D0D] rounded-[10px] flex items-center justify-center">
                    <Brain size={20} />
                  </div>
                  <h2 className="text-[22px] font-extrabold">Start a Quiz</h2>
                </div>
                <p className="text-sm text-[#555555] mb-6">Test yourself with AI-generated questions. MCQs are auto-graded. Short/long answers are graded by AI after submission.</p>

                <div className="flex gap-4 flex-wrap items-end">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                    <label className="text-[13px] font-semibold">Subject *</label>
                    <select value={subject} onChange={e => setSubject(e.target.value)}
                      className="px-3.5 py-[11px] border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none bg-white">
                      {subjects.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                    <label className="text-[13px] font-semibold">Topic / Chapter <span className="text-[#999]">(optional)</span></label>
                    <input type="text" placeholder="e.g. Newton's Laws, Organic Chemistry"
                      value={topic} onChange={e => setTopic(e.target.value)}
                      className="px-3.5 py-[11px] border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none focus:shadow-[0_0_0_3px_#87CEEB] transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold">Questions</label>
                    <div className="flex gap-1.5">
                      {[5, 10, 15, 20].map(n => (
                        <button key={n} onClick={() => setCount(n)}
                          className={`w-11 h-11 border-2 border-[#0D0D0D] rounded-[8px] text-sm font-bold transition-all ${count === n ? 'bg-[#0D0D0D] text-[#FFFF66]' : 'bg-white hover:bg-[#F0F0F0]'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={handleStart}
                  className="mt-6 px-7 py-3.5 bg-[#FFB6C1] border-2 border-[#0D0D0D] rounded-[8px] font-display text-[15px] font-bold hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0D0D0D] transition-all flex items-center gap-2">
                  <Brain size={16} /> Generate & Start Quiz
                </button>
              </div>

              {/* History */}
              <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] overflow-hidden">
                <div className="px-6 py-4 border-b-2 border-[#0D0D0D] bg-[#F9F9F9] flex items-center justify-between">
                  <h3 className="text-[17px] font-extrabold">Quiz History — {subject}</h3>
                  <span className="text-xs text-[#555555] font-semibold">{history.length} attempt{history.length !== 1 ? 's' : ''}</span>
                </div>
                {loadingHistory ? (
                  <div className="p-6 text-center text-sm text-[#555555]">Loading history…</div>
                ) : history.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[40px] mb-2">📝</p>
                    <p className="text-sm text-[#555555]">No quizzes yet for {subject}. Take your first one!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0F0F0]">
                    {history.map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9F9F9] transition-colors">
                        <div>
                          <p className="text-sm font-semibold">{h.subject}</p>
                          <p className="text-xs text-[#555555] mt-0.5">{fmtDateTime(h.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-[#555555]">{h.correct}/{h.total} correct</p>
                            <p className="text-xs text-[#555555]">Difficulty: {h.difficulty?.toFixed(1)}</p>
                          </div>
                          <div className="w-14 h-14 rounded-full border-[3px] border-[#0D0D0D] flex flex-col items-center justify-center flex-shrink-0"
                            style={{ background: `conic-gradient(${scoreColor(h.score)} calc(${h.score} * 1%), #E0E0E0 0)` }}>
                            <span className="font-display text-sm font-extrabold">{h.score}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── LOADING ───────────────────────────────────────────── */}
          {phase === PHASE.LOADING && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 animate-fadeIn">
              <div className="w-16 h-16 border-4 border-[#0D0D0D] border-t-[#FFB6C1] rounded-full animate-spin-slow" />
              <p className="text-[17px] font-bold">Generating {count} questions for {subject}…</p>
              <p className="text-sm text-[#555555]">Hang tight, your personalised quiz is being prepared!</p>
            </div>
          )}

          {/* ── GRADING ───────────────────────────────────────────── */}
          {phase === PHASE.GRADING && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 animate-fadeIn">
              <Loader2 size={48} className="animate-spin text-[#FFB6C1]" />
              <p className="text-[17px] font-bold">AI is grading your answers…</p>
              <p className="text-sm text-[#555555]">Evaluating short & long answers. This may take a few seconds.</p>
            </div>
          )}

          {/* ── QUIZ ──────────────────────────────────────────────── */}
          {phase === PHASE.QUIZ && q && (
            <div className="flex flex-col gap-4 animate-fadeIn max-w-[700px]">
              {/* Header bar */}
              <div className="flex items-center justify-between bg-white border-2 border-[#0D0D0D] rounded-[16px] px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-sm">{subject}</span>
                  <span className="text-[#999] text-sm">•</span>
                  <span className="text-sm font-semibold text-[#555555]">Q{currentIdx + 1} / {totalQ}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0D0D0D] text-[#FFFF66] px-3 py-1.5 rounded-[8px] font-display font-bold text-sm">
                  <Timer size={14} /> {fmtTime(elapsed)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                <div className="h-full bg-[#FFB6C1] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              {/* Question card */}
              <div className="bg-white border-2 border-[#0D0D0D] rounded-[20px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[11px] font-bold tracking-widest px-2.5 py-[3px] rounded-full border-[1.5px] border-[#0D0D0D] ${
                    q.type === 'mcq' ? 'bg-[#87CEEB]' : q.type === 'short' ? 'bg-[#FFB6C1]' : 'bg-[#FFFF66]'
                  }`}>{q.type?.toUpperCase()}</span>
                  <span className="text-xs font-semibold text-[#999]">{answeredCount} / {totalQ} answered</span>
                </div>

                <p className="text-[16px] font-semibold leading-relaxed mb-5">{q.question}</p>

                {/* MCQ */}
                {q.type === 'mcq' && q.options?.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {q.options.map((opt, j) => {
                      const letter = String.fromCharCode(65 + j);
                      const isSelected = selected[currentIdx] === opt;
                      const isLocked = selected[currentIdx] !== undefined;
                      return (
                        <button key={j} onClick={() => selectAnswer(currentIdx, opt)}
                          className={`flex items-center gap-3 px-4 py-3 border-2 rounded-[10px] text-sm text-left transition-all w-full ${
                            isSelected ? 'border-[#0D0D0D] bg-[#87CEEB] font-semibold' :
                            isLocked ? 'border-[#E0E0E0] opacity-60 cursor-default' :
                            'border-[#E0E0E0] hover:border-[#0D0D0D] hover:bg-[#F9F9F9] cursor-pointer'
                          }`}>
                          <span className="w-7 h-7 rounded-full bg-[#0D0D0D] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{letter}</span>
                          <span className="flex-1">{opt}</span>
                          {isSelected && <CheckCircle2 size={16} className="text-[#0D0D0D] flex-shrink-0" />}
                        </button>
                      );
                    })}
                    <p className="text-[11px] text-[#999] mt-1">⚠️ Answers will be revealed after you submit the quiz.</p>
                  </div>
                )}

                {/* Short / Long answer — textarea input */}
                {q.type !== 'mcq' && (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={textAnswers[currentIdx] || ''}
                      onChange={e => setTextAnswer(currentIdx, e.target.value)}
                      placeholder={q.type === 'short' ? 'Write your answer here (2-3 sentences)…' : 'Write your detailed answer here…'}
                      rows={q.type === 'short' ? 3 : 6}
                      className="w-full px-4 py-3 border-2 border-[#0D0D0D] rounded-[10px] text-sm outline-none focus:shadow-[0_0_0_3px_#87CEEB] transition-all resize-none"
                    />
                    <p className="text-[11px] text-[#999]">✏️ Write your answer above. AI will grade it after you submit.</p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 justify-between">
                <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
                  className="px-5 py-2.5 border-2 border-[#0D0D0D] rounded-[8px] text-sm font-semibold bg-white hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-default transition-colors">
                  ← Prev
                </button>
                <div className="flex gap-1.5 items-center flex-1 justify-center overflow-x-auto">
                  {questions.map((q2, i) => {
                    const isAnswered = q2.type === 'mcq' ? selected[i] !== undefined : !!textAnswers[i]?.trim();
                    return (
                      <button key={i} onClick={() => setCurrentIdx(i)}
                        className={`w-8 h-8 rounded-full border-[1.5px] text-xs font-bold flex-shrink-0 transition-all ${
                          i === currentIdx ? 'bg-[#0D0D0D] text-[#FFFF66] border-[#0D0D0D]' :
                          isAnswered ? 'bg-[#FFB6C1] border-[#0D0D0D]' :
                          'bg-white border-[#E0E0E0] hover:border-[#0D0D0D]'
                        }`}>{i + 1}</button>
                    );
                  })}
                </div>
                {currentIdx < totalQ - 1 ? (
                  <button onClick={() => setCurrentIdx(i => i + 1)}
                    className="px-5 py-2.5 bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] text-sm font-bold hover:opacity-85 transition-opacity flex items-center gap-1.5">
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={handleSubmit}
                    className="px-5 py-2.5 bg-[#FFB6C1] border-2 border-[#0D0D0D] rounded-[8px] text-sm font-bold hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0D0D0D] transition-all flex items-center gap-1.5">
                    <Trophy size={14} /> Submit
                  </button>
                )}
              </div>

              {/* Unanswered warning */}
              {answeredCount < totalQ && (
                <p className="text-xs text-center text-[#d97706] font-semibold">
                  ⚠️ {totalQ - answeredCount} question{totalQ - answeredCount !== 1 ? 's' : ''} unanswered. You can still submit.
                </p>
              )}
            </div>
          )}

          {/* ── RESULT ────────────────────────────────────────────── */}
          {phase === PHASE.RESULT && result && (
            <div className="flex flex-col gap-5 animate-fadeUp max-w-[700px]">
              {/* Score card */}
              <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] p-8 text-center">
                <div className="w-24 h-24 rounded-full border-4 border-[#0D0D0D] mx-auto mb-5 flex flex-col items-center justify-center"
                  style={{ background: `conic-gradient(${scoreColor(result.score)} calc(${result.score} * 1%), #E0E0E0 0)` }}>
                  <span className="font-display text-[28px] font-extrabold leading-tight">{result.score}</span>
                  <span className="text-xs text-[#555555]">/ 100</span>
                </div>
                <h2 className="text-[24px] font-extrabold mb-1.5">
                  {result.score >= 80 ? '🎉 Excellent!' : result.score >= 60 ? '👍 Good job!' : '💪 Keep practicing!'}
                </h2>
                <p className="text-sm text-[#555555] mb-6">
                  {result.correct} / {result.total} correct · {fmtTime(result.timeTakenSeconds || 0)} taken
                  {result.totalPointsEarned != null && ` · ${result.totalPointsEarned}/${result.totalPointsPossible} pts`}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Score', val: `${result.score}%`, bg: scoreBg(result.score), border: scoreBorder(result.score) },
                    { label: 'Difficulty', val: result.difficulty?.toFixed(1), bg: '#fffbeb', border: '#fde68a' },
                    { label: 'Prev Score', val: `${result.previousScore}%`, bg: '#f5f5f5', border: '#e0e0e0' },
                  ].map(({ label, val, bg, border }) => (
                    <div key={label} className="rounded-[12px] border-2 py-3 px-2"
                      style={{ background: bg, borderColor: border }}>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#555555] mb-0.5">{label}</p>
                      <p className="text-[20px] font-extrabold font-display">{val}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[13px] text-[#555555] mb-6 px-4">
                  ✅ Your quiz data has been saved and will update your AI timetable.
                </p>

                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => { setPhase(PHASE.SETUP); setQuestions([]); setSelected({}); setTextAnswers({}); setGrades([]); }}
                    className="flex items-center gap-1.5 px-5 py-2.5 border-2 border-[#0D0D0D] rounded-[8px] bg-white text-sm font-semibold hover:bg-[#F0F0F0] transition-colors">
                    <RotateCcw size={14} /> New Quiz
                  </button>
                  <button onClick={() => navigate('/timetable')}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] text-sm font-bold hover:-translate-y-0.5 transition-all">
                    View AI Timetable →
                  </button>
                </div>
              </div>

              {/* Per-question review */}
              <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] overflow-hidden">
                <div className="px-6 py-4 border-b-2 border-[#0D0D0D] bg-[#F9F9F9]">
                  <h3 className="text-[17px] font-extrabold">📋 Question Review</h3>
                  <p className="text-xs text-[#555555] mt-0.5">See correct answers and AI feedback for each question</p>
                </div>
                <div className="divide-y divide-[#F0F0F0]">
                  {questions.map((q2, i) => {
                    const grade = grades[i];
                    const userAns = q2.type === 'mcq' ? selected[i] : textAnswers[i];
                    const isCorrect = grade?.isCorrect;
                    return (
                      <div key={i} className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                            {isCorrect
                              ? <CheckCircle2 size={14} className="text-green-600" />
                              : <XCircle size={14} className="text-red-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-bold text-[#555555]">Q{i + 1}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                q2.type === 'mcq' ? 'bg-[#87CEEB] border-[#87CEEB]' :
                                q2.type === 'short' ? 'bg-[#FFB6C1] border-[#FFB6C1]' : 'bg-[#FFFF66] border-[#FFFF66]'
                              }`}>{q2.type?.toUpperCase()}</span>
                              {grade?.score != null && (
                                <span className="text-[11px] font-bold text-[#555555] ml-auto">{grade.score}/10 pts</span>
                              )}
                            </div>
                            <p className="text-sm font-semibold mb-2">{q2.question}</p>
                            {userAns && (
                              <div className={`px-3 py-2 rounded-[8px] text-xs mb-2 ${isCorrect ? 'bg-[#f0fdf4] border border-[#bbf7d0]' : 'bg-[#fff5f5] border border-[#fecaca]'}`}>
                                <span className="font-bold">Your answer: </span>{userAns}
                              </div>
                            )}
                            {!userAns && (
                              <div className="px-3 py-2 rounded-[8px] text-xs mb-2 bg-[#f5f5f5] border border-[#e0e0e0]">
                                <span className="font-bold text-[#999]">No answer given</span>
                              </div>
                            )}
                            <div className="px-3 py-2 rounded-[8px] text-xs bg-[#fffbeb] border border-[#fde68a]">
                              <span className="font-bold">Model answer: </span>{q2.answer}
                            </div>
                            {grade?.feedback && !isCorrect && (
                              <p className="text-[11px] text-[#555555] mt-1.5">💡 {grade.feedback}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}