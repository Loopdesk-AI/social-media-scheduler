import React from 'react';
import type { Post } from '../../types/post';
import { formatDayHeader, getDateString, getHourFromISO } from '../../utils/datetime';
import styles from './CalendarDay.module.css';
import { CalendarSlot } from './CalendarSlot';

interface CalendarDayProps {
  date: string; // YYYY-MM-DD
  posts: Post[];
  timeSlots: number[]; // Array of hours to display (e.g., [9, 10, 11, ...])
  allowOverlaps?: boolean;
}

/**
 * CalendarDay - Column representing one day in the calendar
 * 
 * Features:
 * - Displays date header
 * - Contains multiple time slots
 * - Groups posts by hour
 */
export const CalendarDay: React.FC<CalendarDayProps> = ({ 
  date, 
  posts, 
  timeSlots,
  allowOverlaps = true 
}) => {
  // Group posts by hour for this specific date
  const postsByHour = React.useMemo(() => {
    const grouped: Record<number, Post[]> = {};
    
    posts.forEach(post => {
      const postDate = getDateString(post.scheduledAt);
      if (postDate === date) {
        const hour = getHourFromISO(post.scheduledAt);
        if (!grouped[hour]) {
          grouped[hour] = [];
        }
        grouped[hour].push(post);
      }
    });
    
    return grouped;
  }, [posts, date]);

  return (
    <div className={styles['calendar-day']}>
      <div className={styles['calendar-day__header']}>
        <div className={styles['calendar-day__date']}>
          {formatDayHeader(date)}
        </div>
      </div>
      <div className={styles['calendar-day__slots']}>
        {timeSlots.map(hour => (
          <CalendarSlot
            key={`${date}-${hour}`}
            date={date}
            hour={hour}
            posts={postsByHour[hour] || []}
            allowOverlaps={allowOverlaps}
          />
        ))}
      </div>
    </div>
  );
};
