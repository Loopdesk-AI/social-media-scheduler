import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg hover:bg-[#222] transition-colors border border-gray-800/50">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <rect x="2" y="2" width="8" height="8" rx="2" />
            <rect x="14" y="2" width="8" height="8" rx="2" />
            <rect x="2" y="14" width="8" height="8" rx="2" />
            <rect x="14" y="14" width="8" height="8" rx="2" />
          </svg>
          <span className="text-sm font-medium">All platforms</span>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="absolute z-10 mt-2 w-full bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800/50 max-h-64 overflow-auto">
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2.5 text-white hover:bg-[#252525] transition-colors" onClick={() => {
          setSelected('all');
          setIsOpen(false);
        }}>
              <div className="w-5 flex items-center justify-center">
                {selected === 'all' && <Check size={16} className="text-white" />}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-3 text-gray-400">
                <rect x="2" y="2" width="8" height="8" rx="2" />
                <rect x="14" y="2" width="8" height="8" rx="2" />
                <rect x="2" y="14" width="8" height="8" rx="2" />
                <rect x="14" y="14" width="8" height="8" rx="2" />
              </svg>
              <span className="text-sm">All platforms</span>
            </button>
            {platforms.map(platform => <button key={platform.id} className="flex items-center w-full px-4 py-2.5 text-white hover:bg-[#252525] transition-colors" onClick={() => {
          setSelected(platform.id);
          setIsOpen(false);
        }}>
                <div className="w-5 flex items-center justify-center">
                  {selected === platform.id && <Check size={16} className="text-white" />}
                </div>
                <img src={platform.icon} alt={platform.name} className="w-5 h-5 mx-3 object-contain" />
                <span className="text-sm">{platform.name}</span>
              </button>)}
          </div>
        </div>}
    </div>;
}