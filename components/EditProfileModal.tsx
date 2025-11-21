import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}) => {
  const [name, setName] = useState(currentProfile.name);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentProfile.name);
      setAvatarUrl(currentProfile.avatarUrl);
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ 
      name: name.trim(), 
      avatarUrl: avatarUrl || currentProfile.avatarUrl 
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-bold text-white">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Profile Photo
            </label>
            
            <div className="flex gap-3 items-center">
               {/* Hidden File Input */}
               <input 
                  type="file" 
                  id="profile-upload-input"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
               />
               
               {/* Styled Trigger Button */}
               <label 
                  htmlFor="profile-upload-input"
                  className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-slate-700/50 hover:bg-slate-700 border border-white/10 border-dashed hover:border-sky-500/50 rounded-xl py-3 px-4 transition-all group"
               >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-slate-300 group-hover:text-white font-medium">
                    Upload from Device
                  </span>
               </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Supports JPG, PNG. Max 5MB.
            </p>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
             <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 shrink-0 border-2 border-slate-600">
               <img 
                 src={avatarUrl || 'https://via.placeholder.com/150'} 
                 alt="Preview" 
                 className="w-full h-full object-cover"
                 onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=?')}
               />
             </div>
             <div className="min-w-0">
               <p className="text-sm font-medium text-white truncate">{name || 'Your Name'}</p>
               <p className="text-xs text-sky-400 font-medium">Preview</p>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-lg shadow-sky-900/20 transition-all active:scale-95 text-sm font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;