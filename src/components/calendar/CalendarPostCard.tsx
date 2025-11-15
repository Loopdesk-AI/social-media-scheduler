import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import type { Post } from '../../types/post';
import { formatDateTimeLabel } from '../../utils/datetime';
import styles from './CalendarPostCard.module.css';

interface CalendarPostCardProps {
  post: Post;
}

/**
 * CalendarPostCard - Draggable card representing a scheduled post
 * 
 * Features:
 * - Draggable via @dnd-kit
 * - Shows platform, content preview, and time
 * - Published posts are not draggable (visual indicator)
 * - Accessible with aria-labels
 */
export const CalendarPostCard: React.FC<CalendarPostCardProps> = ({ post }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: post.id,
    // Disable dragging for published posts
    disabled: post.status === 'published',
    data: {
      post,
    },
  });

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${styles['calendar-post-card']}
        ${isDragging ? styles['is-dragging'] : ''}
        ${isPublished ? styles['is-published'] : ''}
      `}
      {...(isPublished ? {} : { ...listeners, ...attributes })}
      aria-label={`Scheduled post on ${formatDateTimeLabel(post.scheduledAt)} for ${post.platform}${isPublished ? ' (published, cannot reschedule)' : ''}`}
      title={isPublished ? 'Published posts cannot be rescheduled' : 'Drag to reschedule'}
    >
      <div 
        className={styles['calendar-post-card__platform']}
        style={{ color: platformColors[post.platform] }}
      >
        {post.platform.toUpperCase()}
      </div>
      <div className={styles['calendar-post-card__content']}>
        {post.content}
      </div>
      <div className={styles['calendar-post-card__time']}>
        {new Date(post.scheduledAt).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}
      </div>
    </div>
  );
};
