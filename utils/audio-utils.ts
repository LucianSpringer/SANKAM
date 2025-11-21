
import { Blob } from '@google/genai';

/**
 * Decodes a base64 encoded string into a Uint8Array.
 * 
 * @param base64 - The base64 encoded string.
 * @returns A Uint8Array containing the decoded binary data.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array into a base64 string.
 * 
 * @param bytes - The Uint8Array to encode.
 * @returns A base64 encoded string representation of the data.
 */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes raw PCM audio data (16-bit integer) into a web AudioBuffer.
 * 
 * @param data - The Uint8Array containing raw PCM bytes (Int16).
 * @param ctx - The AudioContext instance to use for buffer creation.
 * @param sampleRate - The sample rate of the audio data (e.g., 24000Hz).
 * @param numChannels - The number of audio channels (usually 1 for mono).
 * @returns A promise that resolves to the created AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 range [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Converts Float32 audio data from the browser microphone into a PCM Int16 Blob
 * suitable for transmission to the Gemini API.
 * 
 * @param data - The Float32Array audio data from the MediaStream.
 * @returns A GoogleGenAI Blob object containing the base64 encoded PCM data and mime type.
 */
export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] before converting
    const s = Math.max(-1, Math.min(1, data[i]));
    // Convert Float32 to Int16
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encodeBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

/**
 * Helper function to decode and play raw PCM audio data immediately.
 * Creates a temporary AudioContext to handle the playback.
 * 
 * @param base64Data - The raw PCM audio data encoded in base64.
 * @param sampleRate - The sample rate for playback (default 24000).
 * @returns A promise that resolves when the audio has finished playing.
 */
export async function playAudioData(
  base64Data: string, 
  sampleRate: number = 24000
): Promise<void> {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextClass({ sampleRate });
  
  try {
    const bytes = decodeBase64(base64Data);
    const audioBuffer = await decodeAudioData(bytes, ctx, sampleRate, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);
    
    return new Promise((resolve) => {
      source.onended = () => {
        ctx.close();
        resolve();
      };
    });
  } catch (e) {
    ctx.close();
    console.error("Error playing audio:", e);
    throw e;
  }
}
