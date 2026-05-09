import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Brain, Calendar, Clock, TrendingUp, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Using Brain icon for Quiz — lucide has no "quiz" icon, Brain fits well
// ClipboardQuestion may not exist in older lucide — fallback below

const navItems = [
  { to: '/dashboard',   icon: Home,       label: 'Dashboard', end: true },
  { to: '/materials',   icon: BookOpen,   label: 'Study Materials' },
  { to: '/quiz',        icon: Brain,      label: 'Quiz', badge: 'NEW AI' },
  { to: '/timetable',   icon: Calendar,   label: 'Timetable' },
  { to: '/exam-dates',  icon: Clock,      label: 'Exam Dates' },
  { to: '/growth',      icon: TrendingUp, label: 'Growth Analysis' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[#0D0D0D] px-4 py-6 overflow-y-auto">
      {/* Logo */}
      <NavLink to="/dashboard" className="flex items-center gap-1 mb-9 px-2 no-underline">
        <span className="bg-[#FFFF66] text-[#0D0D0D] font-display font-extrabold text-base px-[7px] py-[3px] rounded-[5px]">ST</span>
        <span className="font-display font-extrabold text-lg text-white">AI</span>
      </NavLink>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150 no-underline ${
                isActive
                  ? 'bg-[#FFFF66] text-[#0D0D0D] font-semibold'
                  : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="text-[9px] font-extrabold bg-[#FFB6C1] text-[#0D0D0D] px-1.5 py-0.5 rounded-full leading-tight">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col gap-2 mt-4">
        <div className="bg-white/[0.06] border border-white/10 rounded-[14px] p-3.5 mb-1">
          <span className="text-lg block mb-1">🤖</span>
          <p className="text-[11px] text-white/45 leading-relaxed">
            Take a <strong className="text-white/60">Quiz</strong> to personalise your AI timetable predictions!
          </p>
        </div>

        <NavLink to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm font-medium no-underline transition-all ${
              isActive ? 'bg-[#FFFF66] text-[#0D0D0D]' : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
            }`
          }>
          <div className="w-6 h-6 bg-[#FFB6C1] rounded-full flex items-center justify-center text-[#0D0D0D] font-bold text-[11px] flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="truncate flex-1">{user?.name || 'Profile'}</span>
          <User size={13} className="flex-shrink-0 opacity-50" />
        </NavLink>

        <button onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm font-medium text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all bg-transparent border-none cursor-pointer w-full text-left">
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
