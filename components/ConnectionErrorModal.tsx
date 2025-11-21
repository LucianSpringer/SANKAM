import React from 'react';

interface ConnectionErrorModalProps {
  isOpen: boolean;
  message: string;
  onReconnect: () => void;
  onClose: () => void;
}

const ConnectionErrorModal: React.FC<ConnectionErrorModalProps> = ({ 
  isOpen, 
  message, 
  onReconnect, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-4 mb-4 text-red-400">
          <div className="p-3 bg-red-500/10 rounded-full">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Connection Lost</h2>
        </div>
        
        <p className="text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={onReconnect}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-900/20"
          >
            Reconnect
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionErrorModal;