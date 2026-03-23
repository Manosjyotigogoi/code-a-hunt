import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Edit, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashHeader({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b-2 border-[#E0E0E0] bg-white sticky top-0 z-50">
      <h2 className="font-display text-xl font-bold text-[#0D0D0D]">{title}</h2>

      <div
        className="relative flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-[8px] border-2 border-[#E0E0E0] hover:border-[#0D0D0D] transition-colors select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="w-8 h-8 bg-[#FFB6C1] rounded-full flex items-center justify-center font-display font-bold text-sm text-[#0D0D0D] flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm font-semibold text-[#0D0D0D]">{user?.name || 'User'}</span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />

        {open && (
          <div className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white border-2 border-[#0D0D0D] rounded-[16px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.12)] animate-fadeUp">
            <div className="px-4 py-3.5 bg-[#F9F9F9] border-b border-[#E0E0E0]">
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-[#555555] mt-0.5">{user?.email}</p>
            </div>
            <button
              className="flex items-center gap-2 w-full px-4 py-[11px] bg-transparent border-none text-sm text-[#0D0D0D] text-left hover:bg-[#F9F9F9] transition-colors"
              onClick={() => { navigate('/profile'); setOpen(false); }}
            >
              <User size={14} /> My Profile
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-[11px] bg-transparent border-none text-sm text-[#0D0D0D] text-left hover:bg-[#F9F9F9] transition-colors"
              onClick={() => { navigate('/profile?edit=true'); setOpen(false); }}
            >
              <Edit size={14} /> Edit Edu Data
            </button>
            <div className="h-px bg-[#E0E0E0] my-1" />
            <button
              className="flex items-center gap-2 w-full px-4 py-[11px] bg-transparent border-none text-sm text-red-500 text-left hover:bg-[#F9F9F9] transition-colors"
              onClick={handleLogout}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
