
import React, { useState, useEffect } from 'react';
import { UserProfile, UserPreferences, LanguageConfig, PracticeSession } from '../types';
import SelectionModal from './SelectionModal';
import EditProfileModal from './EditProfileModal';
import { sessionRepository } from '../utils/history-service';
import { aggregateStats } from '../utils/analytics-engine';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  userPreferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
  availableLanguages: LanguageConfig[];
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  userProfile, 
  onUpdateProfile,
  userPreferences,
  onUpdatePreferences,
  availableLanguages
}) => {
  
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [statsData, setStatsData] = useState({
      totalSessions: 0,
      timeSpoken: '0.0',
      wordsLearned: 0,
      fluencyScore: 0
  });

  // Load history when tab changes or on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingHistory(true);
      const data = await sessionRepository.getHistory();
      setHistory(data);
      
      // Calculate Analytics
      const agg = aggregateStats(data);
      setStatsData({
          totalSessions: agg.totalSessions,
          timeSpoken: agg.totalTimeHours,
          wordsLearned: agg.totalWords,
          fluencyScore: agg.fluencyScore
      });
      
      setIsLoadingHistory(false);
    };
    loadData();
  }, [activeTab]);

  // Options Configuration
  const goalOptions = [
    { label: 'Casual (5 mins)', value: 5, description: 'Good for maintaining basics.' },
    { label: 'Regular (15 mins)', value: 15, description: 'Recommended for steady progress.' },
    { label: 'Serious (30 mins)', value: 30, description: 'Accelerated learning path.' },
    { label: 'Hardcore (60 mins)', value: 60, description: 'Intensive immersion.' },
  ];

  const voiceOptions = [
    { label: 'Journey (Male)', value: 'Journey' },
    { label: 'Dan (Male)', value: 'Dan' },
    { label: 'Aoede (Female)', value: 'Aoede' },
    { label: 'Kore (Female)', value: 'Kore' },
  ];

  const correctionOptions = [
    { label: 'Gentle', value: 'Gentle', description: 'Only major errors are flagged.' },
    { label: 'Standard', value: 'Standard', description: 'Grammar and key pronunciation checks.' },
    { label: 'Strict', value: 'Strict', description: 'Every minor mistake is corrected.' },
  ];

  const languageOptions = availableLanguages.map(l => ({
    label: l.name,
    value: l.code
  }));

  // Helpers to get display labels
  const getLanguageLabel = () => availableLanguages.find(l => l.code === userPreferences.targetLanguageCode)?.name || 'Unknown';
  const getGoalLabel = () => goalOptions.find(g => g.value === userPreferences.dailyGoalMinutes)?.label;

  const stats = [
    { 
        label: 'Fluency Score', 
        value: `${statsData.fluencyScore}/100`, 
        icon: '🔥', 
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20'
    },
    { 
        label: 'Time Spoken (Hrs)', 
        value: statsData.timeSpoken, 
        icon: '⏱️', 
        color: 'text-sky-400',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/20'
    },
    { 
        label: 'Est. Words Spoken', 
        value: statsData.wordsLearned.toLocaleString(), 
        icon: '🧠', 
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20'
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => setIsEditProfileOpen(true)}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-200 blur"></div>
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-slate-900 bg-slate-800 ring-2 ring-transparent group-hover:ring-sky-500/50 transition-all duration-300">
                  <img 
                      src={userProfile.avatarUrl} 
                      alt="User Avatar" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Edit Overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <svg className="w-8 h-8 text-white drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                  </div>
              </div>
          </div>
          <div className="flex flex-col items-center md:items-start">
              <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                  {userProfile.name}
                  <button 
                    onClick={() => setIsEditProfileOpen(true)}
                    className="text-slate-500 hover:text-sky-400 transition-colors p-1"
                    title="Edit Profile"
                  >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                  </button>
              </h2>
              <p className="text-slate-400">Level 4 • Intermediate Scholar</p>
          </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-800/80 rounded-xl border border-white/10 backdrop-blur-sm">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
               activeTab === 'overview' 
               ? 'bg-slate-700 text-white shadow-lg' 
               : 'text-slate-400 hover:text-white hover:bg-white/5'
             }`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
               activeTab === 'history' 
               ? 'bg-slate-700 text-white shadow-lg' 
               : 'text-slate-400 hover:text-white hover:bg-white/5'
             }`}
           >
             History
           </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                {stats.map((stat, index) => (
                    <div 
                        key={index} 
                        className={`p-6 rounded-2xl border backdrop-blur-md flex items-center gap-4 transition-all hover:scale-[1.02] ${stat.bg} ${stat.border}`}
                    >
                        <div className="text-3xl">{stat.icon}</div>
                        <div>
                            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Settings Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Preferences
                    </h3>
                </div>
                <div className="divide-y divide-white/5">
                    
                    {/* Target Language */}
                    <div 
                        onClick={() => setActiveModal('language')}
                        className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        <span className="text-slate-300 font-medium">Target Language</span>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-sm group-hover:text-white transition-colors">
                                {getLanguageLabel()}
                            </span>
                            <svg className="w-4 h-4 text-slate-600 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Daily Goal */}
                    <div 
                        onClick={() => setActiveModal('goal')}
                        className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        <span className="text-slate-300 font-medium">Daily Goal</span>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-sm group-hover:text-white transition-colors">
                                {getGoalLabel()}
                            </span>
                            <svg className="w-4 h-4 text-slate-600 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Voice Preference */}
                    <div 
                        onClick={() => setActiveModal('voice')}
                        className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        <span className="text-slate-300 font-medium">Voice Preference</span>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-sm group-hover:text-white transition-colors">
                                {userPreferences.voiceName}
                            </span>
                            <svg className="w-4 h-4 text-slate-600 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Correction Level */}
                    <div 
                        onClick={() => setActiveModal('correction')}
                        className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        <span className="text-slate-300 font-medium">Correction Level</span>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-sm group-hover:text-white transition-colors">
                                {userPreferences.correctionLevel}
                            </span>
                            <svg className="w-4 h-4 text-slate-600 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Notifications Toggle */}
                    <div 
                        onClick={() => onUpdatePreferences({...userPreferences, notificationsEnabled: !userPreferences.notificationsEnabled})}
                        className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <span className="text-slate-300 font-medium">Notification Settings</span>
                        <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${userPreferences.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${userPreferences.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                </div>
            </div>
            
            <div className="mt-8 text-center">
                <button className="text-red-400 text-sm hover:text-red-300 transition-colors font-medium">
                    Log Out
                </button>
            </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Recent Practice Sessions</h3>
                {history.length > 0 && (
                    <button 
                        onClick={async () => {
                            if (window.confirm('Are you sure you want to clear your history?')) {
                                await sessionRepository.clearHistory();
                                setHistory([]);
                                setStatsData({ totalSessions: 0, timeSpoken: '0.0', wordsLearned: 0, fluencyScore: 0 });
                            }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                        Clear History
                    </button>
                )}
            </div>

            {isLoadingHistory && history.length === 0 ? (
               <div className="flex justify-center py-20">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
               </div>
            ) : history.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <div className="text-4xl mb-4 opacity-50">🕰️</div>
                    <p className="text-slate-400 font-medium">No practice history yet.</p>
                    <p className="text-slate-500 text-sm mt-2">Complete a session to see your stats here!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((session) => (
                        <div key={session.id} className="bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:bg-slate-800/80 transition-all group">
                             <div className="flex justify-between items-start mb-3">
                                 <div className="flex items-center gap-3">
                                     <span className="text-2xl bg-slate-900 p-2 rounded-xl border border-white/5 shadow-inner">
                                         {session.scenarioEmoji}
                                     </span>
                                     <div>
                                         <h4 className="font-bold text-white">{session.scenarioName}</h4>
                                         <p className="text-xs text-slate-400">{sessionRepository.formatDate(session.date)}</p>
                                     </div>
                                 </div>
                                 <div className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold border border-sky-500/20">
                                     {session.languageName}
                                 </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3 mt-2">
                                 <div className="bg-slate-900/50 rounded-lg p-2 flex items-center gap-2">
                                     <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                     </svg>
                                     <span className="text-sm text-slate-300">
                                         <span className="text-slate-500 text-xs mr-1">DURATION</span>
                                         {sessionRepository.formatDuration(session.durationSeconds)}
                                     </span>
                                 </div>
                                 <div className="bg-slate-900/50 rounded-lg p-2 flex items-center gap-2">
                                     <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                     </svg>
                                     <span className="text-sm text-slate-300">
                                         <span className="text-slate-500 text-xs mr-1">MESSAGES</span>
                                         {session.messageCount}
                                     </span>
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* Selection Modals */}
      <SelectionModal
        isOpen={activeModal === 'language'}
        title="Select Target Language"
        options={languageOptions}
        currentValue={userPreferences.targetLanguageCode}
        onSelect={(val) => onUpdatePreferences({...userPreferences, targetLanguageCode: val})}
        onClose={() => setActiveModal(null)}
      />

      <SelectionModal
        isOpen={activeModal === 'goal'}
        title="Set Daily Goal"
        options={goalOptions}
        currentValue={userPreferences.dailyGoalMinutes}
        onSelect={(val) => onUpdatePreferences({...userPreferences, dailyGoalMinutes: val})}
        onClose={() => setActiveModal(null)}
      />

      <SelectionModal
        isOpen={activeModal === 'voice'}
        title="Select Tutor Voice"
        options={voiceOptions}
        currentValue={userPreferences.voiceName}
        onSelect={(val) => onUpdatePreferences({...userPreferences, voiceName: val})}
        onClose={() => setActiveModal(null)}
      />

      <SelectionModal
        isOpen={activeModal === 'correction'}
        title="Correction Strictness"
        options={correctionOptions}
        currentValue={userPreferences.correctionLevel}
        onSelect={(val) => onUpdatePreferences({...userPreferences, correctionLevel: val})}
        onClose={() => setActiveModal(null)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentProfile={userProfile}
        onSave={onUpdateProfile}
      />

    </div>
  );
};

export default ProfileView;
