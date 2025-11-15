import { Plus, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Platform, Post } from '../types/post';
import { CreatePostModal } from './CreatePostModal';
import { MonthCalendarView } from './MonthCalendarView';
import { PostDetailsModal } from './PostDetailsModal';
import { UploadVideoModal } from './UploadVideoModal';

export function CalendarView() {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Posts state management
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      platform: 'x',
      content: 'Check out our latest blog post!',
      scheduledAt: '2025-11-17T10:00:00.000Z',
      status: 'scheduled',
    },
    {
      id: '2',
      platform: 'facebook',
      content: 'Join us for our weekly webinar',
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

  // Handle creating a new post
  const handleCreatePost = (newPost: {
    platform: Platform;
    content: string;
    scheduledAt: string;
  }) => {
    const post: Post = {
      id: `post-${Date.now()}`,
      ...newPost,
      status: 'scheduled',
    };
    
    console.log('Creating new post:', post);
    setPosts((prevPosts) => {
      const updated = [...prevPosts, post];
      console.log('Updated posts:', updated);
      return updated;
    });
    toast.success('Post scheduled successfully!');
  };

  // Handle rescheduling a post via drag-and-drop or modal
  const handleReschedulePost = (postId: string, newScheduledAt: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, scheduledAt: newScheduledAt }
          : post
      )
    );
    toast.success('Post rescheduled successfully!');
  };

  // Handle post click to show details
  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  // Handle post deletion
  const handleDeletePost = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    toast.success('Post deleted successfully!');
  };
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Calendar</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            <Plus size={18} />
            Schedule post
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
            style={{ background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', borderColor: 'hsl(var(--border))' }}
          >
            <Upload size={18} />
            Upload local video
          </button>
        </div>
      </div>

      {/* Month Calendar with Drag-and-Drop */}
      <MonthCalendarView
        posts={posts}
        onReschedulePost={handleReschedulePost}
        onPostClick={handlePostClick}
      />

      {isScheduleModalOpen && (
        <CreatePostModal 
          onClose={() => setIsScheduleModalOpen(false)}
          onCreatePost={handleCreatePost}
        />
      )}
      {isUploadModalOpen && <UploadVideoModal onClose={() => setIsUploadModalOpen(false)} />}
      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onReschedule={handleReschedulePost}
          onDelete={handleDeletePost}
        />
      )}
    </div>
  );
}
