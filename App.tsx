
import React, { useState, useEffect, useRef } from 'react';
import { useLiveApi } from './hooks/use-live-api';
import ConnectionErrorModal from './components/ConnectionErrorModal';
import PronunciationModal from './components/PronunciationModal';
import ScenarioModal from './components/ScenarioModal';
import ProfileView from './components/ProfileView';
import PracticeView from './components/PracticeView';
import { MainLayout } from './components/Layout/MainLayout';
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
    <MainLayout 
      activePage={activePage} 
      onNavigate={setActivePage} 
      userProfile={userProfile}
    >
        <PracticeView
            isActive={activePage === 'practice'}
            isConnected={connectionState === 'connected'}
            isConnecting={connectionState === 'connecting'}
            volume={volume}
            selectedLang={selectedLang}
            selectedLevel={selectedLevel}
            selectedScenario={selectedScenario}
            messages={messages}
            analyserNode={analyserNode}
            voiceToUse={voiceToUse}
            userPreferences={userPreferences}
            availableLanguages={LANGUAGES}
            availableLevels={LEVELS}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSendMessage={sendTextMessage}
            onUpdatePreferences={handleUpdatePreferences}
            onSelectLevel={setSelectedLevel}
            onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
            onTextSelected={handleTextSelected}
        />

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
    </MainLayout>
  );
}
