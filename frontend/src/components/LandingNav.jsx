import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingNav() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center px-10 h-[70px] bg-white/[0.92] backdrop-blur-xl border-b-2 border-[#0D0D0D] gap-8">
      <div
        className="flex items-center gap-0.5 cursor-pointer flex-shrink-0"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span className="bg-[#0D0D0D] text-[#FFFF66] font-display font-extrabold text-lg px-2 py-1 rounded-[6px] tracking-wide">ST</span>
        <span className="font-display font-extrabold text-xl text-[#0D0D0D] tracking-tight">AI</span>
      </div>

      <div className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-2 ml-auto absolute md:static top-[70px] left-0 right-0 bg-white md:bg-transparent border-b-2 md:border-0 border-[#0D0D0D] p-4 md:p-0`}>
        <button onClick={() => scrollTo('features')} className="bg-transparent border-none font-body text-[15px] font-medium text-[#0D0D0D] px-4 py-2 rounded-[8px] hover:bg-[#87CEEB] transition-colors">Features</button>
        <button onClick={() => scrollTo('how')} className="bg-transparent border-none font-body text-[15px] font-medium text-[#0D0D0D] px-4 py-2 rounded-[8px] hover:bg-[#87CEEB] transition-colors">How it works</button>
        <button onClick={() => scrollTo('contact')} className="bg-transparent border-none font-body text-[15px] font-medium text-[#0D0D0D] px-4 py-2 rounded-[8px] hover:bg-[#87CEEB] transition-colors">Contact</button>
      </div>

      <div className="hidden md:flex gap-2.5 ml-auto">
        <button
          className="bg-transparent border-2 border-[#0D0D0D] text-sm font-semibold px-5 py-2 rounded-[8px] hover:bg-[#F0F0F0] transition-colors text-[#0D0D0D]"
          onClick={() => navigate('/login')}
        >Login</button>
        <button
          className="bg-[#0D0D0D] text-[#FFFF66] border-2 border-[#0D0D0D] text-sm font-semibold px-5 py-2 rounded-[8px] hover:bg-[#1A1A1A] transition-colors"
          onClick={() => navigate('/register')}
        >Register</button>
      </div>

      <button
        className="md:hidden flex flex-col gap-[5px] bg-transparent border-none p-2 ml-auto"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className="block w-[22px] h-0.5 bg-[#0D0D0D] rounded-sm transition-all" />
        <span className="block w-[22px] h-0.5 bg-[#0D0D0D] rounded-sm transition-all" />
        <span className="block w-[22px] h-0.5 bg-[#0D0D0D] rounded-sm transition-all" />
      </button>
    </nav>
  );
}
