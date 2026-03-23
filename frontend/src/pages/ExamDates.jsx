import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashHeader from '../components/DashHeader';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Tiny UUID fallback (browser has crypto.randomUUID)
const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2);

export default function ExamDates() {
  const { eduData } = useAuth();
  const subjects = eduData?.subjects || [];
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ subject: subjects[0] || '', date: '', time: '', duration: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/exams')
      .then(({ data }) => setExams(data.exams || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveExams = async (updated) => {
    setSaving(true);
    try {
      await api.post('/exams', { exams: updated });
    } catch {}
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!form.subject || !form.date) return;
    const newExam = { id: newId(), ...form, createdAt: new Date().toISOString() };
    const updated = [...exams, newExam].sort((a, b) => new Date(a.date) - new Date(b.date));
    setExams(updated);
    setForm({ subject: subjects[0] || '', date: '', time: '', duration: '', notes: '' });
    setShowForm(false);
    await saveExams(updated);
  };

  const handleDelete = async (id) => {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    await saveExams(updated);
  };

  const today = new Date();
  const upcoming = exams.filter((e) => new Date(e.date) >= today);
  const past = exams.filter((e) => new Date(e.date) < today);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const daysLeft = (d) => Math.ceil((new Date(d) - today) / 86400000);

  const inputCls = 'px-3.5 py-2.5 border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none focus:shadow-[0_0_0_3px_#87CEEB] transition-all w-full bg-white';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9]">
        <DashHeader title="Exam Dates" />
        <div className="p-8 flex flex-col gap-6 flex-1 max-md:p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#555555]">
              {upcoming.length} upcoming exam{upcoming.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-5 py-2.5 bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] text-sm font-bold font-display hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(0,0,0,0.2)] transition-all"
            >
              + Add Exam
            </button>
          </div>

          {showForm && (
            <div className="bg-white border-2 border-[#0D0D0D] rounded-[24px] p-6 animate-fadeUp">
              <h3 className="text-[17px] font-extrabold mb-4">New Exam</h3>
              <div className="grid grid-cols-2 gap-3 mb-3 max-md:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold">Subject *</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className={inputCls}
                  >
                    {subjects.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                    {subjects.length === 0 && <option>Add subjects in Profile first</option>}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold">Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 hours"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2 max-md:col-span-1">
                  <label className="text-[13px] font-semibold">Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204, bring calculator"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border-2 border-[#0D0D0D] rounded-[8px] bg-white text-sm font-semibold hover:bg-[#F0F0F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!form.subject || !form.date}
                  className="flex-1 py-2.5 bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] rounded-[8px] text-sm font-bold font-display disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Exam'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-[#555555] text-sm">Loading exams...</div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-bold mb-3 text-[#555555] uppercase tracking-wider text-xs">Upcoming</h3>
                  <div className="flex flex-col gap-3">
                    {upcoming.map((exam) => {
                      const dl = daysLeft(exam.date);
                      const urgency = dl <= 3 ? '#FFB6C1' : dl <= 7 ? '#FFFF66' : '#87CEEB';
                      return (
                        <div
                          key={exam.id}
                          className="bg-white border-2 border-[#0D0D0D] rounded-[16px] p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0D0D0D] transition-all"
                        >
                          <div
                            className="w-14 h-14 rounded-[12px] border-2 border-[#0D0D0D] flex flex-col items-center justify-center flex-shrink-0"
                            style={{ background: urgency }}
                          >
                            <span className="font-display text-xl font-extrabold leading-none">{dl}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wide">day{dl !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-[15px]">{exam.subject}</h4>
                            <p className="text-sm text-[#555555]">
                              {formatDate(exam.date)}
                              {exam.time ? ` at ${exam.time}` : ''}
                              {exam.duration ? ` - ${exam.duration}` : ''}
                            </p>
                            {exam.notes && <p className="text-xs text-[#777777] mt-0.5">{exam.notes}</p>}
                          </div>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="text-[#999999] hover:text-red-500 transition-colors text-lg p-1"
                          >
                            x
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {past.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-bold mb-3 text-[#555555] uppercase tracking-wider text-xs">Past</h3>
                  <div className="flex flex-col gap-2">
                    {past.map((exam) => (
                      <div
                        key={exam.id}
                        className="bg-white border-2 border-[#E0E0E0] rounded-[12px] p-4 flex items-center gap-3 opacity-60"
                      >
                        <div className="w-10 h-10 rounded-[8px] bg-[#E0E0E0] border-2 border-[#CCCCCC] flex items-center justify-center text-sm">
                          OK
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{exam.subject}</h4>
                          <p className="text-xs text-[#555555]">{formatDate(exam.date)}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="text-[#CCCCCC] hover:text-red-400 transition-colors text-lg p-1"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exams.length === 0 && !showForm && (
                <div className="text-center py-20 flex flex-col items-center gap-3">
                  <span className="text-5xl">[ ]</span>
                  <p className="text-[15px] text-[#555555]">No exam dates added yet. Click "+ Add Exam" to get started.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
