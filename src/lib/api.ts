/**
 * API Client for Social Media Scheduler Backend
 * Handles all HTTP requests to the backend API
 */

/// <reference types="vite/client" />

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
      "Content-Type": "application/json",
    };
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async get(endpoint: string) {
    return this.request(endpoint);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🔍 API request - URL: ${url}`);

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      console.log(`🔄 Sending API request...`);
      const response = await fetch(url, config);
      console.log(`✅ API response - Status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        console.error(`❌ API error response:`, error);
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result = response.json();
      result
        .then((data) => {
          console.log(`✅ API response data:`, data);
        })
        .catch((err) => {
          console.error(`❌ Error parsing API response:`, err);
        });

      return result;
    } catch (error) {
      console.error("❌ API request failed:", error);
      throw error;
    }
  }

  // Integration endpoints
  async getIntegrationTypes() {
    return this.request<{ social: IntegrationType[] }>("/integrations/types");
  }

  async getIntegrations() {
    return this.request<Integration[]>("/integrations");
  }

  async getAuthUrl(provider: string) {
    try {
      return this.request<{ url: string; state: string; provider: string }>(
        `/integrations/${provider}/auth-url`,
      );
    } catch (error: any) {
      if (error.message?.includes("Provider not found")) {
        throw new Error(
          `${provider} integration is coming soon! Only Instagram is available right now.`,
        );
      }
      throw error;
    }
  }

  async handleOAuthCallback(provider: string, code: string, state: string) {
    return this.request<Integration>(`/integrations/${provider}/callback`, {
      method: "POST",
      body: JSON.stringify({ code, state }),
    });
  }

  async deleteIntegration(id: string) {
    return this.request(`/integrations/${id}`, {
      method: "DELETE",
    });
  }

  async toggleIntegration(id: string, disabled: boolean) {
    return this.request<Integration>(`/integrations/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ disabled }),
    });
  }

  // Post endpoints
  async createPost(data: CreatePostData) {
    return this.request<Post>("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createMultiPlatformPost(data: CreateMultiPlatformPostData) {
    return this.request<Post[]>("/posts/multi-platform", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Media upload
  async uploadMedia(formData: FormData) {
    const url = `${this.baseUrl}/media/upload`;

    const response = await fetch(url, {
      method: "POST",
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
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.provider) params.append("provider", filters.provider);
    if (filters?.state) params.append("state", filters.state);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const query = params.toString();
    return this.request<Post[]>(`/posts${query ? `?${query}` : ""}`);
  }

  async getPost(id: string) {
    return this.request<Post>(`/posts/${id}`);
  }

  async updatePost(id: string, data: UpdatePostData) {
    return this.request<Post>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async reschedulePost(id: string, publishDate: string) {
    return this.request<Post>(`/posts/${id}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify({ publishDate }),
    });
  }

  async deletePost(id: string) {
    return this.request(`/posts/${id}`, {
      method: "DELETE",
    });
  }

  // Analytics endpoints
  async getAnalytics(integrationId: string, days: number = 30) {
    return this.request<AnalyticsResponse>(
      `/analytics/${integrationId}?days=${days}`,
    );
  }

  async getAggregatedAnalytics(params: {
    startDate?: string;
    endDate?: string;
    platforms?: string[];
    metrics?: string[];
  }) {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append("startDate", params.startDate);
    if (params.endDate) searchParams.append("endDate", params.endDate);
    if (params.platforms)
      searchParams.append("platforms", params.platforms.join(","));
    if (params.metrics)
      searchParams.append("metrics", params.metrics.join(","));

    return this.request<AggregatedAnalyticsResponse>(
      `/analytics/aggregated?${searchParams.toString()}`,
    );
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string; uptime: number }>(
      "/health",
    );
  }

  // Storage endpoints
  async getStorageProviders() {
    return this.request<{ identifier: string; name: string }[]>(
      "/storage/providers",
    );
  }

  async getStorageAuthUrl(provider: string) {
    return this.request<{ url: string; state: string }>(
      `/storage/auth/${provider}`,
    );
  }

  async getStorageIntegrations() {
    return this.request<StorageIntegration[]>("/storage/integrations");
  }

  async deleteStorageIntegration(id: string) {
    return this.request(`/storage/integrations/${id}`, {
      method: "DELETE",
    });
  }

  async listStorageFiles(
    integrationId: string,
    folderId?: string,
    pageToken?: string,
  ) {
    const params = new URLSearchParams();
    if (folderId) params.append("folderId", folderId);
    if (pageToken) params.append("pageToken", pageToken);

    const query = params.toString();
    console.log(
      `🔍 API call to list storage files - Integration: ${integrationId}, Folder: ${folderId || "root"}, Query: ${query}`,
    );

    const result = this.request<{
      files: StorageFile[];
      nextPageToken?: string;
    }>(`/storage/${integrationId}/files${query ? `?${query}` : ""}`);

    result
      .then((response) => {
        console.log(
          `✅ API response - Files: ${response.files.length}, NextPageToken: ${response.nextPageToken}`,
        );
      })
      .catch((error) => {
        console.error(`❌ API error:`, error);
      });

    return result;
  }

  async getStorageDownloadUrl(integrationId: string, fileId: string) {
    return this.request<{ url: string }>(
      `/storage/${integrationId}/download/${fileId}`,
    );
  }

  async importStorageFile(integrationId: string, fileId: string) {
    return this.request<{ path: string; filename: string; mimeType: string }>(
      `/storage/${integrationId}/import/${fileId}`,
      {
        method: "POST",
      },
    );
  }

  async searchStorageFiles(
    integrationId: string,
    query: string,
    options?: { mimeType?: string; pageSize?: number; pageToken?: string },
  ) {
    return this.request<{ files: StorageFile[]; nextPageToken?: string }>(
      `/storage/${integrationId}/search`,
      {
        method: "POST",
        body: JSON.stringify({ query, ...options }),
      },
    );
  }

  async getStorageThumbnail(
    integrationId: string,
    fileId: string,
    size?: number,
  ) {
    const params = new URLSearchParams();
    if (size) params.append("size", size.toString());
    const query = params.toString();
    return this.request<{ url: string }>(
      `/storage/${integrationId}/thumbnail/${fileId}${query ? `?${query}` : ""}`,
    );
  }

  async batchImportStorageFiles(integrationId: string, fileIds: string[]) {
    return this.request<{
      results: Array<{
        fileId: string;
        success: boolean;
        result?: any;
        error?: string;
      }>;
    }>(`/storage/${integrationId}/batch-import`, {
      method: "POST",
      body: JSON.stringify({ fileIds }),
    });
  }

  async listSharedDrives(integrationId: string) {
    return this.request<{ drives: Array<{ id: string; name: string }> }>(
      `/storage/${integrationId}/shared-drives`,
    );
  }

  async exportStorageFile(
    integrationId: string,
    fileId: string,
    format?: string,
  ) {
    const response = await fetch(
      `${this.baseUrl}/storage/${integrationId}/export/${fileId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to export file: ${response.statusText}`);
    }

    return response.blob();
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
  state: "QUEUE" | "PUBLISHED" | "ERROR";
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

// Storage types
export interface StorageIntegration {
  id: string;
  provider: string;
  providerName: string;
  accountName: string;
  accountEmail: string;
  picture?: string;
  quota?: {
    used: number;
    total: number;
    usedFormatted: string;
    totalFormatted: string;
    percentUsed: number;
  };
  connected: boolean;
  refreshNeeded: boolean;
}

export interface StorageFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  sizeFormatted: string;
  modifiedTime: string;
  thumbnailUrl?: string;
  isFolder: boolean;
  path: string;
  canSelect: boolean;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
