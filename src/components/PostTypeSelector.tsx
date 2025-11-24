import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface PostTypeSelectorProps {
    platformIdentifier: string;
    value: string;
    onChange: (postType: string) => void;
    selectedMediaType?: 'image' | 'video' | 'mixed' | 'none';
    selectedMediaCount?: number;
}

const getAvailablePostTypes = (
    platformIdentifier: string,
    mediaType: 'image' | 'video' | 'mixed' | 'none' = 'none',
    mediaCount: number = 0
) => {
    const isVideo = mediaType === 'video';
    const isMultipleImages = mediaType === 'image' && mediaCount > 1;

    switch (platformIdentifier) {
        case 'facebook':
            return [
                { value: 'standard', label: 'Standard Post', description: 'Regular post to feed' },
                { value: 'story', label: 'Story', description: '24-hour ephemeral content' },
                // Only show carousel for multiple images, not videos
                ...(isMultipleImages ? [{ value: 'carousel', label: 'Carousel', description: 'Multiple cards with links' }] : []),
                ...(isVideo ? [{ value: 'reel', label: 'Reel', description: 'Short-form video' }] : []),
            ];
        case 'instagram':
            // Instagram carousel is only for multiple images
            if (isMultipleImages) {
                return [
                    { value: 'standard', label: 'Standard Post', description: 'Regular post to feed' },
                    { value: 'carousel', label: 'Carousel', description: 'Multiple images (up to 10)' },
                ];
            }
            return [
                { value: 'standard', label: 'Standard Post', description: 'Regular post to feed' },
            ];
        case 'linkedin':
            // LinkedIn carousel is for documents/images, not videos
            if (!isVideo && mediaCount > 1) {
                return [
                    { value: 'standard', label: 'Standard Post', description: 'Regular post to feed' },
                    { value: 'carousel', label: 'Carousel', description: 'Document/image carousel (2-10 cards)' },
                ];
            }
            return [
                { value: 'standard', label: 'Standard Post', description: 'Regular post to feed' },
            ];
        case 'twitter':
            return [
                { value: 'standard', label: 'Tweet', description: 'Single tweet (280 chars)' },
                { value: 'thread', label: 'Thread', description: 'Multiple connected tweets' },
            ];
        default:
            return [{ value: 'standard', label: 'Standard Post', description: 'Regular post' }];
    }
};

export function PostTypeSelector({
    platformIdentifier,
    value,
    onChange,
    selectedMediaType = 'none',
    selectedMediaCount = 0
}: PostTypeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const postTypes = getAvailablePostTypes(platformIdentifier, selectedMediaType, selectedMediaCount);
    const selectedType = postTypes.find(t => t.value === value) || postTypes[0];

    // Only show selector if platform has multiple post types
    if (postTypes.length <= 1) {
        return null;
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#0a0a0a] border border-gray-800/50 rounded-lg text-left hover:border-gray-700 transition-colors"
            >
                <div className="flex-1">
                    <div className="text-sm font-medium text-white">{selectedType.label}</div>
                    <div className="text-xs text-gray-500">{selectedType.description}</div>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-[#0a0a0a] border border-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                        {postTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                    onChange(type.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 text-left hover:bg-gray-800/50 transition-colors ${value === type.value ? 'bg-gray-800/30' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-white">{type.label}</div>
                                        <div className="text-xs text-gray-500">{type.description}</div>
                                    </div>
                                    {value === type.value && (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-blue-500"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
