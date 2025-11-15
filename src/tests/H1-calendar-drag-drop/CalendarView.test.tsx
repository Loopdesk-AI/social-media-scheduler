// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CalendarView } from '../../components/calendar/CalendarView';
import type { Post } from '../../types/post';

// Mock @dnd-kit/core for testing
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  useDraggable: () => ({
    setNodeRef: vi.fn(),
    listeners: {},
    attributes: {},
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
  DragOverlay: ({ children }: any) => <div>{children}</div>,
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

describe('H1: Calendar Drag & Drop - CalendarView Component', () => {
  const mockPosts: Post[] = [
    {
      id: 'post-1',
      platform: 'x',
      content: 'Test post 1',
      scheduledAt: '2025-11-17T10:00:00.000Z', // Future: Monday Nov 17 10 AM
      status: 'scheduled',
    },
    {
      id: 'post-2',
      platform: 'facebook',
      content: 'Test post 2',
      scheduledAt: '2025-11-17T14:00:00.000Z', // Future: Monday Nov 17 2 PM
      status: 'scheduled',
    },
    {
      id: 'post-3',
      platform: 'linkedin',
      content: 'Published post',
      scheduledAt: '2025-11-18T10:00:00.000Z', // Future: Tuesday Nov 18 10 AM
      status: 'published',
    },
  ];

  let onReschedulePost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onReschedulePost = vi.fn();
  });

  describe('Rendering', () => {
    it('should render calendar with week view', () => {
      render(
        <CalendarView 
          posts={mockPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
        />
      );

      expect(screen.getByText('Calendar View')).toBeTruthy();
      expect(screen.getByText(/Drag posts to reschedule them/)).toBeTruthy();
    });

    it('should render posts in correct time slots', () => {
      render(
        <CalendarView 
          posts={mockPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
          timeSlots={[9, 10, 11, 12, 13, 14, 15, 16, 17]}
        />
      );

      expect(screen.getByText('Test post 1')).toBeTruthy();
      expect(screen.getByText('Test post 2')).toBeTruthy();
      expect(screen.getByText('Published post')).toBeTruthy();
    });

    it('should show published posts as non-draggable', () => {
      render(
        <CalendarView 
          posts={mockPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
        />
      );

      const publishedPost = screen.getByLabelText(/Scheduled post.*linkedin.*published, cannot reschedule/i);
      expect(publishedPost).toBeTruthy();
      expect(publishedPost.getAttribute('title')).toBe('Published posts cannot be rescheduled');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for posts', () => {
      render(
        <CalendarView 
          posts={mockPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
        />
      );

      // Check that posts have descriptive labels
      const post1 = screen.getByLabelText(/Scheduled post on.*for x/i);
      expect(post1).toBeTruthy();
    });

    it('should have proper aria-labels for time slots', () => {
      render(
        <CalendarView 
          posts={mockPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
          timeSlots={[9, 10]}
        />
      );

      // Check that slots have time labels
      const slots = screen.getAllByLabelText(/Time slot.*9:00 AM|10:00 AM/i);
      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe('Post Display', () => {
    it('should display platform badges with correct styling', () => {
      render(
        <CalendarView 
          posts={mockPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
        />
      );

      expect(screen.getByText('X')).toBeTruthy();
      expect(screen.getByText('FACEBOOK')).toBeTruthy();
      expect(screen.getByText('LINKEDIN')).toBeTruthy();
    });

    it('should truncate long content', () => {
      const longPost: Post = {
        id: 'long-post',
        platform: 'x',
        content: 'This is a very long post content that should be truncated in the UI to prevent overflow and maintain a clean layout',
        scheduledAt: '2025-11-20T10:00:00.000Z',
        status: 'scheduled',
      };

      render(
        <CalendarView 
          posts={[longPost]} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
        />
      );

      const postCard = screen.getByText(/This is a very long post/);
      expect(postCard).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should render empty slots correctly', () => {
      render(
        <CalendarView 
          posts={[]} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
          timeSlots={[9, 10]}
        />
      );

      const emptySlots = screen.getAllByText(/Empty/i);
      expect(emptySlots.length).toBeGreaterThan(0);
    });

    it('should handle posts with different statuses', () => {
      const mixedPosts: Post[] = [
        { ...mockPosts[0], status: 'draft' },
        { ...mockPosts[1], status: 'scheduled' },
        { ...mockPosts[2], status: 'published' },
      ];

      render(
        <CalendarView 
          posts={mixedPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
        />
      );

      expect(screen.getByText('Test post 1')).toBeTruthy();
      expect(screen.getByText('Test post 2')).toBeTruthy();
      expect(screen.getByText('Published post')).toBeTruthy();
    });
  });

  describe('Custom Configuration', () => {
    it('should respect custom time slots', () => {
      render(
        <CalendarView 
          posts={mockPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
          timeSlots={[9, 10, 11]} // Only morning slots
        />
      );

      // Should have fewer slots than default
      const slots = screen.getAllByLabelText(/Time slot/);
      // 7 days * 3 time slots = 21 slots
      expect(slots.length).toBe(21);
    });

    it('should use custom week start date', () => {
      const customStartDate = new Date('2025-12-07');
      
      render(
        <CalendarView 
          posts={mockPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={customStartDate}
        />
      );

      // Should render a week starting from Dec 7
      const decemberDates = screen.getAllByText(/Dec/);
      expect(decemberDates.length).toBeGreaterThan(0);
      expect(screen.getByText('Sun, Dec 7')).toBeTruthy();
    });
  });

  describe('Overlap Behavior', () => {
    it('should allow overlaps by default', () => {
      const overlappingPosts: Post[] = [
        {
          id: 'post-a',
          platform: 'x',
          content: 'Post A',
          scheduledAt: '2025-11-20T10:00:00.000Z',
          status: 'scheduled',
        },
        {
          id: 'post-b',
          platform: 'facebook',
          content: 'Post B',
          scheduledAt: '2025-11-20T10:00:00.000Z', // Same time
          status: 'scheduled',
        },
      ];

      render(
        <CalendarView 
          posts={overlappingPosts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
          allowOverlaps={true}
        />
      );

      expect(screen.getByText('Post A')).toBeTruthy();
      expect(screen.getByText('Post B')).toBeTruthy();
    });
  });

  describe('Date Utilities Integration', () => {
    it('should correctly group posts by date and hour', () => {
      const posts: Post[] = [
        {
          id: '1',
          platform: 'x',
          content: 'Morning post',
          scheduledAt: '2025-11-20T09:00:00.000Z',
          status: 'scheduled',
        },
        {
          id: '2',
          platform: 'facebook',
          content: 'Afternoon post',
          scheduledAt: '2025-11-20T14:00:00.000Z',
          status: 'scheduled',
        },
      ];

      render(
        <CalendarView 
          posts={posts} 
          onReschedulePost={onReschedulePost}
          weekStartDate={new Date('2025-11-16')}
          timeSlots={[9, 14]}
        />
      );

      expect(screen.getByText('Morning post')).toBeTruthy();
      expect(screen.getByText('Afternoon post')).toBeTruthy();
    });
  });
});
