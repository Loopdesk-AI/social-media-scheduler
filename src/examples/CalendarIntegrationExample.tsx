import React, { useState } from 'react';
import { CalendarView } from '../components/calendar/CalendarView';
import { Post } from '../types/post';

/**
 * Example integration showing how to use the CalendarView component
 * in your social media scheduler app.
 * 
 * This demonstrates:
 * 1. Managing posts state
 * 2. Handling post rescheduling
 * 3. Configuring the calendar
 * 4. Integration with existing data structures
 */

export const CalendarIntegrationExample: React.FC = () => {
  // Sample posts data - replace with your actual data source
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      platform: 'x',
      content: 'Check out our new product launch! 🚀',
      scheduledAt: '2025-11-17T10:00:00.000Z',
      status: 'scheduled',
    },
    {
      id: '2',
      platform: 'facebook',
      content: 'Join us for a live Q&A session this Friday',
      scheduledAt: '2025-11-17T14:00:00.000Z',
      status: 'scheduled',
    },
    {
      id: '3',
      platform: 'linkedin',
      content: 'Our team is growing! Check out open positions',
      scheduledAt: '2025-11-18T09:00:00.000Z',
      status: 'scheduled',
    },
    {
      id: '4',
      platform: 'instagram',
      content: 'Behind the scenes at our office 📸',
      scheduledAt: '2025-11-19T15:00:00.000Z',
      status: 'published',
    },
  ]);

  /**
   * Handle rescheduling a post to a new time slot
   * This callback is triggered when a user drags and drops a post
   */
  const handleReschedulePost = (postId: string, newScheduledAt: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, scheduledAt: newScheduledAt }
          : post
      )
    );

    // Optional: Show success message
    console.log(`Post ${postId} rescheduled to ${newScheduledAt}`);
    
    // Optional: Sync with backend API
    // await api.updatePost(postId, { scheduledAt: newScheduledAt });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px', color: 'hsl(var(--foreground))' }}>
        Social Media Calendar
      </h1>
      
      {/* Basic usage with defaults */}
      <CalendarView
        posts={posts}
        onReschedulePost={handleReschedulePost}
      />
      
      {/* Advanced usage with custom configuration */}
      {/* 
      <CalendarView
        posts={posts}
        onReschedulePost={handleReschedulePost}
        weekStartDate={new Date('2025-11-17')} // Start week on specific date
        timeSlots={[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]} // Extended hours
        allowOverlaps={false} // Prevent multiple posts in same slot
      />
      */}
    </div>
  );
};

/**
 * Integration with your existing router (AppRouter.tsx):
 * 
 * import { CalendarIntegrationExample } from './examples/CalendarIntegrationExample';
 * 
 * // Add to your routes:
 * <Route path="/calendar" element={<CalendarIntegrationExample />} />
 */

/**
 * Integration with existing state management:
 * 
 * If you're using Context or Redux:
 * 
 * const { posts, updatePost } = usePostsContext();
 * 
 * const handleReschedulePost = async (postId: string, newScheduledAt: string) => {
 *   try {
 *     await updatePost(postId, { scheduledAt: newScheduledAt });
 *     toast.success('Post rescheduled successfully');
 *   } catch (error) {
 *     toast.error('Failed to reschedule post');
 *   }
 * };
 */
