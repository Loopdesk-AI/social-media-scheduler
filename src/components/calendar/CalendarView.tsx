import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import React, { useState } from 'react';
import type { Post } from '../../types/post';
import { getSlotDateTime, getWeekDates } from '../../utils/datetime';
import { CalendarDay } from './CalendarDay';
import { CalendarPostCard } from './CalendarPostCard';
import styles from './CalendarView.module.css';

interface CalendarViewProps {
  posts: Post[];
  onReschedulePost: (postId: string, newDateTime: string) => void;
  weekStartDate?: Date;
  timeSlots?: number[]; // Array of hours to display, defaults to business hours
  allowOverlaps?: boolean; // Whether to allow multiple posts in same slot
}

/**
 * CalendarView - Main calendar component with drag-and-drop functionality
 * 
 * Features:
 * - Week view with 7 day columns
 * - Drag-and-drop post rescheduling
 * - Prevents drops into past dates
 * - Prevents rescheduling published posts
 * - Keyboard accessible
 * - Handles edge cases (invalid drops, overlaps)
 * 
 * Strategy for overlaps:
 * - By default, allows overlaps (multiple posts in same slot)
 * - Can be disabled via allowOverlaps prop
 * - When disabled, slots with posts become non-droppable
 */
export const CalendarView: React.FC<CalendarViewProps> = ({ 
  posts, 
  onReschedulePost,
  weekStartDate,
  timeSlots = [9, 10, 11, 12, 13, 14, 15, 16, 17], // 9 AM to 5 PM by default
  allowOverlaps = true,
}) => {
  const [activePost, setActivePost] = useState<Post | null>(null);
  
  // Generate dates for the week
  const weekDates = React.useMemo(() => 
    getWeekDates(weekStartDate), 
    [weekStartDate]
  );

  // Setup sensors for drag-and-drop
  // PointerSensor: For mouse/touch dragging
  // KeyboardSensor: For keyboard navigation (accessibility)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to activate
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Called when drag starts
   * Stores the active post for overlay rendering
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const post = active.data.current?.post as Post | undefined;
    
    if (post) {
      setActivePost(post);
    }
  };

  /**
   * Called when drag ends
   * 
   * Logic:
   * 1. Check if dropped over a valid slot
   * 2. If no valid destination, do nothing (post returns to original position)
   * 3. Extract date and hour from drop target
   * 4. Compute new datetime
   * 5. Call onReschedulePost callback
   * 
   * Edge cases handled:
   * - Invalid drops (outside any slot): No action taken
   * - Past slots: Prevented by CalendarSlot component
   * - Published posts: Prevented by CalendarPostCard component
   * - Overlaps: Handled based on allowOverlaps prop
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Clear active post
    setActivePost(null);

    // If not dropped over a valid target, do nothing
    if (!over) {
      console.log('Drop outside valid target - reverting');
      return;
    }

    const postId = active.id as string;
    const dropData = over.data.current;

    // Extract slot data
    const targetDate = dropData?.date as string | undefined;
    const targetHour = dropData?.hour as number | undefined;

    if (!targetDate || targetHour === undefined) {
      console.log('Invalid drop target data - reverting');
      return;
    }

    // Compute new datetime based on target slot
    const newDateTime = getSlotDateTime(targetDate, targetHour);

    console.log(`Rescheduling post ${postId} to ${newDateTime}`);
    
    // Call the reschedule callback
    onReschedulePost(postId, newDateTime);
  };

  /**
   * Called when drag is cancelled (e.g., ESC key)
   */
  const handleDragCancel = () => {
    setActivePost(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles['calendar-view']}>
        <div className={styles['calendar-view__header']}>
          <h1 className={styles['calendar-view__title']}>
            Calendar View
          </h1>
          <p className={styles['calendar-view__subtitle']}>
            Drag posts to reschedule them. Published posts cannot be moved.
          </p>
        </div>

        <div className={styles['calendar-view__grid']}>
          {weekDates.map(date => (
            <CalendarDay
              key={date}
              date={date}
              posts={posts}
              timeSlots={timeSlots}
              allowOverlaps={allowOverlaps}
            />
          ))}
        </div>
      </div>

      {/* DragOverlay shows the dragged post while dragging */}
      <DragOverlay>
        {activePost ? <CalendarPostCard post={activePost} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
