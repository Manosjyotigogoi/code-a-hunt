import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashHeader from '../components/DashHeader';
import { useAuth } from '../context/AuthContext';
import { recommendMaterials } from '../utils/ai';
import { ExternalLink } from 'lucide-react';

const TYPE_COLORS = { book: '#FFB6C1', video: '#87CEEB', website: '#FFFF66', practice: '#c8f7c5' };
const TYPE_ICONS = { book: '📚', video: '🎥', website: '🌐', practice: '✏️' };

export default function StudyMaterials() {
  const { eduData } = useAuth();
  const subjects = eduData?.subjects || [];
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [weakAreas, setWeakAreas] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    if (!selectedSubject) return;
    setLoading(true); setMaterials([]);
    try {
      const result = await recommendMaterials(selectedSubject, eduData?.educationLevel || 'general', weakAreas);
      setMaterials(result.materials || []);
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to fetch materials.';
      alert(`Could not fetch study materials: ${message}`);
      setMaterials([]);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        <DashHeader title="Study Materials" />
        <div className="p-8 flex flex-col gap-7 flex-1 max-md:p-4">

          <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] p-8 animate-fadeUp">
            <h2 className="text-[22px] font-extrabold mb-1.5">Get AI-Recommended Study Materials</h2>
            <p className="text-sm text-[#555555] mb-6">Tell us your subject and weak areas — STAI will find the best resources for you.</p>

            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                <label className="text-[13px] font-semibold">Subject</label>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                  className="px-3.5 py-[11px] border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none bg-white focus:shadow-[0_0_0_3px_#87CEEB] transition-all">
                  {subjects.map(s => <option key={s}>{s}</option>)}
                  {subjects.length === 0 && <option>Add subjects in profile first</option>}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                <label className="text-[13px] font-semibold">Weak areas (optional)</label>
                <input type="text" placeholder="e.g. Integration, Thermodynamics, Recursion" value={weakAreas} onChange={e => setWeakAreas(e.target.value)}
                  className="px-3.5 py-[11px] border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none bg-white focus:shadow-[0_0_0_3px_#87CEEB] transition-all" />
              </div>
              <button onClick={handleRecommend} disabled={loading || !selectedSubject}
                className="px-6 py-[11px] bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] font-display text-sm font-bold whitespace-nowrap hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed h-fit">
                {loading ? 'Finding materials…' : '🔍 Find Materials'}
              </button>
            </div>
          </div>

          {materials.length > 0 && (
            <div className="grid gap-5 animate-fadeUp" style={{gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))'}}>
              {materials.map((m, i) => (
                <div key={i} className="bg-white border-2 border-[#0D0D0D] rounded-[16px] p-5 relative overflow-hidden transition-all hover:-translate-y-[3px] hover:shadow-[5px_5px_0_#0D0D0D]"
                  style={{'--tw-before-content': `''`}}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{background: TYPE_COLORS[m.type] || '#FFB6C1'}} />
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl p-1.5 rounded-[8px] border-[1.5px] border-[#0D0D0D]" style={{background: TYPE_COLORS[m.type] || '#FFB6C1'}}>{TYPE_ICONS[m.type] || '📖'}</span>
                    <span className="text-[11px] font-bold tracking-widest text-[#555555]">{m.type?.toUpperCase()}</span>
                  </div>
                  <h4 className="text-[15px] font-bold mb-2 leading-snug">{m.title}</h4>
                  <p className="text-[13px] text-[#555555] leading-relaxed mb-3.5">{m.description}</p>
                  {m.url && m.url !== '#' && (
                    <a href={m.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0D0D0D] underline hover:opacity-70 transition-opacity">
                      Visit Resource <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && materials.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center gap-3">
              <span className="text-5xl">📚</span>
              <p className="text-[15px] text-[#555555]">Select a subject and click "Find Materials" to get AI-curated recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
