import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'sankam_streak_v1';
const GOAL_SECONDS = 300; // 5 minutes

interface StreakData {
  lastLogDate: string;
  streakCount: number;
  todaySeconds: number;
}

const getTodayString = () => new Date().toISOString().split('T')[0];
const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

export default function StreakStatus({ isSpeaking }: { isSpeaking: boolean }) {
  const [streak, setStreak] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [goalMet, setGoalMet] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (stored) {
      try {
        const data: StreakData = JSON.parse(stored);
        if (data.lastLogDate === today) {
          // Restore today's progress
          setStreak(data.streakCount);
          setSeconds(data.todaySeconds);
          setGoalMet(data.todaySeconds >= GOAL_SECONDS);
        } else if (data.lastLogDate === yesterday) {
          // User logged in yesterday. Check if they met the goal.
          if (data.todaySeconds >= GOAL_SECONDS) {
             // Goal met yesterday, keep streak
             setStreak(data.streakCount);
          } else {
             // Goal not met yesterday, reset streak
             setStreak(0);
          }
          // Reset today's counters
          setSeconds(0);
          setGoalMet(false);
        } else {
          // Missed a day or more
          setStreak(0);
          setSeconds(0);
          setGoalMet(false);
        }
      } catch (e) {
        console.error("Failed to parse streak data", e);
        setStreak(0);
        setSeconds(0);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const data: StreakData = {
      lastLogDate: getTodayString(),
      streakCount: streak,
      todaySeconds: seconds
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [streak, seconds, loaded]);

  useEffect(() => {
    let interval: number;
    if (isSpeaking) {
      interval = window.setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          // Check if we just crossed the threshold
          if (prev < GOAL_SECONDS && next >= GOAL_SECONDS) {
             setGoalMet(true);
             setStreak(s => s + 1);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Calculations for Ring
  const progress = Math.min(seconds / GOAL_SECONDS, 1);
  // Radius 15.5 keeps the 3px stroke fully within the 36px viewbox (18 center + 15.5 radius + 1.5 half-stroke = 35)
  const radius = 15.5; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="group relative flex items-center gap-3 bg-slate-800/50 backdrop-blur-md rounded-full pl-2 pr-4 py-1.5 border border-white/5 hover:border-white/10 transition-all cursor-help select-none shadow-lg shadow-black/20">
       {/* Tooltip */}
       <div className="absolute top-full right-0 mt-3 w-48 p-3 bg-slate-900 rounded-xl border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 translate-y-2 group-hover:translate-y-0 duration-200">
          <p className="text-xs text-slate-400 font-medium mb-2">Daily Goal: Speak 5 mins</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
             <div className={`h-full transition-all duration-300 ${goalMet ? 'bg-emerald-400' : 'bg-gradient-to-r from-orange-500 to-red-500'}`} style={{ width: `${progress * 100}%` }}></div>
          </div>
          <div className="flex justify-between">
             <span className="text-[10px] text-slate-500 font-mono">{mins}m {secs}s</span>
             <span className="text-[10px] text-slate-500 font-mono">5m</span>
          </div>
          {goalMet && <p className="text-xs text-emerald-400 mt-2 font-bold text-center animate-pulse">Goal Met! Keep it up! 🔥</p>}
       </div>

       <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
          {/* Background Ring */}
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-slate-700"
            />
            <circle
              cx="18"
              cy="18"
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-500 ${goalMet ? 'text-emerald-500' : 'text-orange-500'}`}
            />
          </svg>
          
          {/* Flame Icon */}
          <div className={`absolute inset-0 flex items-center justify-center transition-colors ${goalMet ? 'text-emerald-400' : (streak > 0 || seconds > 0) ? 'text-orange-500' : 'text-slate-500'}`}>
             <svg className={`w-5 h-5 ${isSpeaking ? 'animate-pulse filter drop-shadow-lg' : ''}`} viewBox="0 0 24 24" fill="currentColor">
               <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
             </svg>
          </div>
       </div>

       <div className="flex flex-col items-start justify-center">
          <span className={`text-sm font-bold leading-none ${goalMet ? 'text-emerald-400' : 'text-slate-200'}`}>{streak}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5 whitespace-nowrap">Day Streak</span>
       </div>
    </div>
  );
}