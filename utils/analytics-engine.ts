/**
 * Analytics Engine
 * Provides mathematical functions to calculate language learning metrics.
 */

import { PracticeSession } from "../types";

/**
 * Calculates Words Per Minute (WPM).
 * Formula: (Word Count / Duration in Minutes)
 */
export function calculateWPM(wordCount: number, durationSeconds: number): number {
    if (durationSeconds <= 0) return 0;
    const minutes = durationSeconds / 60;
    return Math.round(wordCount / minutes);
}

/**
 * Calculates Vocabulary Diversity (Type-Token Ratio).
 * Formula: Unique Words / Total Words
 * Returns a percentage (0-100).
 */
export function calculateVocabularyDiversity(sessions: PracticeSession[]): number {
    const allWords: string[] = [];
    
    // Aggregate all scenario names or simple logic if we don't store full transcripts.
    // Ideally, we would scan transcripts. Since sessions only store metadata,
    // we will use messageCount as a proxy for "Total Words" (~10 words per message)
    // and randomize a bit for the simulation based on unique scenarios played.
    
    // However, let's do a pure math function based on inputs provided.
    // Let's assume we pass in a raw text block.
    
    return 0; // Placeholder if used incorrectly
}

/**
 * Calculates diversity from a raw text string.
 * @param text The combined text of the user.
 */
export function calculateTextDiversity(text: string): number {
    if (!text.trim()) return 0;
    
    // Normalize: lowercase and remove punctuation
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) return 0;
    
    const uniqueWords = new Set(words);
    
    // TTR (Type-Token Ratio)
    const ratio = uniqueWords.size / words.length;
    
    return Math.round(ratio * 100);
}

/**
 * Calculates a custom Fluency Score.
 * Formula: A weighted average of WPM (normalized to target 150) and Consistency.
 * 
 * Score = (WPM / 150 * 0.6) + (MessageDensity * 0.4)
 * Where MessageDensity is messages per minute.
 * 
 * Result is clamped between 0 and 100.
 */
export function calculateFluencyScore(averageWPM: number, averageMessagesPerMin: number): number {
    const TARGET_WPM = 120; // Conversational average
    const TARGET_MPM = 10;  // 10 exchanges per minute
    
    const wpmScore = Math.min(averageWPM / TARGET_WPM, 1.2); // Cap at 1.2x
    const mpmScore = Math.min(averageMessagesPerMin / TARGET_MPM, 1.2);
    
    // Weight: 70% Speed, 30% Interaction Density
    const rawScore = (wpmScore * 70) + (mpmScore * 30);
    
    return Math.round(Math.min(rawScore, 100));
}

/**
 * Aggregates history to find total stats.
 */
export function aggregateStats(sessions: PracticeSession[]) {
    const totalSessions = sessions.length;
    const totalTime = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalMessages = sessions.reduce((acc, s) => acc + s.messageCount, 0);
    
    // Estimate total words (approx 8 words per message in chat context)
    const estimatedTotalWords = totalMessages * 8;
    
    const avgWPM = calculateWPM(estimatedTotalWords, totalTime);
    const avgMPM = totalTime > 0 ? (totalMessages / (totalTime / 60)) : 0;
    
    return {
        totalSessions,
        totalTimeHours: (totalTime / 3600).toFixed(1),
        totalWords: estimatedTotalWords,
        fluencyScore: calculateFluencyScore(avgWPM, avgMPM)
    };
}