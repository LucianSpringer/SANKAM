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
  difficulty: 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced';
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