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
  // Media type for smart filtering
  selectedMediaType?: 'image' | 'video' | 'mixed' | 'none';
  selectedMediaCount?: number;
}

export function MultiPlatformSelector({
  onSelectionChange,
  onPlatformContentChange,
  initialSelectedPlatforms = [],
  selectedMediaType = 'none',
  selectedMediaCount = 0
}: MultiPlatformSelectorProps) {
  const { integrations } = useApp();

  // Filter integrations to only show social providers (exclude storage providers)
  const socialIntegrations = integrations.filter(integration =>
    integration.providerIdentifier !== 'google-drive' &&
    integration.providerIdentifier !== 'dropbox'
  );

  // Smart filtering based on media type
  const getCompatibleIntegrations = () => {
    return socialIntegrations.filter(integration => {
      const provider = integration.providerIdentifier;

      // Instagram REQUIRES media
      if (provider === 'instagram' && selectedMediaType === 'none') {
        return false; // Hide Instagram if no media selected
      }

      // YouTube REQUIRES video (not images)
      if (provider === 'youtube' && (selectedMediaType === 'image' || selectedMediaType === 'none')) {
        return false; // Hide YouTube for images or no media
      }

      return true; // Show all other combinations
    });
  };

  const compatibleIntegrations = getCompatibleIntegrations();

  const [platforms, setPlatforms] = useState<PlatformOption[]>(
    compatibleIntegrations.map(integration => ({
      id: integration.id,
      name: integration.name,
      icon: integration.picture,
      selected: initialSelectedPlatforms.includes(integration.id)
    }))
  );

  // Update platforms when media type changes
  React.useEffect(() => {
    const compatible = getCompatibleIntegrations();
    setPlatforms(prev => {
      // Remove platforms that are no longer compatible
      const updated = prev
        .filter(p => compatible.some(c => c.id === p.id))
        .map(p => ({
          ...p,
          // Keep selection only if still compatible
          selected: p.selected && compatible.some(c => c.id === p.id)
        }));

      // Add any new compatible platforms
      compatible.forEach(integration => {
        if (!updated.some(p => p.id === integration.id)) {
          updated.push({
            id: integration.id,
            name: integration.name,
            icon: integration.picture,
            selected: false
          });
        }
      });

      return updated;
    });

    // Notify parent if selections changed
    const selectedIds = platforms.filter(p => p.selected && compatible.some(c => c.id === p.id)).map(p => p.id);
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedMediaType, selectedMediaCount]);
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
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${platform.selected
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