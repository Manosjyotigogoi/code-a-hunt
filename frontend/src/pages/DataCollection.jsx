import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EDUCATION_LEVELS = ['High School', 'Undergraduate', 'Postgraduate', 'PhD', 'Diploma', 'Professional Course', 'Other'];

const COMMON_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
  'Geography', 'Computer Science', 'Python', 'Data Structures', 'Algorithms',
  'Machine Learning', 'Economics', 'Accountancy', 'Business Studies', 'Political Science',
];

export default function DataCollection() {
  const { saveEduData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    institution: '', educationLevel: '', course: '',
    semester: '', specialization: '', subjects: [], customSubject: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSubject = (sub) => setForm(f => ({
    ...f, subjects: f.subjects.includes(sub) ? f.subjects.filter(s => s !== sub) : [...f.subjects, sub]
  }));

  const addCustom = () => {
    const s = form.customSubject.trim();
    if (s && !form.subjects.includes(s)) setForm(f => ({ ...f, subjects: [...f.subjects, s], customSubject: '' }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.institution || !form.educationLevel) return setError('Please fill in all required fields.');
    }
    setError(''); setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!form.subjects.length) return setError('Please select at least one subject.');
    setLoading(true); setError('');
    try {
      await saveEduData(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    }
    setLoading(false);
  };

  const inputCls = "px-3.5 py-3 border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none focus:shadow-[0_0_0_3px_#87CEEB] transition-all w-full";

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[540px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="font-display font-extrabold text-2xl flex items-center gap-1">
            <span className="bg-[#FFFF66] text-[#0D0D0D] px-2 py-0.5 rounded-[6px]">ST</span>
            <span>AI</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border-2 border-[#0D0D0D] flex items-center justify-center text-sm font-bold transition-all ${step >= n ? 'bg-[#0D0D0D] text-[#FFFF66]' : 'bg-white text-[#555555]'}`}>{n}</div>
              {n < 2 && <div className={`w-16 h-0.5 transition-all ${step > n ? 'bg-[#0D0D0D]' : 'bg-[#E0E0E0]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-extrabold mb-1">Tell us about yourself</h1>
              <p className="text-sm text-[#555555] mb-6">This helps STAI personalise everything for you</p>

              {error && <div className="bg-[#fff0f0] border-2 border-red-300 rounded-[8px] px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold">Institution / School <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="e.g. IIT Delhi, DPS School" value={form.institution}
                    onChange={e => setForm(f => ({...f, institution: e.target.value}))} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold">Education Level <span className="text-red-400">*</span></label>
                  <select value={form.educationLevel} onChange={e => setForm(f => ({...f, educationLevel: e.target.value}))}
                    className={inputCls + ' bg-white'}>
                    <option value="">Select level…</option>
                    {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold">Course / Stream</label>
                    <input type="text" placeholder="e.g. B.Tech CSE" value={form.course}
                      onChange={e => setForm(f => ({...f, course: e.target.value}))} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold">Semester / Year</label>
                    <input type="text" placeholder="e.g. 3rd Sem" value={form.semester}
                      onChange={e => setForm(f => ({...f, semester: e.target.value}))} className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold">Specialization (optional)</label>
                  <input type="text" placeholder="e.g. AI/ML, Finance, Organic Chemistry" value={form.specialization}
                    onChange={e => setForm(f => ({...f, specialization: e.target.value}))} className={inputCls} />
                </div>
                <button onClick={handleNext}
                  className="mt-2 py-3 bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] font-display font-bold text-[15px] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.2)] transition-all">
                  Next: Choose Subjects →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-extrabold mb-1">Your subjects</h1>
              <p className="text-sm text-[#555555] mb-6">Select all the subjects you're currently studying</p>

              {error && <div className="bg-[#fff0f0] border-2 border-red-300 rounded-[8px] px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

              <div className="flex flex-wrap gap-2 mb-5">
                {COMMON_SUBJECTS.map(sub => (
                  <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                    className={`px-3 py-1.5 border-2 border-[#0D0D0D] rounded-[8px] text-xs font-medium transition-all ${form.subjects.includes(sub) ? 'bg-[#FFB6C1] font-bold' : 'bg-white hover:bg-[#F0F0F0]'}`}>
                    {form.subjects.includes(sub) ? '✓ ' : ''}{sub}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Add a custom subject…" value={form.customSubject}
                  onChange={e => setForm(f => ({...f, customSubject: e.target.value}))}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                  className="flex-1 px-3 py-2.5 border-2 border-[#E0E0E0] rounded-[8px] text-sm outline-none focus:border-[#0D0D0D] transition-colors" />
                <button type="button" onClick={addCustom}
                  className="px-4 py-2.5 bg-[#87CEEB] border-2 border-[#0D0D0D] rounded-[8px] text-sm font-semibold">
                  + Add
                </button>
              </div>

              {form.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5 p-3 bg-[#F9F9F9] rounded-[8px] border border-[#E0E0E0]">
                  {form.subjects.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#87CEEB] border-[1.5px] border-[#0D0D0D] rounded-full text-xs font-semibold">
                      {s}
                      <button type="button" onClick={() => toggleSubject(s)} className="text-sm leading-none p-0 border-0 bg-transparent cursor-pointer">×</button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-3 border-2 border-[#0D0D0D] rounded-[8px] bg-white font-semibold text-sm hover:bg-[#F0F0F0] transition-colors">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3 bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] font-display font-bold text-[15px] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.2)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? 'Saving…' : 'Go to Dashboard →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
