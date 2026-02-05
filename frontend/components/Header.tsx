
import React from 'react';

interface HeaderProps {
  onNavigate: (view: 'home' | 'report' | 'search') => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="bg-red-600 p-2 rounded-lg mr-2">
              <i className="fa-solid fa-id-card text-white text-xl"></i>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Kenya<span className="text-red-600">Lost</span>Found
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => onNavigate('home')}
              className={`${currentView === 'home' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-900'} px-1 py-4 text-sm font-medium transition-colors`}
            >
              Home
            </button>
            <button 
              onClick={() => onNavigate('search')}
              className={`${currentView === 'search' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-900'} px-1 py-4 text-sm font-medium transition-colors`}
            >
              Search
            </button>
            <button 
              onClick={() => onNavigate('report')}
              className={`${currentView === 'report' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-900'} px-1 py-4 text-sm font-medium transition-colors`}
            >
              Report Found ID
            </button>
          </nav>

          <div className="md:hidden">
            <button className="text-gray-500 hover:text-gray-900">
              <i className="fa-solid fa-bars text-2xl"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
