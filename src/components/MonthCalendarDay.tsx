import { useDroppable } from '@dnd-kit/core';
import React from 'react';
import type { Post } from '../types/post';
import { MonthCalendarPostCard } from './MonthCalendarPostCard';

interface MonthCalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: Post[];
  isLastColumn: boolean;
  onPostClick?: (post: Post) => void;
}

export const MonthCalendarDay: React.FC<MonthCalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday,
  posts,
  isLastColumn,
  onPostClick,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${date.toISOString().split('T')[0]}`,
    data: {
      date,
    },
  });

  const cellStyle: React.CSSProperties = {
    minHeight: 120,
    padding: 12,
    borderRight: isLastColumn ? '0' : '1px solid',
    borderBottom: '1px solid',
    borderRightColor: 'hsl(var(--border))',
    borderBottomColor: 'hsl(var(--border))',
    background: isOver
      ? 'hsl(var(--primary) / 0.1)'
      : isCurrentMonth
      ? 'transparent'
      : 'hsl(var(--muted))',
    color: isCurrentMonth
      ? 'hsl(var(--card-foreground))'
      : 'hsl(var(--muted-foreground))',
    transition: 'background-color 0.2s',
  };

  const dateCircleStyle: React.CSSProperties = isToday
    ? {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        width: 28,
        height: 28,
        borderRadius: '9999px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
      }
    : {
        fontWeight: 600,
      };

  return (
    <div ref={setNodeRef} style={cellStyle}>
      <div style={{ marginBottom: 8, fontSize: 14 }}>
        <span style={dateCircleStyle}>{date.getDate()}</span>
      </div>
      <div className="space-y-1">
        {posts.map((post) => (
          <MonthCalendarPostCard 
            key={post.id} 
            post={post}
            onPostClick={onPostClick}
          />
        ))}
      </div>
    </div>
  );
};
