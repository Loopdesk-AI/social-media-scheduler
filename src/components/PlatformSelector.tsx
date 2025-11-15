import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Platform } from '../types';

type PlatformSelectorProps = {
  platforms: Platform[];
};
export function PlatformSelector({
  platforms
}: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('all');
  return <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors border" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <rect x="2" y="2" width="8" height="8" rx="2" />
            <rect x="14" y="2" width="8" height="8" rx="2" />
            <rect x="2" y="14" width="8" height="8" rx="2" />
            <rect x="14" y="14" width="8" height="8" rx="2" />
          </svg>
          <span className="text-sm font-medium">All platforms</span>
        </div>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'hsl(var(--muted-foreground))' }} />
      </button>
      {isOpen && <div className="absolute z-10 mt-2 w-full rounded-lg shadow-xl border max-h-64 overflow-auto" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2.5 transition-colors" style={{ color: 'hsl(var(--card-foreground))' }} onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--muted))'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => {
          setSelected('all');
          setIsOpen(false);
        }}>
              <div className="w-5 flex items-center justify-center">
                {selected === 'all' && <Check size={16} style={{ color: 'hsl(var(--card-foreground))' }} />}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <rect x="2" y="2" width="8" height="8" rx="2" />
                <rect x="14" y="2" width="8" height="8" rx="2" />
                <rect x="2" y="14" width="8" height="8" rx="2" />
                <rect x="14" y="14" width="8" height="8" rx="2" />
              </svg>
              <span className="text-sm">All platforms</span>
            </button>
            {platforms.map(platform => <button key={platform.id} className="flex items-center w-full px-4 py-2.5 transition-colors" style={{ color: 'hsl(var(--card-foreground))' }} onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--muted))'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => {
          setSelected(platform.id);
          setIsOpen(false);
        }}>
                <div className="w-5 flex items-center justify-center">
                  {selected === platform.id && <Check size={16} style={{ color: 'hsl(var(--card-foreground))' }} />}
                </div>
                <img src={platform.icon} alt={platform.name} className="w-5 h-5 mx-3 object-contain" />
                <span className="text-sm">{platform.name}</span>
              </button>)}
          </div>
        </div>}
    </div>;
}