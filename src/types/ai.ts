// AI Suggestion Types

export type ToneOption = 
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'funny'
  | 'inspirational'
  | 'educational'
  | 'promotional';

export type SuggestionRequest = {
  topic: string;
  platform: string;
  tone: ToneOption;
  charLimit?: number;
  context?: string;
};

export type SuggestionResponse = {
  content: string;
  hashtags?: string[];
  metadata?: {
    model: string;
    tokensUsed?: number;
  };
};

export type AIError = {
  message: string;
  code?: string;
  retryable?: boolean;
};

export type RateLimitState = {
  requestsRemaining: number;
  resetTime: number;
  lastRequest: number;
};

