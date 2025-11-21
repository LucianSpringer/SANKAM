import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';
import { getPronunciationAudio } from '../utils/pronunciation-service';
import { playAudioData } from '../utils/audio-utils';

interface ChatMessageListProps {
  messages: ChatMessage[];
  onTextSelected?: (text: string) => void;
  languageVoice?: string;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, onTextSelected, languageVoice }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectionButton, setSelectionButton] = useState<{ x: number; y: number; text: string } | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  // Track expanded state for corrections
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expandedMessageIds]);

  const handlePlayAudio = async (id: string, text: string) => {
      if (playingId) return;
      setPlayingId(id);
      try {
          const voice = languageVoice || "Zephyr";
          const audioData = await getPronunciationAudio(text, voice); 
          if (audioData) {
              await playAudioData(audioData);
          }
      } catch(e) {
          console.error("Failed to play audio", e);
      } finally {
          setPlayingId(null);
      }
  };

  const toggleExpansion = (id: string) => {
      setExpandedMessageIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
              newSet.delete(id);
          } else {
              newSet.add(id);
          }
          return newSet;
      });
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelectionButton(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setSelectionButton(null);
        return;
      }

      if (scrollRef.current && !scrollRef.current.contains(selection.anchorNode)) {
         setSelectionButton(null);
         return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectionButton({
        x: rect.left + (rect.width / 2) - 60,
        y: rect.top - 40, 
        text: text
      });
    };

    document.addEventListener('selectionchange', handleSelection);
    const handleScroll = () => setSelectionButton(null);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400/80 p-8 text-center">
        <p className="font-light text-lg">Start speaking or type a message to begin practicing...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 pb-40 space-y-8 glass-scroll" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const hasError = msg.correction && !msg.correction.isCorrect;
          const isExpanded = expandedMessageIds.has(msg.id);

          return (
          <div
            key={`${msg.id}-${idx}`}
            className={`flex flex-col w-full ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
               {msg.role === 'model' && (
                   <button 
                      onClick={() => handlePlayAudio(msg.id, msg.text)}
                      disabled={!!playingId}
                      className="mt-2 p-2 text-sky-200/70 hover:text-sky-400 rounded-full hover:bg-white/5 transition-colors h-fit flex-shrink-0"
                      title="Read Aloud"
                   >
                       {playingId === msg.id ? (
                           <span className="flex gap-0.5 items-center h-5 w-5 justify-center">
                               <span className="w-0.5 h-2 bg-sky-400 animate-pulse"></span>
                               <span className="w-0.5 h-3 bg-sky-400 animate-pulse delay-75"></span>
                               <span className="w-0.5 h-2 bg-sky-400 animate-pulse delay-150"></span>
                           </span>
                       ) : (
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                           </svg>
                       )}
                   </button>
               )}

                <div
                  onClick={(e) => {
                      if (hasError && !e.defaultPrevented) toggleExpansion(msg.id);
                  }}
                  className={`relative rounded-2xl px-6 py-4 backdrop-blur-md border transition-all duration-200 ${
                    msg.role === 'user'
                      ? `rounded-br-sm text-white ${
                          hasError 
                            ? 'bg-red-500/10 border-red-500/40 cursor-pointer hover:bg-red-500/20' 
                            : 'bg-sky-600/20 border-sky-500/30'
                        }`
                      : 'rounded-bl-sm bg-white/10 border-white/10 text-slate-100 shadow-lg'
                  } ${hasError ? 'ring-1 ring-red-500/20' : ''}`}
                >
                  {/* Text Rendering Logic */}
                  {msg.role === 'user' && msg.pronunciationAnalysis ? (
                      <p className="text-base leading-relaxed font-light tracking-wide break-words">
                          {msg.pronunciationAnalysis.map((wordScore, i) => {
                              let colorClass = 'text-emerald-200'; // Excellent
                              let cursorClass = '';
                              let title = 'Perfect pronunciation';

                              if (wordScore.score < 0.5) {
                                  colorClass = 'text-red-400 decoration-dotted underline underline-offset-4 font-normal';
                                  cursorClass = 'cursor-pointer hover:opacity-80';
                                  title = 'Click to hear correct pronunciation';
                              } else if (wordScore.score < 0.8) {
                                  colorClass = 'text-yellow-300';
                                  cursorClass = 'cursor-pointer hover:opacity-80';
                                  title = 'Accent detected - Click to hear';
                              }
                              
                              const isClickable = wordScore.score < 0.8;

                              return (
                                  <span 
                                    key={i} 
                                    className={`${colorClass} ${cursorClass} transition-colors mr-1.5 inline-block`}
                                    title={title}
                                    onClick={(e) => {
                                        if (isClickable) {
                                            e.stopPropagation(); // Prevent expanding the correction box
                                            e.preventDefault();
                                            handlePlayAudio(msg.id + i, wordScore.word);
                                        }
                                    }}
                                  >
                                      {wordScore.word}
                                      {playingId === (msg.id + i) && (
                                          <span className="inline-block w-1.5 h-1.5 bg-current rounded-full ml-0.5 animate-ping"/>
                                      )}
                                  </span>
                              );
                          })}
                      </p>
                  ) : (
                      <p className={`text-base leading-relaxed select-text whitespace-pre-wrap font-light tracking-wide ${
                          hasError ? 'decoration-red-400/50 decoration-dashed underline underline-offset-4' : ''
                      }`}>
                        {msg.text}
                        {!msg.isFinal && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-sky-400 animate-pulse align-middle" />
                        )}
                      </p>
                  )}

                  {/* Accordion Expansion for Correction */}
                  {hasError && (
                      <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-red-500/20' : 'grid-rows-[0fr] opacity-0'
                      }`}>
                          <div className="min-h-0 space-y-2 text-sm">
                             <div className="flex flex-col gap-1">
                                <span className="text-red-300 text-xs uppercase font-bold tracking-wider">Issue</span>
                                <p className="text-slate-300 opacity-80">{msg.correction?.explanation}</p>
                             </div>
                             <div className="flex flex-col gap-1 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-400 text-xs uppercase font-bold tracking-wider">Better way</span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (msg.correction?.corrected) {
                                                handlePlayAudio(`${msg.id}-corrected`, msg.correction.corrected);
                                            }
                                        }}
                                        className="p-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center gap-1"
                                        title="Listen to corrected sentence"
                                    >
                                        {playingId === `${msg.id}-corrected` ? (
                                           <span className="flex gap-0.5 items-center h-3 w-3 justify-center">
                                                <span className="w-0.5 h-2 bg-emerald-400 animate-pulse"></span>
                                                <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-75"></span>
                                                <span className="w-0.5 h-2 bg-emerald-400 animate-pulse delay-150"></span>
                                           </span>
                                        ) : (
                                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                           </svg>
                                        )}
                                        <span className="text-[10px] font-bold uppercase">Play</span>
                                    </button>
                                </div>
                                <p className="text-emerald-100 font-medium">{msg.correction?.corrected}</p>
                             </div>
                          </div>
                      </div>
                  )}

                  {hasError && !isExpanded && (
                      <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                          TAP TO FIX
                      </div>
                  )}
                </div>
            </div>

             {/* Positive Reinforcement */}
             {msg.role === 'user' && msg.correction && msg.correction.isCorrect && (
                 <div className="mt-1 mr-2 text-xs text-emerald-400/80 flex items-center gap-1 animate-in fade-in">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                     </svg>
                     Excellent!
                 </div>
             )}
          </div>
        )})}
        <div className="h-4"></div>
      </div>
      
      {selectionButton && onTextSelected && (
        <div
            id="pronounce-btn"
            style={{
                position: 'fixed',
                top: `${selectionButton.y}px`,
                left: `${selectionButton.x}px`,
                zIndex: 50
            }}
            className="animate-in fade-in zoom-in duration-150"
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onTextSelected(selectionButton.text);
                    setSelectionButton(null);
                    window.getSelection()?.removeAllRanges();
                }}
                className="bg-slate-900/90 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-xl border border-sky-500/50 hover:bg-sky-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                Pronounce
            </button>
        </div>
      )}
    </div>
  );
};

export default ChatMessageList;