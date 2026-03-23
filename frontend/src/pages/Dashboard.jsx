import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Send, Sparkles } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DashHeader from '../components/DashHeader';
import { useAuth } from '../context/AuthContext';
import { askStudyQuestion } from '../utils/ai';
import { useSession } from '../hooks/useSession';

const NOTEBOOK_COLORS = [
  { cover: '#FFB6C1', spine: '#f0849a' },
  { cover: '#87CEEB', spine: '#5bb8d4' },
  { cover: '#FFFF66', spine: '#e6e600' },
  { cover: '#c8f7c5', spine: '#7dcea0' },
  { cover: '#d7bde2', spine: '#a569bd' },
  { cover: '#fad7a0', spine: '#e59866' },
];

const SUBJECT_EMOJIS = {
  mathematics: '📐', math: '📐', physics: '⚛️', chemistry: '🧪', biology: '🧬',
  english: '📖', history: '🏛️', geography: '🌍', 'computer science': '💻',
  python: '🐍', 'data structures': '🌳', algorithms: '⚙️', 'machine learning': '🤖',
  economics: '📊', accountancy: '💰', 'business studies': '🏢', 'political science': '🏛️',
  default: '📓',
};

function getEmoji(subjectName) {
  const key = subjectName?.toLowerCase();
  for (const [k, v] of Object.entries(SUBJECT_EMOJIS)) {
    if (key?.includes(k)) return v;
  }
  return SUBJECT_EMOJIS.default;
}

export default function Dashboard() {
  const { user, eduData } = useAuth();
  const navigate = useNavigate();
  useSession(); // track online time & breaks
  const [globalQ, setGlobalQ] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const subjects = eduData?.subjects || ['Mathematics', 'Physics', 'Chemistry'];

  const askQuestion = async () => {
    if (!globalQ.trim()) return;
    setAiLoading(true); setAiAnswer('');
    try { const ans = await askStudyQuestion(globalQ, '', eduData); setAiAnswer(ans); }
    catch { setAiAnswer('⚠️ Could not get an answer. Please check your API key in src/utils/ai.js.'); }
    setAiLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        <DashHeader title="Dashboard" />
        <div className="p-8 flex-1 flex flex-col gap-7 max-sm:p-4">

          {/* Welcome banner */}
          <div className="bg-[#0D0D0D] rounded-[24px] px-8 py-7 flex items-center justify-between gap-5 animate-fadeUp max-sm:flex-col max-sm:items-start">
            <div>
              <h2 className="text-[22px] font-extrabold text-white mb-1.5">Welcome back, {user?.name?.split(' ')[0] || 'Scholar'}! 👋</h2>
              <p className="text-sm text-white/50">{eduData ? `${eduData.educationLevel} · ${eduData.institution} · ${subjects.length} subjects loaded` : 'Click on a notebook to upload study materials and get started.'}</p>
            </div>
            <div className="flex gap-6 flex-shrink-0">
              {[{val:subjects.length,label:'Subjects'},{val:'AI',label:'Ready'}].map(({val,label}) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <strong className="font-display text-2xl font-extrabold text-[#FFFF66]">{val}</strong>
                  <span className="text-[11px] text-white/50 uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Global search */}
          <div className="animate-fadeUp">
            <div className="flex items-center gap-3 bg-white border-2 border-[#0D0D0D] rounded-[16px] px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <Search size={18} className="text-[#999999] flex-shrink-0" />
              <input type="text" placeholder="Ask any study question… e.g. Explain Newton's 3rd law"
                value={globalQ} onChange={e => setGlobalQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && askQuestion()}
                className="flex-1 border-none outline-none text-[15px] bg-transparent text-[#0D0D0D]" />
              <button onClick={askQuestion} disabled={aiLoading}
                className="bg-[#0D0D0D] text-[#FFFF66] border-none rounded-[8px] w-9 h-9 flex items-center justify-center flex-shrink-0 hover:bg-[#1A1A1A] transition-colors disabled:opacity-60">
                {aiLoading ? <span className="w-3.5 h-3.5 border-2 border-[#FFFF66] border-t-transparent rounded-full animate-spin-slow inline-block" /> : <Send size={16} />}
              </button>
            </div>
            {aiAnswer && (
              <div className="mt-3 bg-white border-2 border-[#FFFF66] rounded-[16px] px-5 py-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#555555] mb-2.5"><Sparkles size={14} /> AI Answer</div>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
              </div>
            )}
          </div>

          {/* Section header */}
          <div className="animate-fadeUp">
            <h3 className="text-xl font-extrabold mb-1">Your Subjects</h3>
            <p className="text-sm text-[#555555]">Click a notebook to access study materials, summaries, and more</p>
          </div>

          {/* Notebooks grid */}
          <div className="grid gap-6 animate-fadeUp" style={{gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))'}}>
            {subjects.map((subject, i) => {
              const color = NOTEBOOK_COLORS[i % NOTEBOOK_COLORS.length];
              return (
                <div key={subject} className="h-[200px] flex cursor-pointer transition-transform duration-200 hover:-translate-y-1.5 hover:rotate-[-1deg] drop-shadow-sm hover:drop-shadow-md"
                  onClick={() => navigate(`/subject/${encodeURIComponent(subject)}`)}>
                  <div className="w-5 flex-shrink-0 rounded-l-[8px] border-2 border-[#0D0D0D] border-r-0" style={{background: color.spine}} />
                  <div className="flex-1 border-2 border-[#0D0D0D] rounded-r-[8px] p-3 flex flex-col relative overflow-hidden" style={{background: color.cover}}>
                    <div className="absolute inset-0 pt-9 px-2.5 pb-2.5 flex flex-col gap-3 pointer-events-none">
                      {[...Array(6)].map((_,j) => <div key={j} className="h-px bg-black/10 w-full" />)}
                    </div>
                    <div className="text-[28px] mb-2 relative z-10">{getEmoji(subject)}</div>
                    <div className="font-display text-sm font-bold text-[#0D0D0D] leading-tight relative z-10 flex-1">{subject}</div>
                    <div className="text-[11px] text-black/45 relative z-10">Click to open →</div>
                  </div>
                </div>
              );
            })}
            <div onClick={() => navigate('/profile?edit=true')}
              className="h-[200px] border-2 border-dashed border-[#999999] rounded-[16px] flex flex-col items-center justify-center cursor-pointer gap-2 text-[#999999] transition-all hover:border-[#0D0D0D] hover:text-[#0D0D0D] hover:bg-[#F9F9F9] bg-white">
              <span className="text-[28px] font-light leading-none">+</span>
              <p className="text-[13px] font-semibold">Add Subject</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
