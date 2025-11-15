import { X } from 'lucide-react';
import { useState } from 'react';
import type { Platform } from '../types/post';

interface CreatePostModalProps {
  onClose: () => void;
  onCreatePost: (post: {
    platform: Platform;
    content: string;
    scheduledAt: string;
  }) => void;
}

export function CreatePostModal({ onClose, onCreatePost }: CreatePostModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('x');
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('12:00');

  const platforms: { value: Platform; label: string; color: string }[] = [
    { value: 'x', label: 'X (Twitter)', color: '#1DA1F2' },
    { value: 'facebook', label: 'Facebook', color: '#1877F2' },
    { value: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
    { value: 'instagram', label: 'Instagram', color: '#E4405F' },
    { value: 'youtube', label: 'YouTube', color: '#FF0000' },
    { value: 'tiktok', label: 'TikTok', color: '#000000' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter post content');
      return;
    }

    // Combine date and time into ISO string
    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

    onCreatePost({
      platform: selectedPlatform,
      content: content.trim(),
      scheduledAt,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border" 
        style={{ 
          background: 'hsl(var(--card))', 
          borderColor: 'hsl(var(--border))' 
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
              Schedule New Post
            </h2>
            <button
              onClick={onClose}
              className="transition-colors p-1 rounded-md"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--foreground))'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => setSelectedPlatform(platform.value)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all border-2"
                    style={{
                      background: selectedPlatform === platform.value ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                      borderColor: selectedPlatform === platform.value ? platform.color : 'hsl(var(--border))',
                      color: selectedPlatform === platform.value ? 'hsl(var(--primary-foreground))' : 'hsl(var(--card-foreground))',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: platform.color }}
                    />
                    <span className="text-sm font-medium">{platform.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                Post Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
                style={{
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  borderColor: 'hsl(var(--border))',
                }}
                rows={4}
                maxLength={280}
              />
              <div className="text-xs mt-1 text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {content.length}/280
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium transition-colors border"
                style={{
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  borderColor: 'hsl(var(--border))',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg font-medium transition-colors"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                Schedule Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
