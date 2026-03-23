import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Link, FileText, Search, Sparkles, BookOpen } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DashHeader from '../components/DashHeader';
import { useAuth } from '../context/AuthContext';
import { summarizeNotes, generateQuestions, askStudyQuestion } from '../utils/ai';
import api from '../utils/api';

const Spinner = () => <span className="w-3.5 h-3.5 border-2 border-[#FFFF66] border-t-transparent rounded-full animate-spin-slow inline-block" />;

export default function SubjectPage() {
  const { subjectName } = useParams();
  const subject = decodeURIComponent(subjectName);
  const navigate = useNavigate();
  const { eduData } = useAuth();

  const [tab, setTab] = useState('upload');
  const [pdfText, setPdfText] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState([]);
  const [askQ, setAskQ] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [qCount, setQCount] = useState(5);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  // Load saved subject data
  useEffect(() => {
    api.get(`/subjects/${encodeURIComponent(subject)}`)
      .then(({ data }) => {
        const d = data.subjectData;
        if (d.notes) setManualNotes(d.notes);
        if (d.youtubeLink) setYoutubeLink(d.youtubeLink);
        if (d.summary) setSummary(d.summary);
        if (d.questions?.length) setQuestions(d.questions);
      }).catch(() => {});
  }, [subject]);

  const saveSubjectData = async (updates) => {
    setSaving(true);
    try {
      await api.post(`/subjects/${encodeURIComponent(subject)}`, updates);
    } catch {}
    setSaving(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPdfText(ev.target.result); };
    reader.readAsText(file);
  };

  const getContext = () => pdfText || manualNotes || `General ${subject} concepts`;

  const handleSummarize = async () => {
    setLoading(true); setSummary('');
    try {
      const result = await summarizeNotes(subject, getContext());
      setSummary(result);
      setTab('summary');
      await saveSubjectData({ notes: manualNotes, youtubeLink, summary: result });
    } catch {
      setSummary('⚠️ Could not generate summary. Please check your API key.'); setTab('summary');
    }
    setLoading(false);
  };

  const handleGenerateQuestions = async () => {
    setLoading(true); setQuestions([]);
    try {
      const result = await generateQuestions(subject, getContext(), qCount);
      setQuestions(result);
      setTab('questions');
      await saveSubjectData({ notes: manualNotes, youtubeLink, questions: result });
    } catch { setTab('questions'); }
    setLoading(false);
  };

  const handleAsk = async () => {
    if (!askQ.trim()) return;
    setLoading(true); setAskAnswer('');
    try { const ans = await askStudyQuestion(askQ, subject, eduData); setAskAnswer(ans); }
    catch { setAskAnswer('⚠️ Could not get an answer. Please check your API key.'); }
    setLoading(false);
  };

  const handleNotesBlur = () => {
    if (manualNotes) saveSubjectData({ notes: manualNotes, youtubeLink });
  };

  const handleLinkSave = () => {
    if (youtubeLink) saveSubjectData({ notes: manualNotes, youtubeLink });
  };

  const filteredQuestions = questions.filter(q => !searchQuery || q.question?.toLowerCase().includes(searchQuery.toLowerCase()));
  const Q_TYPE_BG = { mcq: 'bg-[#87CEEB]', short: 'bg-[#FFB6C1]', long: 'bg-[#FFFF66]' };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        <DashHeader title={subject} />
        <div className="px-8 py-7 flex flex-col gap-5 flex-1 max-md:px-4">

          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 bg-white border-2 border-[#0D0D0D] rounded-[8px] px-3.5 py-2 text-sm font-semibold hover:bg-[#F0F0F0] transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="bg-[#FFB6C1] border-2 border-[#0D0D0D] rounded-full px-4 py-1 text-sm font-bold">{subject}</div>
            {saving && <span className="text-xs text-[#555555]">Saving…</span>}
          </div>

          {/* Ask bar */}
          <div className="flex items-center gap-2.5 bg-white border-2 border-[#0D0D0D] rounded-[16px] px-4 py-3">
            <Search size={16} className="text-[#999999] flex-shrink-0" />
            <input type="text" placeholder={`Ask anything about ${subject}…`} value={askQ}
              onChange={e => setAskQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAsk()}
              className="flex-1 border-none outline-none text-sm bg-transparent" />
            <button onClick={handleAsk} disabled={loading}
              className="flex items-center gap-1.5 bg-[#0D0D0D] text-[#FFFF66] border-none rounded-[8px] px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap hover:opacity-85 disabled:opacity-60 transition-opacity">
              {loading && tab !== 'questions' && tab !== 'summary' ? <Spinner /> : <><Sparkles size={14} /> Ask AI</>}
            </button>
          </div>

          {askAnswer && (
            <div className="bg-white border-2 border-[#FFFF66] rounded-[16px] px-5 py-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#555555] mb-2"><Sparkles size={13} /> AI Answer</div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{askAnswer}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1.5 bg-white border-2 border-[#0D0D0D] rounded-[16px] p-1.5 w-fit">
            {['upload','summary','questions'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 border-none rounded-[8px] text-[13px] font-semibold transition-all ${tab === t ? 'bg-[#0D0D0D] text-[#FFFF66]' : 'text-[#555555] bg-transparent hover:bg-[#F0F0F0] hover:text-[#0D0D0D]'}`}>
                {t === 'upload' && <Upload size={14} />}{t === 'summary' && <BookOpen size={14} />}{t === 'questions' && <FileText size={14} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'upload' && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-2 gap-4 mb-5 max-md:grid-cols-1">
                <div className="bg-white border-2 border-[#0D0D0D] rounded-[16px] p-5 flex flex-col gap-2.5">
                  <div className="w-12 h-12 flex items-center justify-center rounded-[8px] border-2 border-[#0D0D0D] text-2xl bg-[#FFB6C1]">📄</div>
                  <h4 className="text-[15px] font-bold">Upload PDF / Text File</h4>
                  <p className="text-[13px] text-[#555555] leading-relaxed">Upload your notes and STAI will analyse them.</p>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D0D0D] text-white rounded-[8px] text-[13px] font-semibold cursor-pointer w-fit hover:opacity-80 transition-opacity">
                    <Upload size={14} /> Choose File
                    <input type="file" accept=".txt,.pdf,.md" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {pdfText && <div className="text-xs text-[#2d8a4e] font-semibold bg-[#f0fdf4] px-2.5 py-1.5 rounded-[8px] border border-[#bbf7d0]">✓ File loaded ({pdfText.length} chars)</div>}
                </div>
                <div className="bg-white border-2 border-[#0D0D0D] rounded-[16px] p-5 flex flex-col gap-2.5">
                  <div className="w-12 h-12 flex items-center justify-center rounded-[8px] border-2 border-[#0D0D0D] text-2xl bg-[#87CEEB]">🎥</div>
                  <h4 className="text-[15px] font-bold">YouTube / Website Link</h4>
                  <p className="text-[13px] text-[#555555] leading-relaxed">Paste a link to a lecture or article.</p>
                  <div className="flex gap-2">
                    <input type="url" placeholder="https://youtube.com/watch?v=..." value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-[#E0E0E0] rounded-[8px] text-[13px] outline-none focus:border-[#0D0D0D] transition-colors" />
                    <button onClick={handleLinkSave} className="w-9 h-9 bg-[#87CEEB] border-2 border-[#0D0D0D] rounded-[8px] flex items-center justify-center">
                      <Link size={14} />
                    </button>
                  </div>
                </div>
                <div className="bg-white border-2 border-[#0D0D0D] rounded-[16px] p-5 flex flex-col gap-2.5 col-span-2 max-md:col-span-1">
                  <div className="w-12 h-12 flex items-center justify-center rounded-[8px] border-2 border-[#0D0D0D] text-2xl bg-[#FFFF66]">✏️</div>
                  <h4 className="text-[15px] font-bold">Paste / Type Notes</h4>
                  <textarea placeholder={`Paste your ${subject} notes here…`} value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)} onBlur={handleNotesBlur} rows={6}
                    className="w-full px-3 py-3 border-2 border-[#E0E0E0] rounded-[8px] text-sm outline-none resize-vertical focus:border-[#0D0D0D] transition-colors leading-relaxed" />
                </div>
              </div>
              <div className="flex gap-3 items-center flex-wrap">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                  <label>Questions:</label>
                  <select value={qCount} onChange={e => setQCount(Number(e.target.value))}
                    className="px-2.5 py-[7px] border-2 border-[#0D0D0D] rounded-[8px] text-[13px] outline-none cursor-pointer">
                    {[3,5,8,10,15].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <button onClick={handleSummarize} disabled={loading}
                  className="flex items-center gap-2 px-5 py-[11px] bg-[#FFB6C1] border-2 border-[#0D0D0D] rounded-[8px] text-sm font-bold font-display hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0D0D0D] transition-all disabled:opacity-50">
                  {loading ? <Spinner /> : '📋'} Generate Summary
                </button>
                <button onClick={handleGenerateQuestions} disabled={loading}
                  className="flex items-center gap-2 px-5 py-[11px] bg-[#87CEEB] border-2 border-[#0D0D0D] rounded-[8px] text-sm font-bold font-display hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0D0D0D] transition-all disabled:opacity-50">
                  {loading ? <Spinner /> : '❓'} Generate Questions
                </button>
              </div>
            </div>
          )}

          {tab === 'summary' && (
            <div className="animate-fadeIn">
              {summary ? (
                <div className="bg-white border-2 border-[#0D0D0D] rounded-[16px] overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 bg-[#FFFF66] border-b-2 border-[#0D0D0D] text-sm font-bold">
                    <BookOpen size={16} /> <strong>AI Summary — {subject}</strong>
                  </div>
                  <pre className="px-6 py-6 font-body text-sm leading-[1.8] whitespace-pre-wrap text-[#0D0D0D]">{summary}</pre>
                </div>
              ) : (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <span className="text-5xl">📋</span>
                  <p className="text-[15px] text-[#555555]">No summary yet. Upload your notes and click "Generate Summary".</p>
                  <button onClick={() => setTab('upload')} className="px-5 py-2.5 bg-[#0D0D0D] text-white rounded-[8px] text-sm font-semibold">← Go to Upload</button>
                </div>
              )}
            </div>
          )}

          {tab === 'questions' && (
            <div className="animate-fadeIn">
              {questions.length > 0 ? (
                <>
                  <div className="flex items-center gap-2.5 bg-white border-2 border-[#0D0D0D] rounded-[8px] px-3.5 py-2.5 mb-4">
                    <Search size={14} />
                    <input type="text" placeholder="Search questions…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 border-none outline-none text-sm" />
                    <span className="text-xs font-semibold text-[#555555]">{filteredQuestions.length} questions</span>
                  </div>
                  <div className="flex flex-col gap-3.5">
                    {filteredQuestions.map((q, i) => (
                      <div key={i} className="bg-white border-2 border-[#0D0D0D] rounded-[16px] p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[11px] font-bold tracking-widest px-2.5 py-[3px] rounded-full border-[1.5px] border-[#0D0D0D] ${Q_TYPE_BG[q.type] || 'bg-[#87CEEB]'}`}>{q.type?.toUpperCase()}</span>
                          <span className="text-xs text-[#999999] font-semibold">Q{i+1}</span>
                        </div>
                        <p className="text-[15px] font-medium leading-relaxed mb-3.5">{q.question}</p>
                        {q.type === 'mcq' && q.options && (
                          <div className="flex flex-col gap-2">
                            {q.options.map((opt, j) => (
                              <button key={j} onClick={() => setAnswers({...answers,[i]:j})}
                                className={`flex items-center gap-2.5 px-3.5 py-2.5 border-2 rounded-[8px] text-sm text-left bg-white transition-all ${answers[i] === j ? 'border-[#0D0D0D] bg-[#87CEEB] font-semibold' : 'border-[#E0E0E0] hover:border-[#0D0D0D] hover:bg-[#F9F9F9]'}`}>
                                <span className="w-[22px] h-[22px] bg-[#0D0D0D] text-white rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0">{String.fromCharCode(65+j)}</span>
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {answers[i] !== undefined && (
                          <div className="mt-2.5 px-3.5 py-2.5 bg-[#f0fdf4] border-2 border-[#bbf7d0] rounded-[8px] text-[13px]"><strong>Answer:</strong> {q.answer}</div>
                        )}
                        {q.type !== 'mcq' && (
                          <button onClick={() => setAnswers({...answers,[i]:true})}
                            className="mt-2.5 px-4 py-2 bg-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] text-[13px] font-semibold hover:bg-[#e6e600] transition-colors text-left w-full">
                            {answers[i] ? `✓ Answer: ${q.answer}` : 'Reveal Answer'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <span className="text-5xl">❓</span>
                  <p className="text-[15px] text-[#555555]">No questions yet. Upload notes and click "Generate Questions".</p>
                  <button onClick={() => setTab('upload')} className="px-5 py-2.5 bg-[#0D0D0D] text-white rounded-[8px] text-sm font-semibold">← Go to Upload</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
