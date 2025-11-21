import React from 'react';

interface Option {
  label: string;
  value: any;
  description?: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  title: string;
  options: Option[];
  currentValue: any;
  onSelect: (value: any) => void;
  onClose: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  title,
  options,
  currentValue,
  onSelect,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-2 glass-scroll">
          {options.map((option, idx) => {
            const isSelected = option.value === currentValue;
            return (
              <button
                key={idx}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl mb-1 transition-all flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-sky-600/20 border border-sky-500/50' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div>
                  <div className={`font-medium ${isSelected ? 'text-sky-100' : 'text-slate-200'}`}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-400">
                      {option.description}
                    </div>
                  )}
                </div>
                
                {isSelected && (
                  <div className="text-sky-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;