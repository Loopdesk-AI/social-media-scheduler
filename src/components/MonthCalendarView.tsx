import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import type { Post } from '../types/post';
import { MonthCalendarDay } from './MonthCalendarDay';
import { MonthCalendarPostCard } from './MonthCalendarPostCard';

interface MonthCalendarViewProps {
  posts: Post[];
  onReschedulePost: (postId: string, newDateTime: string) => void;
  onPostClick?: (post: Post) => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  posts,
  onReschedulePost,
  onPostClick,
}) => {
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Add days from next month to complete the grid
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get posts for a specific date (using local dates to avoid timezone issues)
  const getPostsForDate = (date: Date): Post[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return posts.filter((post) => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getFullYear() === year &&
        postDate.getMonth() === month &&
        postDate.getDate() === day
      );
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const post = active.data.current?.post as Post | undefined;
    if (post) {
      setActivePost(post);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePost(null);

    if (!over) {
      return;
    }

    const postId = active.id as string;
    const targetDate = over.data.current?.date as Date | undefined;

    if (!targetDate) {
      return;
    }

    // Keep the same time, just change the date
    const originalPost = posts.find((p) => p.id === postId);
    if (!originalPost) {
      return;
    }

    const originalTime = new Date(originalPost.scheduledAt);
    // Create new date using local date components to avoid timezone issues
    const newDateTime = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      originalTime.getHours(),
      originalTime.getMinutes(),
      originalTime.getSeconds()
    );

    onReschedulePost(postId, newDateTime.toISOString());
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid',
          borderColor: 'hsl(var(--border))',
          color: 'hsl(var(--card-foreground))',
        }}
      >
        {/* Calendar Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid', borderBottomColor: 'hsl(var(--border))' }}
        >
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-sm font-medium p-4 text-center"
              style={{
                color: 'hsl(var(--muted-foreground))',
                borderBottom: '1px solid',
                borderBottomColor: 'hsl(var(--border))',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <MonthCalendarDay
              key={index}
              date={day.date}
              isCurrentMonth={day.isCurrentMonth}
              isToday={isToday(day.date)}
              posts={getPostsForDate(day.date)}
              isLastColumn={index % 7 === 6}
              onPostClick={onPostClick}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activePost ? <MonthCalendarPostCard post={activePost} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};
