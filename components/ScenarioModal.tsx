import React from 'react';
import { Scenario } from '../types';
import { SCENARIOS } from '../utils/scenarios';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scenario: Scenario) => void;
  selectedId: string;
}

const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">Select a Scenario</h2>
            <p className="text-slate-400 text-sm mt-1">Choose a roleplay mission to practice specific vocabulary.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIOS.map((scenario) => {
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
                    <h3 className={`font-bold text-lg ${isSelected ? 'text-sky-100' : 'text-slate-200 group-hover:text-white'}`}>
                      {scenario.name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                      scenario.difficulty === 'Advanced' ? 'bg-purple-500/20 text-purple-300' :
                      scenario.difficulty === 'Intermediate' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300">
                    {scenario.description}
                  </p>
                  
                  <div className={`mt-auto pt-3 text-xs font-medium uppercase tracking-wider flex items-center gap-1 ${
                    isSelected ? 'text-sky-400' : 'text-slate-500 group-hover:text-sky-400'
                  }`}>
                    Role: {scenario.role}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 bg-slate-900/50 border-t border-white/5 text-center text-xs text-slate-500">
          Selecting a new scenario will update the AI persona for your next conversation.
        </div>
      </div>
    </div>
  );
};

export default ScenarioModal;