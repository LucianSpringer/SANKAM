import React from 'react';
import { UserProfile } from '../types';

interface SidebarProps {
  activePage: 'practice' | 'profile';
  onNavigate: (page: 'practice' | 'profile') => void;
  userProfile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, userProfile }) => {
  const menuItems = [
    {
      id: 'practice',
      label: 'Practice',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="w-full md:w-64 h-auto md:h-full min-h-[60px] bg-slate-900/90 md:bg-slate-900/50 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/10 flex flex-row md:flex-col flex-shrink-0 z-50 md:z-30 justify-around md:justify-start pb-1 md:pb-0">
      {/* Branding / Logo (Hidden on mobile bottom bar) */}
      <div className="hidden md:flex h-20 items-center justify-center md:justify-start md:px-6 border-b border-white/5">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shadow-lg shadow-indigo-500/20 bg-slate-800 flex-shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1536590158209-e9d615d525e4?auto=format&fit=crop&w=150&q=80" 
            alt="Sankam Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-200">Sankam</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">AI Tutor</p>
        </div>
      </div>

      {/* Menu List (Horizontal on mobile, Vertical on desktop) */}
      <div className="flex-1 flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start gap-0 md:gap-2 px-2 md:px-4 py-2 md:py-6">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as 'practice' | 'profile')}
              className={`relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-2 md:py-3 rounded-xl transition-all duration-200 group flex-1 md:flex-none ${
                isActive 
                  ? 'bg-transparent md:bg-gradient-to-r md:from-sky-600/20 md:to-indigo-600/20 text-sky-400 md:text-sky-100 shadow-none md:shadow-[0_0_20px_rgba(14,165,233,0.15)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Border (Desktop only) */}
              {isActive && (
                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
              )}
              
              {/* Active Indicator Dot (Mobile only) */}
               {isActive && (
                <div className="md:hidden absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-sky-400 rounded-b-full shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
              )}

              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] md:text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer / User Card (Hidden on mobile bottom bar) */}
      <div className="hidden md:block p-4 border-t border-white/5">
        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-white/5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                 <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{userProfile.name}</p>
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;