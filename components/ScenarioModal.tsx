
import React, { useState, useEffect } from 'react';
import { Scenario } from '../types';
import { scenarioGenerator } from '../utils/scenarios';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scenario: Scenario) => void;
  selectedId: string;
  currentLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedId,
  currentLevel
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate an initial batch when the modal opens for the first time
  useEffect(() => {
    if (isOpen && scenarios.length === 0) {
        handleGenerateBatch();
    }
  }, [isOpen]);

  const handleGenerateBatch = () => {
    setIsGenerating(true);
    // Simulate a small delay for "processing" feel
    setTimeout(() => {
        const newBatch = scenarioGenerator.generateBatch(3, currentLevel);
        setScenarios(newBatch);
        setIsGenerating(false);
    }, 400);
  };

  const handleGenerateSingle = () => {
      const newScenario = scenarioGenerator.generateScenario(currentLevel);
      setScenarios(prev => [newScenario, ...prev]);
  };

  const handleSelectFreeTalk = () => {
      const freeTalk = scenarioGenerator.generateGeneralScenario(currentLevel);
      onSelect(freeTalk);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">Select a Scenario</h2>
            <p className="text-slate-400 text-sm mt-1">
                Procedurally generated roleplay missions for <span className="text-sky-400 font-semibold">{currentLevel}</span> level.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 glass-scroll">
          {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mb-4"></div>
                  <p>Constructing scenarios...</p>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Generate New Card */}
                <button 
                    onClick={handleGenerateSingle}
                    className="group relative p-5 rounded-xl border border-dashed border-white/10 hover:border-sky-500/50 hover:bg-white/5 transition-all duration-200 flex flex-col items-center justify-center text-center min-h-[200px]"
                >
                    <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center mb-3 group-hover:bg-sky-500/20 transition-colors">
                        <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <span className="text-sky-400 font-semibold">Generate New</span>
                    <span className="text-xs text-slate-500 mt-1">Create a unique situation</span>
                </button>

                 {/* Free Talk Card (Permanent) */}
                 <button 
                    onClick={handleSelectFreeTalk}
                    className="group relative p-5 rounded-xl border border-white/10 hover:border-emerald-500/50 bg-emerald-900/5 hover:bg-emerald-900/10 transition-all duration-200 flex flex-col items-start justify-between text-left min-h-[200px]"
                >
                    <div className="flex justify-between w-full">
                        <span className="text-4xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-200">🗣️</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-full">
                            GENERAL
                        </span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight text-emerald-100 group-hover:text-white">
                            Free Talk
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed mt-2 group-hover:text-slate-300">
                            A relaxed, open conversation about anything. No missions, no pressure. Just chat.
                        </p>
                    </div>
                    <div className="pt-3 border-t border-emerald-500/20 w-full mt-2">
                         <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Goal: Just Chat</p>
                    </div>
                </button>

                {/* Generated Scenarios */}
                {scenarios.map((scenario) => {
                const isSelected = scenario.id === selectedId;
                return (
                    <div 
                    key={scenario.id}
                    onClick={() => {
                        onSelect(scenario);
                        onClose();
                    }}
                    className={`group relative p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-3 hover:-translate-y-1 ${
                        isSelected 
                        ? 'bg-sky-600/20 border-sky-500 shadow-lg shadow-sky-900/20 ring-1 ring-sky-500' 
                        : 'bg-slate-700/30 border-white/5 hover:bg-slate-700/50 hover:border-white/20 hover:shadow-xl'
                    }`}
                    >
                    <div className="flex justify-between items-start">
                        <span className="text-4xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-200">{scenario.emoji}</span>
                        {isSelected && (
                        <span className="bg-sky-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                            ACTIVE
                        </span>
                        )}
                    </div>
                    
                    <div>
                        <h3 className={`font-bold text-lg leading-tight ${isSelected ? 'text-sky-100' : 'text-slate-200 group-hover:text-white'}`}>
                        {scenario.name}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block ${
                        scenario.difficulty === 'Advanced' ? 'bg-purple-500/20 text-purple-300' :
                        scenario.difficulty === 'Intermediate' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-emerald-500/20 text-emerald-300'
                        }`}>
                        {scenario.difficulty}
                        </span>
                    </div>
                    
                    <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 line-clamp-3">
                        {scenario.description}
                    </p>
                    
                    <div className="mt-auto pt-3 border-t border-white/5 w-full">
                         <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Winning Conditions:</p>
                         <ul className="text-xs text-slate-400 space-y-1">
                            {scenario.objectives.slice(0, 2).map((obj, i) => (
                                <li key={i} className="flex items-start gap-1">
                                    <span className="text-sky-500">•</span> {obj}
                                </li>
                            ))}
                            {scenario.objectives.length > 2 && <li className="text-slate-600 text-[10px]">+ {scenario.objectives.length - 2} more</li>}
                         </ul>
                    </div>
                    </div>
                );
                })}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-900/50 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
            <span>Selecting a new scenario will reset the current conversation context.</span>
            <button 
                onClick={handleGenerateBatch}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate Batch
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioModal;
