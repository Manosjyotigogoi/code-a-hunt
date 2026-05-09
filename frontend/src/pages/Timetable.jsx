import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashHeader from '../components/DashHeader';
import { useAuth } from '../context/AuthContext';
import { generateStudySchedule } from '../utils/ai';
import api from '../utils/api';
import { Sparkles, TrendingUp, Clock, BookOpen, RefreshCw, Info } from 'lucide-react';

const PRIORITY_COLORS = { high: '#FFB6C1', medium: '#FFFF66', low: '#87CEEB' };

function AccuracyBar({ value }) {
  const color = value >= 70 ? '#2d8a4e' : value >= 45 ? '#d97706' : '#e53e3e';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function Timetable() {
  const { eduData } = useAuth();
  const subjects = eduData?.subjects || [];

  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [schedule, setSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    api.get('/timetable').then(({ data }) => {
      if (data.timetable?.schedule?.length) {
        setSchedule(data.timetable.schedule);
        setHoursPerDay(data.timetable.hoursPerDay || 3);
      }
    }).catch(() => {});
    api.get('/session/today').then(({ data }) => setSession(data.session)).catch(() => {});
    fetchAIPrediction();
  }, []);

  const fetchAIPrediction = async (overrideHours) => {
    setLoadingAI(true); setAiError('');
    try {
      const { data } = await api.post('/ai-predict', { study_hours: overrideHours ?? hoursPerDay });
      setAiPrediction(data);
    } catch (err) {
      setAiError(err?.response?.data?.error || err?.message || 'AI prediction failed.');
    }
    setLoadingAI(false);
  };

  const handleGenerate = async () => {
    setLoadingSchedule(true); setSchedule([]);
    try {
      const result = await generateStudySchedule(subjects, [], hoursPerDay);
      const sched = result.schedule || [];
      setSchedule(sched);
      await api.post('/timetable', { schedule: sched, hoursPerDay });
    } catch {}
    setLoadingSchedule(false);
  };

  const handleHoursChange = (h) => { setHoursPerDay(h); fetchAIPrediction(h); };

  const grouped = schedule.reduce((acc, item) => {
    const d = item.date || 'Unscheduled';
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return s; } };
  const perfColor = (p) => p >= 80 ? '#2d8a4e' : p >= 60 ? '#d97706' : '#e53e3e';
  const perfBg = (p) => p >= 80 ? '#f0fdf4' : p >= 60 ? '#fffbeb' : '#fff5f5';
  const perfBorder = (p) => p >= 80 ? '#bbf7d0' : p >= 60 ? '#fde68a' : '#fecaca';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        <DashHeader title="Timetable" />
        <div className="p-8 flex flex-col gap-6 flex-1 max-md:p-4">

          {/* ── AI PREDICTION PANEL ────────────────────────────────── */}
          <div className="bg-[#0D0D0D] border-2 border-[#0D0D0D] rounded-[24px] p-7 text-white">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFFF66] border-2 border-[#FFFF66] rounded-[10px] flex items-center justify-center">
                  <Sparkles size={18} className="text-[#0D0D0D]" />
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold">AI Study Prediction</h2>
                  <p className="text-white/50 text-xs">Powered by your quiz scores &amp; session data</p>
                </div>
              </div>
              <button onClick={() => fetchAIPrediction()} disabled={loadingAI}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[8px] text-sm font-semibold transition-all disabled:opacity-50">
                <RefreshCw size={13} className={loadingAI ? 'animate-spin-slow' : ''} />
                {loadingAI ? 'Running model…' : 'Refresh'}
              </button>
            </div>

            {aiError && (
              <div className="bg-red-900/40 border border-red-500/40 rounded-[10px] px-4 py-3 text-sm text-red-300 mb-4">
                ⚠️ {aiError}
              </div>
            )}

            {loadingAI && !aiPrediction && (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-[#FFFF66] border-t-transparent rounded-full animate-spin-slow flex-shrink-0" />
                <span className="text-sm text-white/60">Running RandomForest prediction model…</span>
              </div>
            )}

            {aiPrediction && (
              <div className="flex flex-col gap-5">
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>

                  {/* Recommended hours */}
                  <div className="bg-[#FFFF66] border-2 border-[#FFFF66] rounded-[16px] px-5 py-4 text-[#0D0D0D]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">Recommended Daily Hours</span>
                    </div>
                    <div className="text-[38px] font-extrabold font-display leading-none">{aiPrediction.recommended_hours}</div>
                    <div className="text-[12px] font-semibold mt-1 opacity-60">
                      You set: {hoursPerDay}h/day &nbsp;·&nbsp;
                      {aiPrediction.recommended_hours > hoursPerDay
                        ? `+${(aiPrediction.recommended_hours - hoursPerDay).toFixed(1)}h suggested`
                        : aiPrediction.recommended_hours < hoursPerDay
                          ? 'Can take it a bit lighter'
                          : 'On target!'}
                    </div>
                  </div>

                  {/* Predicted performance */}
                  <div className="rounded-[16px] px-5 py-4 border-2"
                    style={{ background: perfBg(aiPrediction.predicted_performance), borderColor: perfBorder(aiPrediction.predicted_performance) }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={14} style={{ color: perfColor(aiPrediction.predicted_performance) }} />
                      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: perfColor(aiPrediction.predicted_performance) }}>
                        Predicted Performance
                      </span>
                    </div>
                    <div className="text-[38px] font-extrabold font-display leading-none" style={{ color: perfColor(aiPrediction.predicted_performance) }}>
                      {aiPrediction.predicted_performance}<span className="text-lg">%</span>
                    </div>
                    <p className="text-[12px] font-semibold mt-1 opacity-60">If you study as recommended</p>
                  </div>

                  {/* Session stats */}
                  {session && (
                    <div className="bg-white/8 border border-white/12 rounded-[16px] px-5 py-4 text-white">
                      <p className="text-[11px] font-bold uppercase tracking-wide mb-3 text-white/50">Today's Session</p>
                      <div className="flex flex-col gap-1.5 text-sm">
                        {[['Online', session.totalOnlineMinutes + ' min'],['Active', session.activeMinutes + ' min'],['Breaks', session.breaks],['Focus', session.focusLevel + '/10']].map(([l,v]) => (
                          <div key={l} className="flex justify-between">
                            <span className="text-white/50">{l}</span>
                            <span className="font-bold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Per-subject allocation */}
                {aiPrediction.timetable?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={13} className="text-white/50" />
                      <span className="text-[12px] font-bold text-white/60 uppercase tracking-wide">AI Hour Allocation per Subject</span>
                    </div>
                    <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                      {aiPrediction.timetable.map((item, i) => (
                        <div key={i} className="bg-white/8 border border-white/10 rounded-[12px] px-4 py-3">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="text-sm font-bold leading-tight">{item.subject}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.priority === 'high' ? 'bg-[#FFB6C1]/20 border-[#FFB6C1]/40 text-[#FFB6C1]' :
                              item.priority === 'medium' ? 'bg-[#FFFF66]/20 border-[#FFFF66]/40 text-[#FFFF66]' :
                              'bg-[#87CEEB]/20 border-[#87CEEB]/40 text-[#87CEEB]'
                            }`}>{item.priority}</span>
                          </div>
                          <div className="text-[26px] font-extrabold font-display leading-none mt-1">
                            {item.allocatedHours}<span className="text-sm font-semibold text-white/40 ml-1">h</span>
                          </div>
                          <AccuracyBar value={item.accuracy} />
                          <p className="text-[10px] text-white/35 mt-1">
                            {item.lastQuizDate ? `Last quiz: ${item.lastQuizDate} · ${item.lastQuizScore}%` : 'No quiz yet — equal priority'}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-start gap-2 bg-white/5 border border-white/10 rounded-[10px] px-3.5 py-2.5">
                      <Info size={12} className="text-white/35 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-white/40 leading-relaxed">
                        Inputs → study_hours: {aiPrediction.inputs?.study_hours}h · focus: {aiPrediction.inputs?.focus_level}/10 · breaks: {aiPrediction.inputs?.breaks} · difficulty: {aiPrediction.inputs?.difficulty_level?.toFixed(2)} · prev_score: {aiPrediction.inputs?.previous_score} · Updates automatically after each quiz.
                      </p>
                    </div>
                  </div>
                )}

                {aiPrediction.timetable?.length === 0 && (
                  <div className="bg-white/8 border border-white/10 rounded-[12px] px-4 py-4 text-sm text-white/50">
                    📝 Take a quiz in any subject to unlock per-subject hour allocation. All subjects get equal time until then.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SCHEDULE GENERATOR ─────────────────────────────────── */}
          <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] p-8">
            <h2 className="text-[20px] font-extrabold mb-1">📅 Generate Day-by-Day Schedule</h2>
            <p className="text-sm text-[#555555] mb-5">Claude AI builds a 2-week daily plan using the priorities from the model above.</p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold">
                  Available study hours per day
                  {aiPrediction && Math.abs(aiPrediction.recommended_hours - hoursPerDay) > 0.5 && (
                    <span className="ml-2 text-[11px] text-[#d97706] font-semibold">
                      AI recommends {aiPrediction.recommended_hours}h
                    </span>
                  )}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 8].map(h => (
                    <button key={h} onClick={() => handleHoursChange(h)}
                      className={`relative px-3.5 py-2 border-2 border-[#0D0D0D] rounded-[8px] text-sm font-semibold transition-all ${hoursPerDay === h ? 'bg-[#0D0D0D] text-[#FFFF66]' : 'bg-white hover:bg-[#F0F0F0]'}`}>
                      {h}h
                      {aiPrediction && aiPrediction.recommended_hours === h && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#FFFF66] border border-[#0D0D0D] rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold mb-2 block">Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => {
                    const aiData = aiPrediction?.timetable?.find(t => t.subject === s);
                    return (
                      <span key={s} className="flex items-center gap-1 px-3 py-1 bg-[#FFB6C1] border-[1.5px] border-[#0D0D0D] rounded-full text-xs font-semibold">
                        {s}{aiData && <span className="opacity-60 ml-0.5">· {aiData.allocatedHours}h</span>}
                      </span>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleGenerate} disabled={loadingSchedule}
                className="px-7 py-3.5 bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] font-display text-[15px] font-bold w-fit hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.15)] transition-all disabled:opacity-50">
                {loadingSchedule ? 'Building schedule…' : '📅 Generate Schedule'}
              </button>
            </div>
          </div>

          {/* ── SCHEDULE CARDS ──────────────────────────────────────── */}
          {schedule.length > 0 && (
            <div className="grid gap-4 animate-fadeUp" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date} className="bg-white border-2 border-[#0D0D0D] rounded-[16px] overflow-hidden">
                  <div className="px-4 py-3 bg-[#0D0D0D] flex justify-between items-center">
                    <strong className="text-[#FFFF66] text-sm">{fmtDate(date)}</strong>
                    <span className="text-white/50 text-xs">{items.length} session{items.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {items.map((item, i) => {
                      const aiData = aiPrediction?.timetable?.find(t => t.subject === item.subject);
                      return (
                        <div key={i} className="flex gap-2.5 p-3 border-[1.5px] border-[#E0E0E0] rounded-[8px] hover:border-[#0D0D0D] transition-colors">
                          <div className="w-1 rounded-sm flex-shrink-0 self-stretch min-h-[40px]"
                            style={{ background: PRIORITY_COLORS[item.priority] || '#87CEEB' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold mb-0.5 truncate">{item.subject}</p>
                            <p className="text-xs text-[#555555] mb-1.5 truncate">{item.topic}</p>
                            <div className="flex justify-between items-center gap-1 flex-wrap">
                              <span className="text-[11px] text-[#555555]">⏱ {item.duration}</span>
                              {aiData && <span className="text-[10px] font-bold text-[#999]">AI: {aiData.allocatedHours}h/day</span>}
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border border-[#0D0D0D]"
                                style={{ background: PRIORITY_COLORS[item.priority] || '#87CEEB' }}>{item.priority}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingSchedule && schedule.length === 0 && (
            <div className="text-center py-14 flex flex-col items-center gap-3">
              <span className="text-5xl">📅</span>
              <p className="text-[15px] text-[#555555] max-w-[400px]">
                AI prediction is live above. Click "Generate Schedule" to build a full day-by-day plan.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
