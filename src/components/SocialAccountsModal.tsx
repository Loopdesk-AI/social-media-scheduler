import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { PlatformCard } from './PlatformCard';
import { PlatformSelector } from './PlatformSelector';
import { platforms } from '../data/platforms';

type SocialAccountsModalProps = {
  onClose: () => void;
};

export function SocialAccountsModal({
  onClose
}: SocialAccountsModalProps) {
  const [view, setView] = useState<'add' | 'connections'>('connections');
  return <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800/50 transition-colors duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-gray-900 dark:text-white text-xl font-semibold">
              {view === 'add' ? 'Add social accounts' : 'Social account connections'}
            </h2>
            <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-md" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          {view === 'add' ? <div className="grid grid-cols-2 gap-3">
              {platforms.map(platform => <PlatformCard key={platform.id} platform={platform} onClick={() => {
            setView('connections');
          }} />)}
            </div> : <div className="space-y-5">
              <PlatformSelector platforms={platforms} />
              <div className="h-72 border border-gray-300 dark:border-gray-800/70 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-200">
                <div className="text-center px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-800/30 flex items-center justify-center transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-600">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" x2="19" y1="8" y2="14" />
                      <line x1="22" x2="16" y1="11" y2="11" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No accounts connected yet
                  </p>
                  <p className="text-gray-500 dark:text-gray-600 text-xs mt-1">
                    Add your first social account to get started
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button className="flex items-center gap-2 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-medium px-5 py-2.5 rounded-lg transition-colors" onClick={() => setView('add')}>
                  <Plus size={18} />
                  Add account
                </button>
              </div>
            </div>}
        </div>
      </div>
    </div>;
}