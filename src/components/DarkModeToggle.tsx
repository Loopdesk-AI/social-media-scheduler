import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 bg-gray-800/50 hover:bg-gray-700/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 text-gray-300 hover:text-white"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon size={20} className="transition-transform duration-300 rotate-0" />
      ) : (
        <Sun size={20} className="transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
}

