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
import { SCENARIOS } from './utils/scenarios';
import { saveSession } from './utils/history-service';

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
  const [activePage, setActivePage] = useState<'practice' | 'profile'>('practice');
  
  // -- User Profile State --
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Sankam User',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  });

  // -- User Preferences State --
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

  // Effect: When preferences change, update the actual App logic state
  useEffect(() => {
    const langConfig = LANGUAGES.find(l => l.code === userPreferences.targetLanguageCode);
    if (langConfig) {
       setSelectedLang(langConfig);
    }
  }, [userPreferences.targetLanguageCode]);

  const [selectedLevel, setSelectedLevel] = useState<string>('Beginner');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  
  const [pronunciationState, setPronunciationState] = useState<{
    isOpen: boolean;
    text: string;
  }>({ isOpen: false, text: '' });

  // History Tracking State
  const sessionStartTimeRef = useRef<number>(0);

  // Construct system instruction based on selection
  const systemInstruction = `
    You are a language tutor helping a user learn ${selectedLang.name}.
    The user's proficiency level is ${selectedLevel}.
    The user's preferred correction style is ${userPreferences.correctionLevel}.
    
    CURRENT SCENARIO: ${selectedScenario.name}
    YOUR ROLE: ${selectedScenario.role}
    SCENARIO CONTEXT: ${selectedScenario.description}
    
    Instructions:
    1. Act out the role specified above authentically. 
    2. If the scenario is "Just Chatting", act as a friendly, patient tutor.
    3. If it is a specific roleplay (e.g., Barista), stay in character but keep your language complexity suitable for a ${selectedLevel} learner.
    4. Gently correct grammatical mistakes in the context of your reply based on the "${userPreferences.correctionLevel}" style.
    5. Keep responses concise (under 3 sentences) to keep the conversation flowing.
    6. Do not use emojis or markdown in the audio response, just speak naturally.
  `;

  // Use the preferences voice override if available, else fallback to language default
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
    // 1. Calculate Duration
    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - sessionStartTimeRef.current) / 1000);
    
    // 2. Count User Messages
    const messageCount = messages.filter(m => m.role === 'user').length;

    // 3. Save to History if significant (e.g. > 10 seconds or 1 message)
    if (durationSeconds > 10 || messageCount > 0) {
      saveSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        durationSeconds,
        languageName: selectedLang.name,
        scenarioName: selectedScenario.name,
        scenarioEmoji: selectedScenario.emoji,
        messageCount
      });
    }

    // 4. Actual Disconnect
    await disconnect();
  };

  const handleTextSelected = (text: string) => {
    setPronunciationState({
      isOpen: true,
      text: text
    });
  };

  // Handle updating preferences from the profile view
  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
      setUserPreferences(newPrefs);
  };

  return (
    <div className="h-screen flex items-center text-slate-50 font-inter overflow-hidden">
      
      {/* Left Navigation Sidebar */}
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        userProfile={userProfile}
      />

      {/* Main Content Area */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        
        {/* PRACTICE VIEW Container */}
        <div 
          id="practice-view" 
          className={`flex flex-col h-full w-full transition-opacity duration-300 ${activePage === 'practice' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}
        >
          {/* Header for Practice View */}
          <header className="w-full max-w-6xl mx-auto px-6 py-4 flex justify-end items-center z-20 flex-shrink-0">
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
          <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-hidden z-10">
            
            {/* Left Panel: Controls & Visualizer */}
            <section className="w-full md:w-[360px] flex-shrink-0 flex flex-col gap-6 h-full">
              <div className="space-y-5 p-6 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-xl">
                <h2 className="text-xs font-bold text-sky-200/70 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Configuration
                </h2>
                
                <div className="space-y-4">
                  {/* Custom Language Dropdown */}
                  <div className="relative z-30">
                    <label className="block text-xs text-slate-400 mb-2 font-medium ml-1">Language</label>
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
                                     setUserPreferences(prev => ({ ...prev, targetLanguageCode: l.code }));
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
                    <label className="block text-xs text-slate-400 mb-2 font-medium ml-1">Proficiency</label>
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

                  {/* Scenario Selector */}
                  <div className="relative z-20">
                     <label className="block text-xs text-slate-400 mb-2 font-medium ml-1">Scenario</label>
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

              {/* Visualizer Area */}
              <div className={`flex-1 flex flex-col items-center justify-center min-h-[250px] relative rounded-3xl border transition-all duration-700 overflow-hidden ${
                  isConnected 
                  ? 'bg-white/5 backdrop-blur-md border-sky-500/20 shadow-[0_0_50px_rgba(14,165,233,0.15)]' 
                  : 'bg-white/5 backdrop-blur-sm border-white/5'
              }`}>
                 <div className="w-full h-full absolute inset-0 flex items-center justify-center">
                    <AudioVisualizer analyserNode={analyserNode} isActive={isConnected} />
                 </div>
                 
                 <div className="absolute bottom-6 text-center w-full px-4 z-10">
                    <p className={`text-sm font-medium transition-all duration-500 ${
                        isConnected ? 'text-sky-300 opacity-100 translate-y-0' : 'text-slate-500 opacity-80'
                    }`}>
                      {isConnected ? (
                          <>
                            Active: <span className="text-white">{selectedScenario.name}</span>
                          </>
                      ) : "Start live audio to begin"}
                    </p>
                 </div>
              </div>

              {/* Connection Controls */}
              <div>
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
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 backdrop-blur-md shadow-lg"
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

            {/* Right Panel: Transcript & Chat */}
            <section className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
               <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                 <h3 className="font-bold text-slate-200 flex items-center gap-2.5">
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

        {/* PROFILE VIEW Container */}
        <div 
          id="profile-view" 
          className={`h-full w-full overflow-y-auto glass-scroll transition-opacity duration-300 ${activePage === 'profile' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}
        >
           <ProfileView 
             userProfile={userProfile} 
             onUpdateProfile={setUserProfile}
             userPreferences={userPreferences}
             onUpdatePreferences={handleUpdatePreferences}
             availableLanguages={LANGUAGES}
           />
        </div>

      </div>
      
      {/* Connection Error Modal */}
      <ConnectionErrorModal 
        isOpen={connectionState === 'error' && !!error} 
        message={error || "Connection lost unexpectedly."} 
        onReconnect={connect}
        onClose={disconnect}
      />

      {/* Pronunciation Modal */}
      <PronunciationModal
        isOpen={pronunciationState.isOpen}
        text={pronunciationState.text}
        languageName={selectedLang.name}
        voiceName={voiceToUse}
        onClose={() => setPronunciationState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Scenario Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSelect={setSelectedScenario}
        selectedId={selectedScenario.id}
      />
    </div>
  );
}