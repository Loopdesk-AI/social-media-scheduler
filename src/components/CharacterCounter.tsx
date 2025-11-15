import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { getCharacterCountState } from '../lib/constants';

interface CharacterCounterProps {
  count: number;
  limit: number;
  platform?: string;
}

export function CharacterCounter({ count, limit, platform }: CharacterCounterProps) {
  const state = getCharacterCountState(count, limit);
  const percentage = (count / limit) * 100;

  const getStateStyles = () => {
    switch (state) {
      case 'error':
        return {
          text: 'text-red-600 dark:text-red-500',
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-300 dark:border-red-800',
          icon: <XCircle size={16} className="text-red-600 dark:text-red-500" />,
        };
      case 'warning':
        return {
          text: 'text-amber-600 dark:text-amber-500',
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-300 dark:border-amber-800',
          icon: <AlertTriangle size={16} className="text-amber-600 dark:text-amber-500" />,
        };
      default:
        return {
          text: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-300 dark:border-gray-800',
          icon: null,
        };
    }
  };

  const styles = getStateStyles();

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${styles.border} ${styles.bg} transition-colors duration-200`}>
      <div className="flex items-center gap-2">
        {styles.icon}
        <span className={`text-sm font-medium ${styles.text}`}>
          {count} / {limit} characters
        </span>
        {platform && (
          <span className="text-xs text-gray-500 dark:text-gray-500">
            ({platform})
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              state === 'error'
                ? 'bg-red-500'
                : state === 'warning'
                ? 'bg-amber-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        {state !== 'normal' && (
          <span className={`text-xs font-semibold ${styles.text}`}>
            {state === 'error' ? `+${count - limit}` : `${limit - count} left`}
          </span>
        )}
      </div>
    </div>
  );
}

