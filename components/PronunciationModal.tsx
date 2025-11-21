import React, { useEffect, useState } from 'react';
import { getPhonetics, getPronunciationAudio, PhoneticData } from '../utils/pronunciation-service';
import { playAudioData } from '../utils/audio-utils';

interface PronunciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  languageName: string;
  voiceName: string;
}

const PronunciationModal: React.FC<PronunciationModalProps> = ({
  isOpen,
  onClose,
  text,
  languageName,
  voiceName
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PhoneticData | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (isOpen && text) {
      setLoading(true);
      setData(null);
      getPhonetics(text, languageName)
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [isOpen, text, languageName]);

  const handlePlay = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      // For TTS, we need just the text, language is determined by voiceName implicitly usually,
      // but TTS model takes text. VoiceName configures the accent/style.
      const audioData = await getPronunciationAudio(text, voiceName);
      if (audioData) {
        await playAudioData(audioData);
      }
    } catch (error) {
      console.error("Playback failed", error);
    } finally {
      setPlaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-white mb-1">Pronunciation Guide</h3>
        <p className="text-slate-400 text-sm mb-6">Target Language: {languageName}</p>

        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xl font-medium text-sky-100 mb-2 text-center">"{text}"</p>
            {loading ? (
              <div className="flex justify-center py-2">
                <svg className="animate-spin h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              data && (
                <div className="text-center">
                  <p className="text-sky-400 font-mono text-lg mb-2">/{data.ipa}/</p>
                  <p className="text-slate-400 text-sm">{data.tips}</p>
                </div>
              )
            )}
          </div>

          <button
            onClick={handlePlay}
            disabled={playing || loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {playing ? (
              <>
                <span className="flex gap-1">
                   <span className="w-1 h-3 bg-white animate-pulse"></span>
                   <span className="w-1 h-3 bg-white animate-pulse delay-75"></span>
                   <span className="w-1 h-3 bg-white animate-pulse delay-150"></span>
                </span>
                Playing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Hear Pronunciation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PronunciationModal;
