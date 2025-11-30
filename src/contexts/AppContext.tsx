import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, Integration, Post, StorageIntegration } from '../lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  timezone: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  integrations: Integration[];
  storageIntegrations: StorageIntegration[];
  posts: Post[];
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  refreshIntegrations: () => Promise<void>;
  refreshStorageIntegrations: () => Promise<void>;
  refreshPosts: (filters?: any) => Promise<void>;
  connectIntegration: (provider: string) => Promise<void>;
  disconnectIntegration: (id: string) => Promise<void>;
  createPost: (data: any) => Promise<void>;
  createMultiPlatformPost: (data: any) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  reschedulePost: (id: string, date: string) => Promise<void>;
  updatePost: (id: string, data: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [storageIntegrations, setStorageIntegrations] = useState<StorageIntegration[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Load auth token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Load user and data when token changes
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch current user
    api.get('/auth/me')
      .then((response: any) => {
        setUser(response);
        setLoading(false);
        // Load data after auth
        refreshIntegrations();
        refreshStorageIntegrations();
        refreshPosts();
      })
      .catch(() => {
        // Token invalid, clear it
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, [token]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
    setIntegrations([]);
    setPosts([]);
    toast.success('Logged out successfully');
  };

  const refreshIntegrations = useCallback(async () => {
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load social accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStorageIntegrations = useCallback(async () => {
    try {
      const data = await api.getStorageIntegrations();
      setStorageIntegrations(data);
    } catch (error) {
      console.error('Failed to load storage integrations:', error);
    }
  }, []);

  const refreshPosts = useCallback(async (filters?: any) => {
    try {
      const data = await api.getPosts(filters);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load scheduled posts');
    }
  }, []);

  const connectIntegration = useCallback(async (provider: string) => {
    try {
      const { url } = await api.getAuthUrl(provider);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to connect integration:', error);
      toast.error('Failed to connect account');
    }
  }, []);

  const disconnectIntegration = useCallback(async (id: string) => {
    try {
      await api.deleteIntegration(id);
      await refreshIntegrations();
      toast.success('Account disconnected');
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
      toast.error('Failed to disconnect account');
    }
  }, [refreshIntegrations]);

  const createPost = useCallback(async (data: any) => {
    try {
      await api.createPost(data);
      await refreshPosts();
      toast.success('Post scheduled successfully');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to schedule post');
      throw error;
    }
  }, [refreshPosts]);

  const createMultiPlatformPost = useCallback(async (data: any) => {
    try {
      await api.createMultiPlatformPost(data);
      await refreshPosts();
      toast.success('Posts scheduled successfully');
    } catch (error) {
      console.error('Failed to create multi-platform post:', error);
      toast.error('Failed to schedule posts');
      throw error;
    }
  }, [refreshPosts]);

  const deletePost = useCallback(async (id: string) => {
    try {
      await api.deletePost(id);
      await refreshPosts();
      toast.success('Post deleted');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  }, [refreshPosts]);

  const reschedulePost = useCallback(async (id: string, date: string) => {
    try {
      await api.reschedulePost(id, date);
      await refreshPosts();
      toast.success('Post rescheduled successfully');
    } catch (error) {
      console.error('Failed to reschedule post:', error);
      toast.error('Failed to reschedule post');
      throw error;
    }
  }, [refreshPosts]);

  const updatePost = useCallback(async (id: string, data: any) => {
    try {
      await api.updatePost(id, data);
      await refreshPosts();
      toast.success('Post updated successfully');
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error('Failed to update post');
      throw error;
    }
  }, [refreshPosts]);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        integrations,
        storageIntegrations,
        posts,
        loading,
        setUser,
        setToken,
        logout,
        refreshIntegrations,
        refreshStorageIntegrations,
        refreshPosts,
        connectIntegration,
        disconnectIntegration,

        createPost,
        createMultiPlatformPost,
        deletePost,
        reschedulePost,
        updatePost,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}