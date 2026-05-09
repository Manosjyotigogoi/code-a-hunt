import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashHeader from '../components/DashHeader';
import { useAuth } from '../context/AuthContext';
import { generateQuestions } from '../utils/ai';
import { Brain } from 'lucide-react';

export default function QuestionGenerator() {
  const { eduData } = useAuth();
  const navigate = useNavigate();
  const subjects = eduData?.subjects || [];
  const [subject, setSubject] = useState(subjects[0] || '');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});

  const handleGenerate = async () => {
    setLoading(true); setQuestions([]); setAnswers({});
    try { const result = await generateQuestions(subject, topic || `General ${subject}`, count); setQuestions(result); }
    catch { setQuestions([]); }
    setLoading(false);
  };

  const TYPE_COLORS = { mcq: '#87CEEB', short: '#FFB6C1', long: '#FFFF66' };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        <DashHeader title="Question Generator" />
        <div className="p-8 flex flex-col gap-6 flex-1 max-md:p-4">

          {/* Upgrade banner */}
          <div className="bg-[#0D0D0D] border-2 border-[#0D0D0D] rounded-[16px] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#FFB6C1] rounded-[8px] flex items-center justify-center flex-shrink-0">
                <Brain size={17} className="text-[#0D0D0D]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Want a <em>scored</em> quiz?</p>
                <p className="text-white/50 text-xs">The Quiz page grades you, tracks accuracy, and feeds the AI timetable model.</p>
              </div>
            </div>
            <button onClick={() => navigate('/quiz')}
              className="px-4 py-2 bg-[#FFB6C1] border-2 border-[#FFB6C1] rounded-[8px] text-[#0D0D0D] text-sm font-bold whitespace-nowrap hover:bg-[#ff9db5] transition-colors">
              Go to Quiz →
            </button>
          </div>

          <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] p-8">
            <h2 className="text-[22px] font-extrabold mb-1.5">Generate Practice Questions</h2>
            <p className="text-sm text-[#555555] mb-6">Choose your subject and topic — generates mixed MCQ, short, and long-answer questions.</p>

            <div className="flex gap-3.5 flex-wrap items-end">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                <label className="text-[13px] font-semibold">Subject *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="px-3.5 py-[11px] border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none bg-white">
                  {subjects.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                <label className="text-[13px] font-semibold">Topic / Chapter (optional)</label>
                <input type="text" placeholder="e.g. Quadratic Equations, Photosynthesis" value={topic} onChange={e => setTopic(e.target.value)}
                  className="px-3.5 py-[11px] border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none bg-white" />
              </div>
              <div className="flex flex-col gap-1.5 w-[140px]">
                <label className="text-[13px] font-semibold">No. of Questions</label>
                <select value={count} onChange={e => setCount(Number(e.target.value))}
                  className="px-3.5 py-[11px] border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none bg-white">
                  {[3, 5, 8, 10, 15].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <button onClick={handleGenerate} disabled={loading}
                className="px-6 py-[11px] bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] font-display text-[15px] font-bold hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.15)] transition-all disabled:opacity-50">
                {loading ? 'Generating…' : 'Generate ✦'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-3 px-4">
              <div className="w-5 h-5 border-[3px] border-[#0D0D0D] border-t-transparent rounded-full animate-spin-slow" />
              <span className="text-sm text-[#555555]">Generating questions…</span>
            </div>
          )}

          {questions.length > 0 && (
            <div className="flex flex-col gap-4 animate-fadeUp">
              {questions.map((q, i) => (
                <div key={i} className="bg-white border-2 border-[#0D0D0D] rounded-[16px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-widest px-2.5 py-[3px] rounded-full border-[1.5px] border-[#0D0D0D]"
                      style={{ background: TYPE_COLORS[q.type] || '#87CEEB' }}>{q.type?.toUpperCase()}</span>
                    <span className="text-xs text-[#999] font-semibold">Q{i + 1}</span>
                  </div>
                  <p className="text-[15px] font-medium leading-relaxed mb-4">{q.question}</p>
                  {q.type === 'mcq' && q.options && (
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt, j) => (
                        <button key={j} onClick={() => setAnswers(a => ({ ...a, [i]: j }))}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 border-2 rounded-[8px] text-sm text-left transition-all ${
                            answers[i] === j ? 'border-[#0D0D0D] bg-[#87CEEB] font-semibold' : 'border-[#E0E0E0] hover:border-[#0D0D0D] bg-white'
                          }`}>
                          <span className="w-[22px] h-[22px] bg-[#0D0D0D] text-white rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                            {String.fromCharCode(65 + j)}
                          </span>
                          {opt}
                        </button>
                      ))}
                      {answers[i] !== undefined && (
                        <div className="mt-1 px-3.5 py-2.5 bg-[#f0fdf4] border-2 border-[#bbf7d0] rounded-[8px] text-[13px]">
                          <strong>Answer:</strong> {q.answer}
                        </div>
                      )}
                    </div>
                  )}
                  {q.type !== 'mcq' && (
                    <button onClick={() => setAnswers(a => ({ ...a, [i]: !a[i] }))}
                      className="mt-1 px-4 py-2 bg-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] text-[13px] font-semibold hover:bg-[#e6e600] transition-colors w-full text-left">
                      {answers[i] ? `✓ Answer: ${q.answer}` : 'Reveal Answer'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
