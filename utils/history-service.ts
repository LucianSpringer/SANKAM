import { PracticeSession } from '../types';

const HISTORY_STORAGE_KEY = 'sankam_practice_history_v1';

export const getHistory = (): PracticeSession[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveSession = (session: PracticeSession): void => {
  try {
    const history = getHistory();
    // Prepend new session to start
    const updated = [session, ...history];
    // Limit to last 50 sessions to save space
    const trimmed = updated.slice(0, 50);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save session", e);
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

export const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};