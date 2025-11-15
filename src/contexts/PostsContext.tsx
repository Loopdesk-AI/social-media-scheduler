import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Post, PostStatus } from '../types';

interface PostsContextType {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  filteredPosts: Post[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  platformFilter: string;
  setPlatformFilter: (platform: string) => void;
  statusFilter: PostStatus | 'all';
  setStatusFilter: (status: PostStatus | 'all') => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

const STORAGE_KEY = 'loopdesk-posts';

// Sample posts for testing
const SAMPLE_POSTS: Post[] = [
  {
    id: '1',
    content: 'Excited to announce our new AI-powered scheduling feature! 🚀 Save hours every week with intelligent post suggestions.',
    platforms: ['x', 'linkedin'],
    scheduledDate: new Date(2024, 10, 20, 14, 0),
    status: 'scheduled',
    createdAt: new Date(2024, 10, 15),
    updatedAt: new Date(2024, 10, 15),
  },
  {
    id: '2',
    content: 'Check out our latest blog post about social media marketing trends for 2024! Link in bio 📱',
    platforms: ['instagram', 'facebook'],
    scheduledDate: new Date(2024, 10, 22, 10, 30),
    status: 'scheduled',
    createdAt: new Date(2024, 10, 14),
    updatedAt: new Date(2024, 10, 14),
  },
  {
    id: '3',
    content: 'Join us for a live webinar on content strategy next Tuesday at 2 PM EST! Register now 🎯',
    platforms: ['linkedin', 'x'],
    scheduledDate: new Date(2024, 10, 19, 14, 0),
    status: 'published',
    createdAt: new Date(2024, 10, 10),
    updatedAt: new Date(2024, 10, 19),
  },
  {
    id: '4',
    content: 'Behind the scenes at our office! Meet the team that makes the magic happen ✨',
    platforms: ['instagram', 'tiktok'],
    scheduledDate: new Date(2024, 10, 25, 12, 0),
    status: 'draft',
    createdAt: new Date(2024, 10, 16),
    updatedAt: new Date(2024, 10, 16),
  },
  {
    id: '5',
    content: 'New YouTube video: "10 Tips for Better Social Media Engagement" - Watch now! 🎥',
    platforms: ['youtube', 'x', 'facebook'],
    scheduledDate: new Date(2024, 10, 21, 9, 0),
    status: 'scheduled',
    createdAt: new Date(2024, 10, 13),
    updatedAt: new Date(2024, 10, 13),
  },
  {
    id: '6',
    content: 'Happy Friday! What are your weekend plans? Drop a comment below 👇',
    platforms: ['facebook', 'instagram'],
    scheduledDate: new Date(2024, 10, 18, 17, 0),
    status: 'published',
    createdAt: new Date(2024, 10, 12),
    updatedAt: new Date(2024, 10, 18),
  },
];

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((post: any) => ({
          ...post,
          scheduledDate: new Date(post.scheduledDate),
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
        }));
      } catch {
        return SAMPLE_POSTS;
      }
    }
    return SAMPLE_POSTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');

  // Save to localStorage whenever posts change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  // Filter posts based on search and filters
  const filteredPosts = posts.filter((post) => {
    // Search filter
    const matchesSearch = post.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Platform filter
    const matchesPlatform =
      platformFilter === 'all' || post.platforms.includes(platformFilter);

    // Status filter
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const addPost = (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPost: Post = {
      ...postData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? { ...post, ...updates, updatedAt: new Date() }
          : post
      )
    );
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        addPost,
        updatePost,
        deletePost,
        filteredPosts,
        searchQuery,
        setSearchQuery,
        platformFilter,
        setPlatformFilter,
        statusFilter,
        setStatusFilter,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}

