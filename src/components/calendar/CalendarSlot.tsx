import { useDroppable } from '@dnd-kit/core';
import React from 'react';
import type { Post } from '../../types/post';
import { isPastDate } from '../../utils/datetime';
import { CalendarPostCard } from './CalendarPostCard';
import styles from './CalendarSlot.module.css';

interface CalendarSlotProps {
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  posts: Post[];
  allowOverlaps?: boolean; // Whether multiple posts can be in the same slot
}

/**
 * CalendarSlot - Droppable time slot in the calendar
 * 
 * Features:
 * - Drop target for posts
 * - Shows visual feedback when active drop target
 * - Prevents drops into past slots
 * - Can optionally prevent overlaps
 * - Accessible with aria-labels
 */
export const CalendarSlot: React.FC<CalendarSlotProps> = ({ 
  date, 
  hour, 
  posts,
  allowOverlaps = true 
}) => {
  const slotId = `${date}-${hour}`;
  const slotDateTime = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).toISOString();
  
  // Check if this slot is in the past
  const isPast = isPastDate(slotDateTime);
  
  // Check if slot is at capacity (only relevant if overlaps not allowed)
  const isAtCapacity = !allowOverlaps && posts.length > 0;
  
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    // Prevent drops into past or full slots
    disabled: isPast || isAtCapacity,
    data: {
      date,
      hour,
      slotDateTime,
    },
  });

  const formatHour = (h: number): string => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        ${styles['calendar-slot']}
        ${isOver && !isPast && !isAtCapacity ? styles['drop-target--active'] : ''}
        ${isOver && (isPast || isAtCapacity) ? styles['drop-target--invalid'] : ''}
        ${posts.length === 0 ? styles['calendar-slot--empty'] : ''}
      `}
      aria-label={`Time slot ${date} ${formatHour(hour)}${isPast ? ' (past)' : ''}${isAtCapacity ? ' (full)' : ''}`}
      data-testid={`calendar-slot-${slotId}`}
    >
      <div className={styles['calendar-slot__time']}>
        {formatHour(hour)}
      </div>
      {posts.length === 0 ? (
        <div className={styles['calendar-slot--empty']}>
          {isPast ? 'Past' : 'Empty'}
        </div>
      ) : (
        posts.map(post => (
          <CalendarPostCard key={post.id} post={post} />
        ))
      )}
    </div>
  );
};
