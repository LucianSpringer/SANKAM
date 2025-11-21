
import { UserProfile, UserPreferences } from '../types';

// Constants for LocalStorage Keys
const PROFILE_KEY = 'sankam_user_profile_v1';
const PREFS_KEY = 'sankam_user_prefs_v1';

// Default Fallback Data (if new user)
const DEFAULT_PROFILE: UserProfile = {
  name: 'Sankam User',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
};

const DEFAULT_PREFS: UserPreferences = {
  targetLanguageCode: 'es',
  dailyGoalMinutes: 5,
  voiceName: 'Journey',
  correctionLevel: 'Standard',
  notificationsEnabled: true
};

/**
 * Custom Error for Storage Limits
 */
export class StorageQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageQuotaExceededError";
  }
}

/**
 * User Repository
 * Handles data persistence for User Profile and Preferences.
 * Implements the Repository Pattern to decouple UI from Data Layer.
 */
class UserRepository {
  
  /**
   * Simulates network latency for "Professional" feel and future-proofing
   * for real API integration.
   */
  private async simulateNetworkDelay(ms: number = 600): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validates the size of the data payload.
   * LocalStorage has a limit (usually 5MB). We limit images to ~3MB.
   */
  private validatePayloadSize(data: string): void {
    // Approximate size in bytes for Base64 (Length * 0.75)
    const sizeInBytes = data.length * 0.75;
    const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB Limit

    if (sizeInBytes > MAX_SIZE_BYTES) {
      throw new StorageQuotaExceededError(`Image size (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB) exceeds the maximum limit of 3MB.`);
    }
  }

  // --- User Profile Methods ---

  /**
   * Fetches the user profile.
   */
  public async getUserProfile(): Promise<UserProfile> {
    await this.simulateNetworkDelay();
    
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (!stored) return DEFAULT_PROFILE;
      return JSON.parse(stored) as UserProfile;
    } catch (e) {
      console.error("Error reading user profile:", e);
      return DEFAULT_PROFILE;
    }
  }

  /**
   * Updates the user profile with validation.
   */
  public async updateUserProfile(profile: UserProfile): Promise<void> {
    await this.simulateNetworkDelay();

    try {
      const serialized = JSON.stringify(profile);
      this.validatePayloadSize(serialized);
      localStorage.setItem(PROFILE_KEY, serialized);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e instanceof StorageQuotaExceededError) {
         console.error("Storage quota exceeded:", e);
         throw new StorageQuotaExceededError("The profile image is too large to save. Please choose a smaller image.");
      }
      throw e;
    }
  }

  // --- User Preferences Methods ---

  /**
   * Fetches user preferences.
   */
  public async getUserPreferences(): Promise<UserPreferences> {
    await this.simulateNetworkDelay();

    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (!stored) return DEFAULT_PREFS;
      return JSON.parse(stored) as UserPreferences;
    } catch (e) {
      console.error("Error reading user preferences:", e);
      return DEFAULT_PREFS;
    }
  }

  /**
   * Updates user preferences.
   */
  public async updateUserPreferences(prefs: UserPreferences): Promise<void> {
    await this.simulateNetworkDelay(); // Shorter delay for prefs? Keeping consistent for now.

    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error("Failed to save preferences:", e);
      throw new Error("Failed to save settings.");
    }
  }
}

// Export Singleton Instance
export const userRepository = new UserRepository();
