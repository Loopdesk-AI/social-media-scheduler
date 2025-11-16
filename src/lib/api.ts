/**
 * API Client for Social Media Scheduler Backend
 * Handles all HTTP requests to the backend API
 */

/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

interface PlatformSpecificContent {
  content?: string;
  settings?: Record<string, any>;
}

interface CreateMultiPlatformPostData {
  integrationIds: string[];
  content: string;
  publishDate: string;
  settings?: Record<string, any>;
  platformSpecificContent?: Record<string, PlatformSpecificContent>;
  media?: Array<{
    path: string;
    type: string;
  }>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };
  }

  // Public methods for auth (no auth required)
  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get(endpoint: string) {
    return this.request(endpoint);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Integration endpoints
  async getIntegrationTypes() {
    return this.request<{ social: IntegrationType[] }>('/integrations/types');
  }

  async getIntegrations() {
    return this.request<Integration[]>('/integrations');
  }

  async getAuthUrl(provider: string) {
    try {
      return this.request<{ url: string; state: string; provider: string }>(
        `/integrations/${provider}/auth-url`
      );
    } catch (error: any) {
      if (error.message?.includes('Provider not found')) {
        throw new Error(`${provider} integration is coming soon! Only Instagram is available right now.`);
      }
      throw error;
    }
  }

  async handleOAuthCallback(provider: string, code: string, state: string) {
    return this.request<Integration>(`/integrations/${provider}/callback`, {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  async deleteIntegration(id: string) {
    return this.request(`/integrations/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleIntegration(id: string, disabled: boolean) {
    return this.request<Integration>(`/integrations/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ disabled }),
    });
  }

  // Post endpoints
  async createPost(data: CreatePostData) {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createMultiPlatformPost(data: CreateMultiPlatformPostData) {
    return this.request<Post[]>('/posts/multi-platform', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Media upload
  async uploadMedia(formData: FormData) {
    const url = `${this.baseUrl}/media/upload`;
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getPosts(filters?: PostFilters) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.provider) params.append('provider', filters.provider);
    if (filters?.state) params.append('state', filters.state);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const query = params.toString();
    return this.request<Post[]>(`/posts${query ? `?${query}` : ''}`);
  }

  async getPost(id: string) {
    return this.request<Post>(`/posts/${id}`);
  }

  async updatePost(id: string, data: UpdatePostData) {
    return this.request<Post>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async reschedulePost(id: string, publishDate: string) {
    return this.request<Post>(`/posts/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ publishDate }),
    });
  }

  async deletePost(id: string) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getAnalytics(integrationId: string, days: number = 30) {
    return this.request<AnalyticsResponse>(
      `/analytics/${integrationId}?days=${days}`
    );
  }

  async getAggregatedAnalytics(params: {
    startDate?: string;
    endDate?: string;
    platforms?: string[];
    metrics?: string[];
  }) {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.platforms) searchParams.append('platforms', params.platforms.join(','));
    if (params.metrics) searchParams.append('metrics', params.metrics.join(','));

    return this.request<AggregatedAnalyticsResponse>(
      `/analytics/aggregated?${searchParams.toString()}`
    );
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string; uptime: number }>(
      '/health'
    );
  }
}

// Types
export interface IntegrationType {
  name: string;
  identifier: string;
  scopes: string[];
  editor: string;
}

export interface Integration {
  id: string;
  name: string;
  picture: string;
  providerIdentifier: string;
  disabled: boolean;
  refreshNeeded: boolean;
  profile?: {
    username?: string;
    id?: string;
  };
}

export interface CreatePostData {
  integrationId: string;
  content: string;
  publishDate: string;
  settings?: Record<string, any>;
  media?: Array<{
    path: string;
    type: string;
  }>;
}

export interface UpdatePostData {
  content?: string;
  settings?: Record<string, any>;
  media?: Array<{
    path: string;
    type: string;
  }>;
}

export interface Post {
  id: string;
  content: string;
  publishDate: string;
  state: 'QUEUE' | 'PUBLISHED' | 'ERROR';
  group?: string;
  releaseURL?: string;
  error?: string;
  integration: {
    id: string;
    name: string;
    providerIdentifier: string;
    picture: string;
  };
}

export interface PostFilters {
  startDate?: string;
  endDate?: string;
  provider?: string;
  state?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsMetric {
  label: string;
  data: Array<{
    total: number;
    date: string;
  }>;
}

export interface AnalyticsResponse {
  integration: {
    id: string;
    name: string;
    provider: string;
    picture: string;
  };
  analytics: AnalyticsMetric[];
  period: {
    days: number;
    from: string;
    to: string;
  };
}

export interface AggregatedAnalyticsResponse {
  data: Array<{
    integration: {
      id: string;
      name: string;
      provider: string;
      picture: string;
    };
    analytics: AnalyticsMetric[];
    error?: string;
  }>;
  period: {
    from: string;
    to: string;
  };
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);