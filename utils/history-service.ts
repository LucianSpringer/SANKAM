import { PracticeSession } from '../types';

const HISTORY_STORAGE_KEY = 'sankam_practice_history_v1';

/**
 * Service Repository pattern for handling Session data.
 * Encapsulates data access and provides asynchronous methods to mimic a backend.
 */
class SessionRepository {
  
  /**
   * Retrieves the full history of practice sessions.
   * Simulates a network delay.
   */
  public async getHistory(): Promise<PracticeSession[]> {
    // Simulate network latency (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  }

  /**
   * Saves a new session to the repository.
   * Prepend the session to the list and maintains a max limit.
   * @param session The session object to save.
   */
  public async saveSession(session: PracticeSession): Promise<void> {
    // Simulate network latency (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // We can't call getHistory() here directly if we want to avoid double delay, 
      // so we access storage directly but keep the async signature for the interface.
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      const history: PracticeSession[] = stored ? JSON.parse(stored) : [];
      
      // Prepend new session to start
      const updated = [session, ...history];
      
      // Limit to last 50 sessions to save space
      const trimmed = updated.slice(0, 50);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error("Failed to save session", e);
      throw new Error("Database save failed");
    }
  }

  /**
   * Clears all history data.
   */
  public async clearHistory(): Promise<void> {
     await new Promise(resolve => setTimeout(resolve, 300));
     localStorage.removeItem(HISTORY_STORAGE_KEY);
  }

  /**
   * Utility: Formats seconds into mm:ss string
   */
  public formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  }

  /**
   * Utility: Formats ISO date string to readable format
   */
  public formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Export a singleton instance
export const sessionRepository = new SessionRepository();