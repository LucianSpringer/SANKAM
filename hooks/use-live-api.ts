
import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Chat } from '@google/genai';
import { createPcmBlob, decodeAudioData, decodeBase64 } from '../utils/audio-utils';
import { analyzeGrammar } from '../utils/correction-service';
import { assessPronunciation } from '../utils/pronunciation-service';
import { ConnectionState, ChatMessage, LanguageConfig } from '../types';

const API_KEY = process.env.API_KEY as string;
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const CHAT_MODEL = 'gemini-2.5-flash';

interface UseLiveApiProps {
  language: LanguageConfig;
  systemInstruction: string;
  level: string;
}

/**
 * Custom hook to manage the Gemini Live API connection.
 * Handles audio streaming, WebSocket management, and message state.
 * 
 * @param props - Configuration props for the API connection.
 * @param props.language - The target language configuration.
 * @param props.systemInstruction - The system prompt for the AI.
 * @param props.level - The user's proficiency level.
 * @returns An object containing methods to control the session and current state variables.
 */
export const useLiveApi = ({ language, systemInstruction, level }: UseLiveApiProps) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0); 

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const aiClientRef = useRef<GoogleGenAI | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isIntentionalDisconnectRef = useRef<boolean>(false);
  const chatSessionRef = useRef<Chat | null>(null);
  
  const processedCorrectionsRef = useRef<Set<string>>(new Set());
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  useEffect(() => {
    aiClientRef.current = new GoogleGenAI({ apiKey: API_KEY });
  }, []);

  // Reset chat session when system instruction (context/language) changes
  useEffect(() => {
    chatSessionRef.current = null;
    setMessages([]);
  }, [systemInstruction]);

  // Correction Logic Effect
  useEffect(() => {
    const checkCorrections = async () => {
        const messagesToCorrect = messages.filter(
            m => m.role === 'user' && m.isFinal && !m.correction && !processedCorrectionsRef.current.has(m.id)
        );

        if (messagesToCorrect.length > 0) {
            for (const msg of messagesToCorrect) {
                processedCorrectionsRef.current.add(msg.id); 
                
                analyzeGrammar(msg.text, language, level).then(correction => {
                    if (correction) {
                        setMessages(prev => prev.map(m => 
                            m.id === msg.id ? { ...m, correction } : m
                        ));
                    }
                });
            }
        }
    };

    checkCorrections();
  }, [messages, language, level]);

  /**
   * Initiates the connection to the Gemini Live API.
   * Sets up audio context, microphone stream, and WebSocket event listeners.
   */
  const connect = useCallback(async () => {
    if (!aiClientRef.current) return;

    try {
      setConnectionState('connecting');
      setError(null);
      isIntentionalDisconnectRef.current = false;

      const InputContextClass = window.AudioContext || window.webkitAudioContext;
      const inputCtx = new InputContextClass({ sampleRate: 16000 });
      const outputCtx = new InputContextClass({ sampleRate: 24000 }); 

      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = aiClientRef.current;
      
      sessionPromiseRef.current = ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: language.voiceName } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setConnectionState('connected');
            
            const source = inputCtx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            
            const analyser = inputCtx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyserNodeRef.current = analyser;

            // TODO: Migrate to AudioWorklet for off-main-thread processing to improve performance.
            // ScriptProcessorNode is deprecated and runs on the main thread, but is used here 
            // for simplicity to avoid separate worker file configuration in this setup.
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              let sum = 0;
              for(let i = 0; i < inputData.length; i++) {
                  sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 5, 1)); 

              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const outputCtx = outputAudioContextRef.current;
            if (!outputCtx) return;

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscriptionRef.current += text;
              updateOngoingMessage('model', currentOutputTranscriptionRef.current);
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
              updateOngoingMessage('user', currentInputTranscriptionRef.current);
            }

            if (message.serverContent?.turnComplete) {
               finalizeMessage('user', currentInputTranscriptionRef.current);
               finalizeMessage('model', currentOutputTranscriptionRef.current);
               currentInputTranscriptionRef.current = '';
               currentOutputTranscriptionRef.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decodeBase64(base64Audio),
                outputCtx,
                24000,
                1
              );

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(source => source.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              currentOutputTranscriptionRef.current = ''; 
            }
          },
          onclose: () => {
            if (!isIntentionalDisconnectRef.current) {
               setConnectionState('error');
               setError("Session connection lost.");
            } else {
               setConnectionState('disconnected');
            }
          },
          onerror: (e) => {
            console.error(e);
            setConnectionState('error');
            setError("Connection error occurred.");
          }
        }
      });

    } catch (err) {
      console.error("Failed to connect:", err);
      setConnectionState('error');
      setError("Failed to access microphone or connect to API.");
    }
  }, [language, systemInstruction]);

  /**
   * Disconnects the current session and cleans up audio resources.
   */
  const disconnect = useCallback(async () => {
    isIntentionalDisconnectRef.current = true;
    if (sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;
        // @ts-ignore 
        session.close(); 
    }
    sessionPromiseRef.current = null;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    analyserNodeRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    audioSourcesRef.current.forEach(s => s.stop());
    audioSourcesRef.current.clear();

    setConnectionState('disconnected');
    setError(null);
    setVolume(0);
    analyserNodeRef.current = null;
  }, []);

  /**
   * Sends a text message to the chat model (standard mode, not Live).
   * Also performs pronunciation analysis on the input.
   * 
   * @param text - The message text to send.
   */
  const sendTextMessage = useCallback(async (text: string) => {
      if (!aiClientRef.current) return;
      
      const userMsgId = Date.now().toString();
      
      // Pass the text itself as the "target" for the Levenshtein algorithm
      // in this text-mode to ensure high scores for typed input
      const analysis = assessPronunciation(text, text);

      setMessages(prev => [...prev, { 
          id: userMsgId, 
          role: 'user', 
          text, 
          isFinal: true, 
          timestamp: Date.now(),
          pronunciationAnalysis: analysis
      }]);

      try {
          if (!chatSessionRef.current) {
              chatSessionRef.current = aiClientRef.current.chats.create({
                  model: CHAT_MODEL,
                  config: { systemInstruction }
              });
          }

          const result = await chatSessionRef.current.sendMessage({ message: text });
          const responseText = result.text;

          setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: responseText,
              isFinal: true,
              timestamp: Date.now()
          }]);

      } catch (e) {
          console.error("Error sending text message:", e);
          setError("Failed to send message.");
      }
  }, [systemInstruction]);

  /**
   * Updates an in-progress message in the state.
   */
  const updateOngoingMessage = (role: 'user' | 'model', text: string) => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === role && !lastMsg.isFinal) {
        return [...prev.slice(0, -1), { ...lastMsg, text }];
      } else {
        return [...prev, { id: Date.now().toString(), role, text, isFinal: false, timestamp: Date.now() }];
      }
    });
  };

  /**
   * Finalizes a message turn.
   * Triggers pronunciation assessment for user messages.
   */
  const finalizeMessage = (role: 'user' | 'model', text: string) => {
     setMessages(prev => {
         let index = -1;
         for (let i = prev.length - 1; i >= 0; i--) {
           if (prev[i].role === role && !prev[i].isFinal) {
             index = i;
             break;
           }
         }
         
         // In live spoken mode, we don't have a target text to compare against,
         // so we pass undefined to assessPronunciation.
         const analysis = role === 'user' ? assessPronunciation(text) : undefined;
         
         if (index !== -1) {
             const newArr = [...prev];
             newArr[index] = { 
                 ...newArr[index], 
                 text, 
                 isFinal: true, 
                 pronunciationAnalysis: analysis 
             };
             return newArr;
         }
         if (text.trim()) {
             return [...prev, { 
                 id: Date.now().toString(), 
                 role, 
                 text, 
                 isFinal: true, 
                 timestamp: Date.now(),
                 pronunciationAnalysis: analysis
             }];
         }
         return prev;
     });
  };

  return {
    connect,
    disconnect,
    sendTextMessage,
    connectionState,
    error,
    messages,
    volume,
    analyserNode: analyserNodeRef.current
  };
};
