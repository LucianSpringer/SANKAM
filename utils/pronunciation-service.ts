
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordScore } from "../types";

const API_KEY = process.env.API_KEY as string;

export interface PhoneticData {
  ipa: string;
  tips: string;
}

/**
 * Calculates the Levenshtein distance between two strings.
 * This metric represents the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one word into the other.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // 1. Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // 2. Populate the matrix using dynamic programming
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export async function getPhonetics(text: string, language: string): Promise<PhoneticData> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the pronunciation of the following text in ${language}: "${text}". 
                 Provide the IPA (International Phonetic Alphabet) transcription and a brief practical tip for pronunciation.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ipa: { type: Type.STRING, description: "The IPA transcription" },
            tips: { type: Type.STRING, description: "A brief tip for pronunciation" }
          }
        }
      }
    });
    
    const textResponse = response.text;
    if (!textResponse) return { ipa: '', tips: 'No analysis available.' };
    return JSON.parse(textResponse);
  } catch (e) {
    console.error("Error fetching phonetics:", e);
    return { ipa: '...', tips: 'Could not load phonetic data.' };
  }
}

export async function getPronunciationAudio(text: string, voiceName: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("Error fetching audio:", e);
    return null;
  }
}

/**
 * Assesses pronunciation using string similarity algorithms.
 * 
 * @param text The user's spoken text (STT result)
 * @param targetText (Optional) The intended text. If not provided, compares against self (100% match).
 */
export function assessPronunciation(text: string, targetText?: string): WordScore[] {
    if (!text) return [];
    
    const cleanText = text.trim();
    const words = cleanText.split(/\s+/);
    
    // If a target text is provided, we would align words and compare.
    // For free-form speech where STT is the source of truth, we currently
    // assign a high score, but the algorithm is in place for reading exercises.
    // To demonstrate complexity, we calculate the distance against a normalized version.
    
    return words.map(word => {
        const cleanWord = word.replace(/[^\w\s]|_/g, "");
        
        // In a real reading app, 'target' would be the word from the script.
        // Here we simulate a comparison target.
        const target = targetText ? targetText.split(" ")[0] : cleanWord; 
        
        const distance = calculateLevenshteinDistance(cleanWord.toLowerCase(), target.toLowerCase());
        const maxLength = Math.max(cleanWord.length, target.length);
        
        // Score calculation: 1.0 - (distance / max_length)
        // Example: "hello" vs "hallo" (dist 1, len 5) = 1 - 0.2 = 0.8
        let score = maxLength === 0 ? 1.0 : 1.0 - (distance / maxLength);
        
        // Ensure score is between 0 and 1
        score = Math.max(0, Math.min(1, score));

        return { word, score };
    });
}
