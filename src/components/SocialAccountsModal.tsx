import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { platforms } from '../data/platforms';
import { PlatformCard } from './PlatformCard';
import { PlatformSelector } from './PlatformSelector';

type SocialAccountsModalProps = {
  onClose: () => void;
};

export function SocialAccountsModal({
  onClose
}: SocialAccountsModalProps) {
  const [view, setView] = useState<'add' | 'connections'>('connections');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
              {view === 'add' ? 'Add social accounts' : 'Social account connections'}
            </h2>
            <button onClick={onClose} className="transition-colors p-1 rounded-md" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--foreground))'} onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          {view === 'add' ? <div className="grid grid-cols-2 gap-3">
              {platforms.map(platform => <PlatformCard key={platform.id} platform={platform} onClick={() => {
            setSelectedPlatform(platform.id);
            setView('connections');
          }} />)}
            </div> : <div className="space-y-5">
              <PlatformSelector platforms={platforms} />
              <div className="h-72 border rounded-lg flex items-center justify-center" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted))' }}>
                <div className="text-center px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" x2="19" y1="8" y2="14" />
                      <line x1="22" x2="16" y1="11" y2="11" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    No accounts connected yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Add your first social account to get started
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button className="flex items-center gap-2 font-medium px-5 py-2.5 rounded-lg transition-colors" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }} onClick={() => setView('add')}>
                  <Plus size={18} />
                  Add account
                </button>
              </div>
            </div>}
        </div>
      </div>
    </div>
  );
}