import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNav from '../components/LandingNav';
import api from '../utils/api';

const features = [
  { icon: '📚', color: '#FFB6C1', title: 'Smart Study Materials', desc: 'Upload PDFs, paste YouTube links, or add any resource. Get AI-generated summaries and key insights instantly.' },
  { icon: '❓', color: '#FFFF66', title: 'Practice Question Generator', desc: 'Generate MCQs, short answers, and essay questions tailored to your notes and difficulty level.' },
  { icon: '📅', color: '#87CEEB', title: 'Personalized Timetables', desc: 'Enter your exam dates and subjects. STAI builds an optimal study schedule just for you.' },
  { icon: '📈', color: '#FFB6C1', title: 'Growth Analysis', desc: "Track your progress across subjects. Visual insights show where you're improving and where to focus." },
  { icon: '🎯', color: '#FFFF66', title: 'Adaptive Learning', desc: 'The more you use STAI, the smarter it gets about your learning patterns and preferences.' },
  { icon: '💬', color: '#87CEEB', title: 'Ask Anything', desc: 'Have a study doubt? Ask STAI directly. Get detailed, curriculum-aware explanations instantly.' },
];

const steps = [
  { num: '01', title: 'Create your account', desc: 'Sign up in seconds. No credit card needed.' },
  { num: '02', title: 'Enter your course details', desc: 'Tell us your subjects, level, and exam schedule.' },
  { num: '03', title: 'Upload your materials', desc: 'Add PDFs, YouTube links, or any study resource.' },
  { num: '04', title: 'Let AI do the magic', desc: 'Get summaries, questions, and a study plan instantly.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState(''); // '' | 'sending' | 'success' | 'error:...'

  const contactLoading = contactStatus === 'sending';

  const handleContact = async (e) => {
    e.preventDefault();
    setContactStatus('sending');
    try {
      await api.post('/contact', contactForm);
      setContactStatus('success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      setContactStatus(`error:${err.message || 'Failed to send. Please try again.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-10 pt-[100px] pb-16 relative overflow-hidden max-md:px-6 max-md:pt-[120px]">
        <div className="absolute top-20 left-16 w-[300px] h-[300px] bg-[#FFB6C1] rounded-full opacity-25 animate-float" />
        <div className="absolute bottom-16 right-20 w-[200px] h-[200px] bg-[#87CEEB] rounded-full opacity-25 animate-floatAlt" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFFF66] rounded-full opacity-[0.08] pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 bg-[#0D0D0D] text-[#FFFF66] text-[13px] font-semibold px-4 py-1.5 rounded-full mb-7 animate-fadeUp tracking-wide z-10">
          <span>✨</span> AI-Powered Study Assistant
        </div>

        <h1 className="text-[clamp(52px,8vw,96px)] font-extrabold leading-[1.05] text-[#0D0D0D] mb-6 fade-up delay-1 z-10">
          Study <span className="bg-[#FFB6C1] px-3 rounded-[8px] inline-block">Smarter</span>,<br />
          not <span className="bg-[#FFFF66] px-3 rounded-[8px] inline-block">Harder</span>
        </h1>

        <p className="text-lg text-[#555555] max-w-[560px] mb-10 leading-[1.7] fade-up delay-2 z-10">
          STAI analyzes your learning patterns, generates practice questions from your notes,
          and builds personalized study schedules — all powered by AI.
        </p>

        <div className="flex gap-3 flex-wrap justify-center mb-12 fade-up delay-3 z-10">
          <button onClick={() => navigate('/register')}
            className="bg-[#0D0D0D] text-[#FFFF66] text-base font-bold px-8 py-3.5 border-2 border-[#0D0D0D] rounded-[8px] font-display hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0D0D0D] transition-all">
            Get Started Free →
          </button>
          <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-transparent text-[#0D0D0D] text-base font-semibold px-8 py-3.5 border-2 border-[#0D0D0D] rounded-[8px] hover:bg-[#F0F0F0] transition-colors">
            See how it works
          </button>
        </div>

        <div className="flex items-center gap-8 fade-up delay-4 flex-wrap justify-center z-10">
          {[{ val: '10K+', label: 'Students' }, { val: '50K+', label: 'Questions Generated' }, { val: '95%', label: 'Satisfaction Rate' }].map(({ val, label }, i) => (
            <div key={label} className="flex items-center gap-8">
              {i > 0 && <div className="w-px h-10 bg-[#E0E0E0]" />}
              <div className="flex flex-col items-center">
                <strong className="font-display text-[28px] font-extrabold">{val}</strong>
                <span className="text-[13px] text-[#555555]">{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Floating cards */}
        <div className="absolute left-[5%] top-[35%] flex items-center gap-2.5 bg-white border-2 border-[#0D0D0D] rounded-[16px] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.12)] text-[13px] whitespace-nowrap animate-float max-lg:hidden">
          <span className="text-2xl">📊</span>
          <div><p className="text-[#555555] text-[11px]">Growth Score</p><strong className="font-bold text-sm">+34% this week</strong></div>
        </div>
        <div className="absolute right-[5%] bottom-[25%] flex items-center gap-2.5 bg-white border-2 border-[#0D0D0D] rounded-[16px] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.12)] text-[13px] whitespace-nowrap animate-floatAlt max-lg:hidden">
          <span className="text-2xl">🎯</span>
          <div><p className="text-[#555555] text-[11px]">Practice Questions</p><strong className="font-bold text-sm">128 completed</strong></div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {['Study AI', 'Practice Questions', 'Smart Schedules', 'Growth Tracking', 'PDF Analysis', 'Exam Prep', 'Study AI', 'Practice Questions', 'Smart Schedules', 'Growth Tracking', 'PDF Analysis', 'Exam Prep'].map((t, i) => (
            <span key={i} className="marquee-item">{t}</span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 px-10 max-w-[1200px] mx-auto text-center max-md:px-6">
        <div className="inline-block bg-[#87CEEB] text-xs font-bold tracking-[1.5px] uppercase px-3.5 py-1 rounded-full text-[#0D0D0D] mb-4 border-2 border-[#0D0D0D]">What we offer</div>
        <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold mb-3">Everything you need to ace your exams</h2>
        <p className="text-[#555555] text-[17px] mb-14">Six powerful features designed around your study habits</p>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {features.map((f, i) => (
            <div key={i} className="bg-white border-2 border-[#0D0D0D] rounded-[24px] px-7 py-8 text-left relative overflow-hidden hover:-translate-y-1 hover:shadow-[6px_6px_0_#0D0D0D] transition-all">
              <div className="absolute top-0 left-0 right-0 h-[5px]" style={{ background: f.color }} />
              <div className="text-[32px] mb-4 inline-block p-2.5 rounded-[8px] border-2 border-[#0D0D0D]" style={{ background: f.color }}>{f.icon}</div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-[#555555] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[#0D0D0D] py-24 px-10 grid gap-20 items-center max-lg:grid-cols-1 max-lg:gap-12" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="max-w-[520px]">
          <div className="inline-block bg-[#FFFF66] text-xs font-bold tracking-[1.5px] uppercase px-3.5 py-1 rounded-full text-[#0D0D0D] mb-4 border-2 border-[#0D0D0D]">Simple process</div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold text-white mb-12">Up and running in 4 steps</h2>
          <div className="flex flex-col gap-7">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="font-display text-[28px] font-extrabold text-[#FFFF66] flex-shrink-0 w-11">{s.num}</div>
                <div>
                  <h3 className="text-[17px] font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-white/55">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center max-lg:hidden">
          <div className="bg-white border-2 border-white/20 rounded-[24px] w-[360px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5)] animate-float">
            <div className="bg-[#F0F0F0] px-4 py-3 flex items-center gap-1.5 border-b border-[#E0E0E0]">
              {['#ff6b6b', '#ffd93d', '#6bcb77'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
              <span className="text-xs font-semibold text-[#555555] ml-2">STAI Dashboard</span>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {[['📗', 'Mathematics'], ['📘', 'Physics'], ['📙', 'Python']].map(([em, sub]) => (
                <div key={sub} className="flex items-center gap-2.5 px-3.5 py-3 border-2 border-[#E0E0E0] rounded-[8px] text-sm font-semibold hover:bg-[#FFB6C1] hover:border-[#0D0D0D] transition-all">
                  <span>{em}</span> {sub}
                </div>
              ))}
              <div className="bg-[#FFFACD] border-2 border-[#FFFF66] rounded-[8px] p-3.5 mt-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#555555] mb-2">AI Summary</p>
                {[100, 80, 60].map(w => <div key={w} className="h-2 bg-[#E0E0E0] rounded mb-1.5" style={{ width: `${w}%` }} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FFB6C1] border-t-2 border-b-2 border-[#0D0D0D] py-20 px-10 text-center">
        <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold mb-3">Ready to transform how you study?</h2>
        <p className="text-[17px] text-[#0D0D0D] opacity-75 mb-8">Join thousands of students already using STAI to study smarter.</p>
        <button onClick={() => navigate('/register')}
          className="bg-[#0D0D0D] text-[#FFFF66] font-display text-base font-bold px-9 py-3.5 border-2 border-[#0D0D0D] rounded-[8px] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0D0D0D] transition-all">
          Start for Free →
        </button>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-10 max-w-[1000px] mx-auto text-center max-md:px-6">
        <div className="inline-block bg-[#FFB6C1] text-xs font-bold tracking-[1.5px] uppercase px-3.5 py-1 rounded-full text-[#0D0D0D] mb-4 border-2 border-[#0D0D0D]">Get in touch</div>
        <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold mb-12">Contact us</h2>

        <div className="grid gap-12 text-left mt-12 max-md:grid-cols-1" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
          <div className="flex flex-col gap-6">
            {[{ icon: '📧', label: 'Email', val: 'support@stai.app' }, { icon: '🐦', label: 'Twitter', val: '@stai_app' }, { icon: '📍', label: 'Location', val: 'India 🇮🇳' }].map(({ icon, label, val }) => (
              <div key={label} className="flex items-center gap-3.5">
                <span className="text-2xl bg-[#87CEEB] p-3 rounded-[8px] border-2 border-[#0D0D0D]">{icon}</span>
                <div><strong className="block text-sm font-bold">{label}</strong><p className="text-sm text-[#555555]">{val}</p></div>
              </div>
            ))}
          </div>

          <form className="flex flex-col gap-3.5" onSubmit={handleContact}>
            {contactStatus === 'success' && (
              <div className="bg-[#f0fdf4] border-2 border-[#bbf7d0] rounded-[8px] px-3.5 py-2.5 text-sm text-[#2d8a4e] font-semibold">
                ✓ Message sent! We'll get back to you shortly.
              </div>
            )}
            {contactStatus.startsWith('error:') && (
              <div className="bg-[#fff0f0] border-2 border-red-400 rounded-[8px] px-3.5 py-2.5 text-sm text-red-700">
                {contactStatus.replace('error:', '')}
              </div>
            )}
            <input type="text" placeholder="Your name" required value={contactForm.name}
              onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
              className="px-4 py-3 border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none focus:border-[#5BB8D4] focus:shadow-[0_0_0_3px_#87CEEB] transition-all bg-white" />
            <input type="email" placeholder="Your email" required value={contactForm.email}
              onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
              className="px-4 py-3 border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none focus:border-[#5BB8D4] focus:shadow-[0_0_0_3px_#87CEEB] transition-all bg-white" />
            <textarea placeholder="Your message" rows={4} required value={contactForm.message}
              onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
              className="px-4 py-3 border-2 border-[#0D0D0D] rounded-[8px] text-sm outline-none resize-vertical focus:border-[#5BB8D4] focus:shadow-[0_0_0_3px_#87CEEB] transition-all bg-white" />
            <button type="submit" disabled={contactLoading}
              className="bg-[#0D0D0D] text-[#FFFF66] font-display text-[15px] font-bold px-7 py-3.5 border-2 border-[#0D0D0D] rounded-[8px] self-start hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition-all disabled:opacity-60">
              {contactLoading ? 'Sending...' : 'Send Message →'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D0D0D] text-white px-10 py-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1 font-display font-extrabold text-lg">
          <span className="bg-[#FFFF66] text-[#0D0D0D] px-[7px] py-[3px] rounded-[5px]">ST</span>
          <span>AI</span>
        </div>
        <p className="text-[13px] text-white/50">© 2025 STAI. Built with ❤️ for students everywhere.</p>
        <div className="flex gap-5">
          {['Privacy', 'Terms', 'Help'].map(l => (
            <a key={l} href="#" className="text-[13px] text-white/50 hover:text-[#FFFF66] transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}