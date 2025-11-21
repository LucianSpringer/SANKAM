import React, { useState, useRef, useEffect } from 'react';
import { SpeechRecognizer } from '../utils/web-speech-utils';
import { LanguageConfig } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  language: LanguageConfig;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, language }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognizerRef.current?.stop();
    } else {
      if (!recognizerRef.current) {
        recognizerRef.current = new SpeechRecognizer(
          language.code,
          (text, isFinal) => {
            if (isFinal) {
              setInput(prev => {
                  const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                  return prev + spacer + text;
              });
            }
          },
          () => setIsListening(false)
        );
      }
      recognizerRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="p-4 bg-slate-800/80 border-t border-slate-700 backdrop-blur-sm">
      <div className="flex items-end gap-2 max-w-4xl mx-auto relative">
        <button
          onClick={toggleListening}
          disabled={disabled}
          className={`p-3 rounded-full transition-all flex-shrink-0 ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Push to Talk"
        >
          {isListening ? (
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
             </svg>
          ) : (
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
          )}
        </button>
        
        <div className="flex-1 relative bg-slate-700/50 rounded-xl border border-slate-600 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? "Connect to Live Session to speak..." : "Type a message or use microphone..."}
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm p-3 max-h-32 resize-none focus:outline-none rounded-xl"
            rows={1}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;