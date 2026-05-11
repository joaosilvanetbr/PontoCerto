import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CalendarDays, BarChart3, User } from 'lucide-react';

const tabs = [
  { icon: Clock, label: 'Início', path: '/' },
  { icon: CalendarDays, label: 'Histórico', path: '/history' },
  { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="shrink-0 h-[72px] bg-app border-t border-app z-50 relative">
      <div className="flex justify-around items-center h-full">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full relative select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-8 h-0.5 bg-emerald-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <div className={isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : ''}>
                <Icon
                  size={24}
                  className={isActive ? 'text-emerald-500' : 'text-app-muted'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span
                className={`text-[11px] font-semibold tracking-wide ${
                  isActive ? 'text-emerald-500' : 'text-app-muted'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
