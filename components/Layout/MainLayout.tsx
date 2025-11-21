import React, { ReactNode } from 'react';
import Sidebar from '../Sidebar';
import { UserProfile } from '../../types';

interface MainLayoutProps {
  children: ReactNode;
  activePage: 'practice' | 'profile';
  onNavigate: (page: 'practice' | 'profile') => void;
  userProfile: UserProfile;
}

/**
 * MainLayout Component
 * Handles the core application structure, responsive grid, and navigation sidebar.
 * Separation of Layout from State Logic.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activePage,
  onNavigate,
  userProfile
}) => {
  return (
    <div className="h-[100dvh] flex flex-col-reverse md:flex-row items-center text-slate-50 font-inter overflow-hidden bg-slate-900">
      <Sidebar 
        activePage={activePage} 
        onNavigate={onNavigate} 
        userProfile={userProfile}
      />

      <div className="flex-1 h-full w-full flex flex-col relative overflow-hidden">
        {children}
      </div>
    </div>
  );
};