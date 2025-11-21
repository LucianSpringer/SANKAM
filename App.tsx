
import React, { useState, useEffect, useRef } from 'react';
import { useLiveApi } from './hooks/use-live-api';
import AudioVisualizer from './components/AudioVisualizer';
import ChatMessageList from './components/ChatMessageList';
import ChatInput from './components/ChatInput';
import ConnectionErrorModal from './components/ConnectionErrorModal';
import PronunciationModal from './components/PronunciationModal';
import ScenarioModal from './components/ScenarioModal';
import StreakStatus from './components/StreakStatus';
import Sidebar from './components/Sidebar';
import ProfileView from './components/ProfileView';
import { LanguageConfig, Scenario, UserProfile, UserPreferences } from './types';
import { scenarioGenerator, DEFAULT_SCENARIO } from './utils/scenarios';
import { sessionRepository } from './utils/history-service';
import { userRepository, StorageQuotaExceededError } from './utils/user-repository';

// Predefined languages for the tutor
const LANGUAGES: LanguageConfig[] = [
  { code: 'es', name: 'Spanish', voiceName: 'Puck' },
  { code: 'fr', name: 'French', voiceName: 'Kore' },
  { code: 'de', name: 'German', voiceName: 'Fenrir' },
  { code: 'ja', name: 'Japanese', voiceName: 'Kore' },
  { code: 'it', name: 'Italian', voiceName: 'Puck' },
  { code: 'en', name: 'English', voiceName: 'Zephyr' },
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function App() {
  // --- Application Lifecycle State ---
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [activePage, setActivePage] = useState<'practice' | 'profile'>('practice');
  
  // -- User Data State (Initialized as null/default, populated by Repo) --
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', avatarUrl: '' });
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    targetLanguageCode: 'es',
    dailyGoalMinutes: 5,
    voiceName: 'Journey',
    correctionLevel: 'Standard',
    notificationsEnabled: true
  });

  // -- Derived State --
  const [selectedLang, setSelectedLang] = useState<LanguageConfig>(LANGUAGES[0]);
  
  // -- UI State --
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('Beginner');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  
  const [pronunciationState, setPronunciationState] = useState<{
    isOpen: boolean;
    text: string;
  }>({ isOpen: false, text: '' });

  // History Tracking State
  const sessionStartTimeRef = useRef<number>(0);

  // --- BOOT SEQUENCE ---
  useEffect(() => {
    const initializeAppData = async () => {
      try {
        setIsUserDataLoading(true);
        // Fetch data in parallel for performance
        const [profile, prefs] = await Promise.all([
          userRepository.getUserProfile(),
          userRepository.getUserPreferences()
        ]);
        
        setUserProfile(profile);
        setUserPreferences(prefs);
      } catch (error) {
        console.error("Failed to initialize app data:", error);
      } finally {
        setIsUserDataLoading(false);
      }
    };

    initializeAppData();
  }, []);

  // Effect: Sync local selection state when preferences are loaded
  useEffect(() => {
    const langConfig = LANGUAGES.find(l => l.code === userPreferences.targetLanguageCode);
    if (langConfig) {
       setSelectedLang(langConfig);
    }
  }, [userPreferences.targetLanguageCode]);

  // --- ASYNC DATA HANDLERS ---

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    try {
      // Optimistically update UI? No, let's wait for confirmation to show complexity
      await userRepository.updateUserProfile(newProfile);
      setUserProfile(newProfile);
    } catch (error) {
      if (error instanceof StorageQuotaExceededError) {
        alert(error.message);
      } else {
        alert("Failed to update profile. Please try again.");
      }
    }
  };

  const handleUpdatePreferences = async (newPrefs: UserPreferences) => {
    try {
      await userRepository.updateUserPreferences(newPrefs);
      setUserPreferences(newPrefs);
    } catch (error) {
      console.error(error);
      alert("Failed to save settings.");
    }
  };

  // --- SYSTEM INSTRUCTION CONSTRUCTION ---

  const systemInstruction = `
    You are an expert language simulation partner helping a user learn ${selectedLang.name}.
    User Level: ${selectedLevel} (${selectedLevel === 'Beginner' ? 'Speak simply and slowly' : 'Speak naturally'}).
    
    SCENARIO: ${selectedScenario.name}
    YOUR ROLE: ${selectedScenario.role}
    CONTEXT: ${selectedScenario.description}
    
    HIDDEN OBJECTIVE: ${selectedScenario.aiSecretGoal}
    
    CRITICAL INSTRUCTIONS FOR INTERACTION:
    1. **INITIATIVE**: You must DRIVE the conversation. Do not just answer "Yes/No". ALWAYS end your turn with a question or a counter-proposal to make the user speak again.
    2. **PERSONALITY**: Fully embody the persona described in the context.
    3. **CORRECTION**: Gently correct grammar errors using the "${userPreferences.correctionLevel}" style, but do NOT let corrections stop the roleplay flow.
    4. **LENGTH**: Keep responses concise (1-3 sentences) so the user has time to talk.
    
    IMPORTANT: Do not break character. Do not act like an AI assistant. Act exactly like a human ${selectedScenario.role} would in this situation.
  `;

  const voiceToUse = userPreferences.voiceName === 'Journey' ? 'Zephyr' : 
                     userPreferences.voiceName === 'Dan' ? 'Puck' :
                     userPreferences.voiceName === 'Aoede' ? 'Kore' :
                     userPreferences.voiceName === 'Kore' ? 'Kore' : 
                     selectedLang.voiceName;

  const { 
    connect, 
    disconnect, 
    sendTextMessage,
    connectionState, 
    messages, 
    analyserNode,
    volume,
    error 
  } = useLiveApi({ 
    language: { ...selectedLang, voiceName: voiceToUse }, 
    systemInstruction,
    level: selectedLevel
  });

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const handleConnect = async () => {
    sessionStartTimeRef.current = Date.now();
    await connect();
  };

  const handleDisconnect = async () => {
    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - sessionStartTimeRef.current) / 1000);
    const messageCount = messages.filter(m => m.role === 'user').length;

    if (durationSeconds > 10 || messageCount > 0) {
      sessionRepository.saveSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        durationSeconds,
        languageName: selectedLang.name,
        scenarioName: selectedScenario.name,
        scenarioEmoji: selectedScenario.emoji,
        messageCount
      });
    }
    await disconnect();
  };

  const handleTextSelected = (text: string) => {
    setPronunciationState({
      isOpen: true,
      text: text
    });
  };

  // --- LOADING SCREEN ---
  if (isUserDataLoading) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-animated opacity-50"></div>
         <div className="z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-sky-500 animate-spin mb-6 shadow-2xl shadow-sky-500/20"></div>
            <h2 className="text-xl font-bold tracking-tight animate-pulse">Sankam AI</h2>
            <p className="text-slate-400 text-sm mt-2">Loading profile & preferences...</p>
         </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="h-[100dvh] flex flex-col-reverse md:flex-row items-center text-slate-50 font-inter overflow-hidden bg-slate-900">
      
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        userProfile={userProfile}
      />

      <div className="flex-1 h-full w-full flex flex-col relative overflow-hidden">
        
        {/* PRACTICE VIEW */}
        <div 
          id="practice-view" 
          className={`flex flex-col h-full w-full transition-opacity duration-300 ${activePage === 'practice' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}
        >
          {/* Header */}
          <header className="w-full max-w-6xl mx-auto px-4 md:px-6 py-2 md:py-4 flex justify-end items-center z-20 flex-shrink-0 bg-slate-900/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-b border-white/5 md:border-none">
             <div className="flex items-center gap-4">
                <StreakStatus isSpeaking={isConnected && volume > 0.02} />
                <div className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all ${
                    isConnected 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                      : 'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  {isConnected ? '● Live Session Active' : '○ Ready to Connect'}
                </div>
             </div>
          </header>

          {/* Main Practice Content */}
          <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 overflow-hidden z-10">
            
            {/* Left Panel */}
            <section className={`w-full md:w-[360px] flex-shrink-0 flex flex-col gap-4 md:gap-6 overflow-y-auto md:overflow-visible glass-scroll transition-all duration-300 ${isConnected ? 'max-h-[25vh] md:max-h-none' : 'max-h-[40vh] md:max-h-none'}`}>
              <div className="space-y-4 md:space-y-5 p-4 md:p-6 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-xl">
                <h2 className="text-xs font-bold text-sky-200/70 uppercase tracking-widest flex items-center gap-2 mb-2 md:mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Configuration
                </h2>
                
                <div className="space-y-3 md:space-y-4">
                  {/* Language Dropdown */}
                  <div className="relative z-30">
                    <label className="block text-xs text-slate-400 mb-1 md:mb-2 font-medium ml-1">Language</label>
                    <button 
                      disabled={isConnected || isConnecting}
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="w-full bg-slate-900/50 border border-white/10 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 block p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-slate-900/70 hover:border-white/20 text-left flex items-center justify-between group"
                    >
                       <span className="font-medium">{selectedLang.name}</span>
                       <svg className={`w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                       </svg>
                    </button>
                    
                    {isLangDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsLangDropdownOpen(false)} />
                        <div className="absolute top-full left-0 w-full mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                          <div className="max-h-48 overflow-y-auto glass-scroll py-1">
                             {LANGUAGES.map(l => (
                               <button
                                  key={l.code}
                                  onClick={() => {
                                     handleUpdatePreferences({ ...userPreferences, targetLanguageCode: l.code });
                                     setIsLangDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                                    l.code === selectedLang.code 
                                      ? 'bg-sky-600/20 text-sky-100' 
                                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                  }`}
                               >
                                 <span>{l.name}</span>
                                 {l.code === selectedLang.code && (
                                   <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                   </svg>
                                 )}
                               </button>
                             ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1 md:mb-2 font-medium ml-1">Proficiency</label>
                    <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/10">
                      {LEVELS.map(level => (
                        <button
                          key={level}
                          disabled={isConnected || isConnecting}
                          onClick={() => setSelectedLevel(level)}
                          className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all duration-300 ${
                            selectedLevel === level 
                              ? 'bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-900/30' 
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-20">
                     <label className="block text-xs text-slate-400 mb-1 md:mb-2 font-medium ml-1">Scenario</label>
                     <button
                        onClick={() => setIsScenarioModalOpen(true)}
                        disabled={isConnected || isConnecting}
                        className="w-full p-3 bg-slate-900/50 hover:bg-slate-800 border border-white/10 hover:border-sky-500/50 rounded-xl text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                     >
                        <div className="flex items-center gap-3">
                           <span className="text-2xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-200">{selectedScenario.emoji}</span>
                           <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-200 truncate group-hover:text-white">{selectedScenario.name}</div>
                              <div className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">{selectedScenario.role}</div>
                           </div>
                           <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                           </svg>
                        </div>
                     </button>
                  </div>
                </div>
              </div>

              {/* Visualizer */}
              <div className={`flex-1 min-h-[180px] flex flex-col items-center justify-center relative rounded-3xl border transition-all duration-700 overflow-hidden ${
                  isConnected 
                  ? 'bg-white/5 backdrop-blur-md border-sky-500/20 shadow-[0_0_50px_rgba(14,165,233,0.15)]' 
                  : 'bg-white/5 backdrop-blur-sm border-white/5'
              }`}>
                 <div className="w-full h-full absolute inset-0 flex items-center justify-center">
                    <AudioVisualizer analyserNode={analyserNode} isActive={isConnected} />
                 </div>
                 <div className="absolute bottom-6 text-center w-full px-4 z-10 pointer-events-none">
                    <p className={`text-sm font-medium transition-all duration-500 mb-2 ${
                        isConnected ? 'text-sky-300 opacity-100 translate-y-0' : 'text-slate-500 opacity-80'
                    }`}>
                      {isConnected ? `Active: ${selectedScenario.name}` : "Start live audio to begin"}
                    </p>
                    {isConnected && selectedScenario.objectives && (
                       <div className="flex flex-col gap-1 items-center animate-in fade-in slide-in-from-bottom-2 delay-500">
                          {selectedScenario.objectives.map((obj, i) => (
                            <div key={i} className="text-[10px] text-white/70 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/5">
                               {i === 0 ? '🎯' : '✅'} {obj}
                            </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>

              {/* Controls */}
              <div className="pb-2">
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-white/10 group"
                  >
                    {isConnecting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                          </svg>
                        </div>
                        <span>Start Live Call</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className={`w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 backdrop-blur-md shadow-lg ${
                        volume > 0.02 
                        ? 'shadow-[0_0_25px_rgba(248,113,113,0.3)] border-red-500/40 scale-[1.01] ring-1 ring-red-500/30' 
                        : ''
                    }`}
                  >
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    End Session
                  </button>
                )}
              </div>
            </section>

            {/* Right Panel */}
            <section className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl min-h-[50vh] md:min-h-0">
               <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                 <h3 className="font-bold text-slate-200 flex items-center gap-2.5 text-sm md:text-base">
                   <div className="p-1.5 bg-sky-500/20 rounded-lg">
                       <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                       </svg>
                   </div>
                   Live Transcript
                 </h3>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-slate-900/50 rounded text-slate-400 border border-white/5">
                      {selectedLang.name} • {selectedLevel}
                    </span>
                 </div>
               </div>
               
               <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-900/30">
                  <ChatMessageList 
                    messages={messages} 
                    onTextSelected={handleTextSelected}
                    languageVoice={voiceToUse}
                  />
                  
                  <ChatInput 
                    onSendMessage={sendTextMessage} 
                    disabled={isConnected} 
                    language={selectedLang}
                  />
               </div>
            </section>
          </main>
        </div>

        {/* PROFILE VIEW */}
        <div 
          id="profile-view" 
          className={`h-full w-full overflow-y-auto glass-scroll transition-opacity duration-300 ${activePage === 'profile' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}
        >
           <ProfileView 
             userProfile={userProfile} 
             onUpdateProfile={handleUpdateProfile}
             userPreferences={userPreferences}
             onUpdatePreferences={handleUpdatePreferences}
             availableLanguages={LANGUAGES}
           />
        </div>

      </div>
      
      <ConnectionErrorModal 
        isOpen={connectionState === 'error' && !!error} 
        message={error || "Connection lost unexpectedly."} 
        onReconnect={connect}
        onClose={disconnect}
      />

      <PronunciationModal
        isOpen={pronunciationState.isOpen}
        text={pronunciationState.text}
        languageName={selectedLang.name}
        voiceName={voiceToUse}
        onClose={() => setPronunciationState(prev => ({ ...prev, isOpen: false }))}
      />

      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSelect={setSelectedScenario}
        selectedId={selectedScenario.id}
        currentLevel={selectedLevel as 'Beginner' | 'Intermediate' | 'Advanced'}
      />
    </div>
  );
}
