import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <div className="sticky top-0 z-40">
      {/* Decorative top bar inspired by the image */}
      <div className="h-1 bg-purple-600"></div>

      {/* Main navigation bar */}
      <nav className="bg-gray-950 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="container mx-auto flex items-center justify-between h-16">
          {/* Brand/Logo on the left */}
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="bug icon">🐞</span>
            <span className="text-xl font-bold text-white tracking-tight">Debugging Dynamos ✨</span>
          </div>
          
          {/* Actions on the right */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <span className="hidden sm:inline text-gray-300">
              Welcome, <span className="font-semibold text-white">{user.name}</span>
            </span>
            {/* CTA-style Logout Button */}
            <button
              onClick={onLogout}
              className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-950 transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
