import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordScore } from "../types";

const API_KEY = process.env.API_KEY as string;

export interface PhoneticData {
  ipa: string;
  tips: string;
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
 * Simulates pronunciation assessment for the demo.
 * In a real app, this would use a specialized speech assessment API.
 */
export function assessPronunciation(text: string): WordScore[] {
    if (!text) return [];
    
    // Split by spaces but keep the structure
    return text.split(' ').map(word => {
        // Strip punctuation for length check
        const clean = word.replace(/[^\w\s]|_/g, "");
        
        // Mock scoring logic:
        // 1. Default high score
        let score = 0.95;
        
        // 2. Randomly degrade score for "demo" purposes to show the UI features
        // We only do this for words with reasonable length to avoid marking "a", "is" as red.
        if (clean.length > 3) {
             const rand = Math.random();
             if (rand < 0.15) {
                 score = 0.4; // Red (Mispronounced)
             } else if (rand < 0.3) {
                 score = 0.7; // Yellow (Heavy accent)
             }
        }
        
        return { word, score };
    });
}