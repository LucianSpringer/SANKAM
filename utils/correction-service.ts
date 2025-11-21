import { GoogleGenAI, Type } from "@google/genai";
import { Correction, LanguageConfig } from "../types";

const API_KEY = process.env.API_KEY as string;

export async function analyzeGrammar(
  text: string, 
  language: LanguageConfig, 
  level: string
): Promise<Correction | null> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const prompt = `
      Act as a strict language tutor for ${language.name}.
      Analyze the following sentence from a ${level} level learner: "${text}".
      
      Check for grammar, vocabulary, and verb conjugation errors.
      If the sentence is correct and natural, set "isCorrect" to true.
      If there are errors or it sounds unnatural, provide the corrected version and a brief explanation (max 1 sentence).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            corrected: { type: Type.STRING },
            explanation: { type: Type.STRING },
            isCorrect: { type: Type.BOOLEAN }
          },
          required: ["original", "corrected", "explanation", "isCorrect"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText) as Correction;
  } catch (error: any) {
    // Suppress 429 errors to avoid noisy console logs
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
        console.warn("Grammar analysis skipped due to rate limit.");
        return null;
    }
    console.error("Error analyzing grammar:", error);
    return null;
  }
}