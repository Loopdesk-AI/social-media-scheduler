import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import type { Post } from '../types/post';

interface MonthCalendarPostCardProps {
  post: Post;
  isDragging?: boolean;
  onPostClick?: (post: Post) => void;
}

export const MonthCalendarPostCard: React.FC<MonthCalendarPostCardProps> = ({
  post,
  isDragging = false,
  onPostClick,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: post.id,
    disabled: post.status === 'published',
    data: {
      post,
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if we're dragging
    if (transform) return;
    e.stopPropagation();
    if (onPostClick) {
      onPostClick(post);
    }
  };

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const platformColors: Record<Post['platform'], string> = {
    x: '#1DA1F2',
    facebook: '#1877F2',
    linkedin: '#0A66C2',
    instagram: '#E4405F',
    tiktok: '#000000',
    youtube: '#FF0000',
  };

  const isPublished = post.status === 'published';

  const time = new Date(post.scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const cardStyle: React.CSSProperties = {
    ...style,
    background: isPublished
      ? 'hsl(var(--muted))'
      : platformColors[post.platform] + '20',
    borderLeft: `3px solid ${platformColors[post.platform]}`,
    opacity: isDragging ? 0.5 : 1,
    cursor: isPublished ? 'default' : 'grab',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    transition: 'box-shadow 0.2s',
    marginBottom: '0.25rem',
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...(isPublished ? {} : { ...listeners, ...attributes })}
      onClick={handleClick}
      title={isPublished ? 'Published posts cannot be rescheduled' : 'Click to view or drag to reschedule'}
      onMouseEnter={(e) => {
        if (!isPublished) {
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="font-semibold truncate"
        style={{ color: platformColors[post.platform] }}
      >
        {post.platform.toUpperCase()}
      </div>
      <div
        className="truncate"
        style={{ color: 'hsl(var(--card-foreground))' }}
      >
        {post.content}
      </div>
      <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.7rem' }}>
        {time}
      </div>
    </div>
  );
};
