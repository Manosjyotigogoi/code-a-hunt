import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashHeader from '../components/DashHeader';
import { useAuth } from '../context/AuthContext';
import { analyzeGrowth } from '../utils/ai';
import api from '../utils/api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function GrowthAnalysis() {
  const { eduData } = useAuth();
  const subjects = eduData?.subjects || [];
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [scores, setScores] = useState([{ label: 'Quiz 1', score: '' }, { label: 'Quiz 2', score: '' }, { label: 'Quiz 3', score: '' }]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load saved scores when subject changes
  useEffect(() => {
    if (!selectedSubject) return;
    api.get(`/growth/${encodeURIComponent(selectedSubject)}`)
      .then(({ data }) => {
        if (data.growth?.scores?.length) setScores(data.growth.scores);
        else setScores([{ label: 'Quiz 1', score: '' }, { label: 'Quiz 2', score: '' }, { label: 'Quiz 3', score: '' }]);
        if (data.growth?.analysis) setAnalysis(data.growth.analysis);
        else setAnalysis(null);
      })
      .catch(() => {});
  }, [selectedSubject]);

  const updateScore = (i, field, val) => setScores(s => s.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const addScore = () => setScores(s => [...s, { label: `Quiz ${s.length + 1}`, score: '' }]);

  const handleAnalyze = async () => {
    setLoading(true); setAnalysis(null);
    try {
      const filledScores = scores.filter(s => s.score !== '').map(s => ({ label: s.label, score: Number(s.score) }));
      const result = await analyzeGrowth(selectedSubject, filledScores, [selectedSubject]);
      setAnalysis(result);
      // Save to backend
      await api.post('/growth', { subject: selectedSubject, scores, analysis: result });
    } catch {
      setAnalysis({ strengths: [], weaknesses: [], suggestions: ['Could not analyze. Please check your API key.'], overallScore: 0, trend: 'stable' });
    }
    setLoading(false);
  };

  const TrendIcon = analysis?.trend === 'improving' ? TrendingUp : analysis?.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = analysis?.trend === 'improving' ? '#2d8a4e' : analysis?.trend === 'declining' ? '#e53e3e' : '#888';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        <DashHeader title="Growth Analysis" />
        <div className="p-8 flex flex-col gap-6 flex-1 max-md:p-4">
          <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] p-8">
            <h2 className="text-[22px] font-extrabold mb-1.5">📊 Analyze Your Performance</h2>
            <p className="text-sm text-[#555555] mb-6">Enter your quiz/test scores and STAI will analyze your strengths, weaknesses, and improvement areas.</p>

            <div className="mb-5">
              <div className="flex flex-col gap-1.5 max-w-[280px]">
                <label className="text-[13px] font-semibold">Subject</label>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                  className="px-3.5 py-[11px] border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none bg-white">
                  {subjects.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="border-2 border-[#0D0D0D] rounded-[16px] overflow-hidden mb-5">
              <div className="grid gap-3 px-4 py-2.5 bg-[#0D0D0D]" style={{gridTemplateColumns:'1fr 1fr'}}>
                <span className="text-xs font-bold text-[#FFFF66] uppercase tracking-wide">Test / Quiz Name</span>
                <span className="text-xs font-bold text-[#FFFF66] uppercase tracking-wide">Score (out of 100)</span>
              </div>
              {scores.map((s, i) => (
                <div key={i} className="grid gap-3 px-4 py-2.5 border-b border-[#E0E0E0] last:border-b-0" style={{gridTemplateColumns:'1fr 1fr'}}>
                  <input type="text" placeholder="e.g. Chapter 1 Test" value={s.label} onChange={e => updateScore(i,'label',e.target.value)}
                    className="px-3 py-2 border-2 border-[#E0E0E0] rounded-[8px] text-sm outline-none focus:border-[#0D0D0D] transition-colors" />
                  <input type="number" min={0} max={100} placeholder="0-100" value={s.score} onChange={e => updateScore(i,'score',e.target.value)}
                    className="px-3 py-2 border-2 border-[#E0E0E0] rounded-[8px] text-sm outline-none focus:border-[#0D0D0D] transition-colors" />
                </div>
              ))}
              <button onClick={addScore} className="w-full py-2.5 bg-[#F9F9F9] border-t border-dashed border-[#999999] text-[13px] font-semibold text-[#555555] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] transition-colors">
                + Add another score
              </button>
            </div>

            <button onClick={handleAnalyze} disabled={loading}
              className="px-7 py-3.5 bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] font-display text-[15px] font-bold hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Analyzing…' : '🔍 Analyze Growth'}
            </button>
          </div>

          {analysis && (
            <div className="grid gap-4 animate-fadeUp max-md:grid-cols-1" style={{gridTemplateColumns:'200px 1fr 1fr'}}>
              <div className="bg-white border-2 border-[#0D0D0D] rounded-[16px] p-6 flex flex-col items-center gap-3.5 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-[#555555]">Overall Score</p>
                <div className="w-[90px] h-[90px] rounded-full flex flex-col items-center justify-center border-[3px] border-[#0D0D0D]"
                  style={{background:`conic-gradient(#FFB6C1 calc(${analysis.overallScore} * 1%), #E0E0E0 0)`}}>
                  <span className="font-display text-2xl font-extrabold">{analysis.overallScore}</span>
                  <small className="text-[11px] text-[#555555]">/100</small>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] font-bold" style={{color: trendColor}}>
                  <TrendIcon size={16} />{analysis.trend?.charAt(0).toUpperCase() + analysis.trend?.slice(1)}
                </div>
              </div>
              <div className="bg-[#f0fdf4] border-2 border-[#bbf7d0] rounded-[16px] p-5">
                <h4 className="text-[15px] font-bold mb-3">💪 Strengths</h4>
                {analysis.strengths?.length ? (
                  <ul className="flex flex-col gap-2">{analysis.strengths.map((s,i) => <li key={i} className="text-sm leading-relaxed pl-4 relative before:content-['→'] before:absolute before:left-0 before:font-bold">{s}</li>)}</ul>
                ) : <p className="text-[13px] text-[#555555]">No strengths identified yet.</p>}
              </div>
              <div className="bg-[#fff5f5] border-2 border-[#fed7d7] rounded-[16px] p-5">
                <h4 className="text-[15px] font-bold mb-3">⚠️ Areas to Improve</h4>
                {analysis.weaknesses?.length ? (
                  <ul className="flex flex-col gap-2">{analysis.weaknesses.map((w,i) => <li key={i} className="text-sm leading-relaxed pl-4 relative before:content-['→'] before:absolute before:left-0 before:font-bold">{w}</li>)}</ul>
                ) : <p className="text-[13px] text-[#555555]">No weak areas identified.</p>}
              </div>
              <div className="col-span-full bg-[#FFFACD] border-2 border-[#FFFF66] rounded-[16px] p-5 max-md:col-span-1">
                <h4 className="text-[15px] font-bold mb-3">💡 AI Suggestions</h4>
                {analysis.suggestions?.length ? (
                  <ul className="flex flex-col gap-2">{analysis.suggestions.map((s,i) => <li key={i} className="text-sm leading-relaxed pl-4 relative before:content-['→'] before:absolute before:left-0 before:font-bold">{s}</li>)}</ul>
                ) : <p className="text-[13px] text-[#555555]">Keep adding scores for personalised suggestions!</p>}
              </div>
            </div>
          )}

          {!loading && !analysis && (
            <div className="text-center py-20 flex flex-col items-center gap-3">
              <span className="text-5xl">📈</span>
              <p className="text-[15px] text-[#555555] max-w-[400px]">Enter your test scores above and click "Analyze Growth" to see AI-powered insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
