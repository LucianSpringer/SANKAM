
export interface LanguageConfig {
  code: string;
  name: string;
  voiceName: string;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  isCorrect: boolean;
}

export interface WordScore {
  word: string;
  score: number; // 0.0 to 1.0
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isFinal: boolean;
  timestamp: number;
  correction?: Correction;
  pronunciationAnalysis?: WordScore[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  emoji: string;
  role: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objectives: string[]; // User-facing winning conditions
  aiSecretGoal: string; // Hidden AI instruction
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AudioVisualizerState {
  volume: number;
  isTalking: boolean;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
}

export interface UserPreferences {
  targetLanguageCode: string;
  dailyGoalMinutes: number;
  voiceName: string;
  correctionLevel: 'Gentle' | 'Standard' | 'Strict';
  notificationsEnabled: boolean;
}

export interface PracticeSession {
  id: string;
  date: string; // ISO string
  durationSeconds: number;
  languageName: string;
  scenarioName: string;
  scenarioEmoji: string;
  messageCount: number;
}

// Augment the global Window interface to include vendor-prefixed APIs
// This avoids using (window as any) throughout the codebase
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
