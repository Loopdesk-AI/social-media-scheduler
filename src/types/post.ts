export type Platform = 'x' | 'facebook' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube';

export interface Post {
  id: string;
  platform: Platform;
  content: string;
  scheduledAt: string; // ISO datetime string
  status: 'draft' | 'scheduled' | 'published';
}
