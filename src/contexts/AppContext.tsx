import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Integration, Post } from '../lib/api';
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
  posts: Post[];
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  refreshIntegrations: () => Promise<void>;
  refreshPosts: (filters?: any) => Promise<void>;
  connectIntegration: (provider: string) => Promise<void>;
  disconnectIntegration: (id: string) => Promise<void>;
  createPost: (data: any) => Promise<void>;
  createMultiPlatformPost: (data: any) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
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
        setUser(response.data);
        setLoading(false);
        // Load data after auth
        refreshIntegrations();
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

  const refreshIntegrations = async () => {
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load social accounts');
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = async (filters?: any) => {
    try {
      const data = await api.getPosts(filters);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load scheduled posts');
    }
  };

  const connectIntegration = async (provider: string) => {
    try {
      const { url } = await api.getAuthUrl(provider);
      // Open OAuth window
      window.location.href = url;
    } catch (error) {
      console.error('Failed to connect integration:', error);
      toast.error('Failed to connect account');
    }
  };

  const disconnectIntegration = async (id: string) => {
    try {
      await api.deleteIntegration(id);
      await refreshIntegrations();
      toast.success('Account disconnected');
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
      toast.error('Failed to disconnect account');
    }
  };

  const createPost = async (data: any) => {
    try {
      await api.createPost(data);
      await refreshPosts();
      toast.success('Post scheduled successfully');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to schedule post');
      throw error;
    }
  };

  const createMultiPlatformPost = async (data: any) => {
    try {
      await api.createMultiPlatformPost(data);
      await refreshPosts();
      toast.success('Posts scheduled successfully');
    } catch (error) {
      console.error('Failed to create multi-platform post:', error);
      toast.error('Failed to schedule posts');
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      await api.deletePost(id);
      await refreshPosts();
      toast.success('Post deleted');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        integrations,
        posts,
        loading,
        setUser,
        setToken,
        logout,
        refreshIntegrations,
        refreshPosts,
        connectIntegration,
        disconnectIntegration,
        createPost,
        createMultiPlatformPost,
        deletePost,
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