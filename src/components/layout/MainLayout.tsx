import React from 'react';
import Toolbar from './Toolbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <main className="flex-grow overflow-hidden">
        {children}
      </main>
      <Toolbar />
    </div>
  );
};

export default MainLayout;