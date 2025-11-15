import { Calendar, Clock, X } from 'lucide-react';
import { useState } from 'react';
import type { Platform, Post } from '../types/post';

interface PostDetailsModalProps {
  post: Post;
  onClose: () => void;
  onReschedule: (postId: string, newScheduledAt: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostDetailsModal({
  post,
  onClose,
  onReschedule,
  onDelete,
}: PostDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date(post.scheduledAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    const date = new Date(post.scheduledAt);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  const platformColors: Record<Platform, string> = {
    x: '#1DA1F2',
    facebook: '#1877F2',
    linkedin: '#0A66C2',
    instagram: '#E4405F',
    tiktok: '#000000',
    youtube: '#FF0000',
  };

  const platformLabels: Record<Platform, string> = {
    x: 'X (Twitter)',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    youtube: 'YouTube',
    tiktok: 'TikTok',
  };

  const handleRescheduleSubmit = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDateTime = new Date(year, month - 1, day, hours, minutes);
    onReschedule(post.id, newDateTime.toISOString());
    onClose();
  };

  const formattedDate = new Date(post.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(post.scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border"
        style={{
          background: 'hsl(var(--card))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ background: platformColors[post.platform] }}
              />
              <div>
                <h2
                  className="text-xl font-semibold"
                  style={{ color: 'hsl(var(--card-foreground))' }}
                >
                  {platformLabels[post.platform]} Post
                </h2>
                <div
                  className="text-sm mt-1"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  Status:{' '}
                  <span
                    className="font-medium"
                    style={{
                      color:
                        post.status === 'published'
                          ? '#10B981'
                          : post.status === 'scheduled'
                          ? '#3B82F6'
                          : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="transition-colors p-1 rounded-md"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'hsl(var(--foreground))')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')
              }
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Post Content
              </label>
              <div
                className="px-4 py-3 rounded-lg border"
                style={{
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  borderColor: 'hsl(var(--border))',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {post.content}
              </div>
            </div>

            {/* Schedule Info */}
            {!isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      Scheduled for
                    </div>
                    <div
                      className="font-medium"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {formattedDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      Time
                    </div>
                    <div
                      className="font-medium"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {formattedTime}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    New Date
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
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    New Time
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
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              {post.status !== 'published' && (
                <>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 rounded-lg font-medium transition-colors"
                      style={{
                        background: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                      }}
                    >
                      Reschedule
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
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
                        onClick={handleRescheduleSubmit}
                        className="px-6 py-3 rounded-lg font-medium transition-colors"
                        style={{
                          background: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                        }}
                      >
                        Save Changes
                      </button>
                    </>
                  )}
                </>
              )}
              {onDelete && post.status !== 'published' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this post?')) {
                      onDelete(post.id);
                      onClose();
                    }
                  }}
                  className="px-6 py-3 rounded-lg font-medium transition-colors border"
                  style={{
                    background: 'hsl(var(--card))',
                    color: '#EF4444',
                    borderColor: '#EF4444',
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
