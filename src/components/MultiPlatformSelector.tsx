import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

interface PlatformOption {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

interface MultiPlatformSelectorProps {
  onSelectionChange?: (selectedPlatforms: string[]) => void;
  onPlatformContentChange?: (platformId: string, content: string) => void;
  initialSelectedPlatforms?: string[];
}

export function MultiPlatformSelector({
  onSelectionChange,
  onPlatformContentChange,
  initialSelectedPlatforms = []
}: MultiPlatformSelectorProps) {
  const { integrations } = useApp();
  const [platforms, setPlatforms] = useState<PlatformOption[]>(
    integrations.map(integration => ({
      id: integration.id,
      name: integration.name,
      icon: integration.picture,
      selected: initialSelectedPlatforms.includes(integration.id)
    }))
  );
  const [platformContents, setPlatformContents] = useState<Record<string, string>>({});

  const togglePlatform = (id: string) => {
    const updatedPlatforms = platforms.map(platform => 
      platform.id === id 
        ? { ...platform, selected: !platform.selected } 
        : platform
    );
    
    setPlatforms(updatedPlatforms);
    
    // Notify parent of selection change
    const selectedIds = updatedPlatforms
      .filter(p => p.selected)
      .map(p => p.id);
    
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  };

  const handleContentChange = (platformId: string, content: string) => {
    setPlatformContents(prev => ({
      ...prev,
      [platformId]: content
    }));
    
    if (onPlatformContentChange) {
      onPlatformContentChange(platformId, content);
    }
  };

  const selectedPlatforms = platforms.filter(p => p.selected);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              platform.selected
                ? 'bg-white text-black border-white'
                : 'bg-[#1a1a1a] text-white border-gray-800/50 hover:border-gray-700'
            }`}
          >
            <img 
              src={platform.icon} 
              alt={platform.name} 
              className="w-5 h-5 rounded-full object-cover" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/20x20/333/fff?text=?';
              }}
            />
            <span className="text-sm font-medium">{platform.name}</span>
          </button>
        ))}
      </div>
      
      {selectedPlatforms.length > 0 && (
        <div className="mt-4">
          <h3 className="text-white font-medium mb-2">Platform-Specific Content</h3>
          {selectedPlatforms.map(platform => (
            <div key={platform.id} className="mb-4 p-4 bg-[#1a1a1a] rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <img 
                  src={platform.icon} 
                  alt={platform.name} 
                  className="w-6 h-6 rounded-full object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/24x24/333/fff?text=?';
                  }}
                />
                <span className="text-white font-medium">{platform.name}</span>
              </div>
              <textarea
                value={platformContents[platform.id] || ''}
                onChange={(e) => handleContentChange(platform.id, e.target.value)}
                placeholder={`Enter content for ${platform.name}...`}
                className="w-full bg-[#0a0a0a] text-white rounded-lg p-3 border border-gray-800/50 focus:border-gray-700 focus:outline-none"
                rows={3}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}