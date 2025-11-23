import { createContext, useContext, useState, ReactNode } from 'react';
import { Post } from '@/types';
import { v4 as uuidv4 } from 'uuid';

type PostsContextType = {
  posts: Post[];
  addPost: (post: Omit<Post, 'id'>) => void;
  clearPosts: () => void;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const usePosts = () => {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
};

export const PostsProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const raw = localStorage.getItem('scheduledPosts');
      return raw ? (JSON.parse(raw) as Post[]) : [];
    } catch {
      return [];
    }
  });

  const persist = (next: Post[]) => {
    setPosts(next);
    try {
      localStorage.setItem('scheduledPosts', JSON.stringify(next));
    } catch {}
  };

  const addPost = (post: Omit<Post, 'id'>) => {
    const next = [{ ...post, id: uuidv4() }, ...posts];
    persist(next);
  };

  const clearPosts = () => {
    persist([]);
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, clearPosts }}>
      {children}
    </PostsContext.Provider>
  );
};

export default PostsContext;
