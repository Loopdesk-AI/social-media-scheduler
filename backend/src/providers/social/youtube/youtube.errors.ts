// YouTube error code mappings

export const YOUTUBE_ERROR_CODES = {
  UPLOAD_LIMIT_EXCEEDED: 'uploadLimitExceeded',
  QUOTA_EXCEEDED: 'quotaExceeded',
  FAILED_PRECONDITION: 'failedPrecondition',
  YOUTUBE_SIGNUP_REQUIRED: 'youtubeSignupRequired',
  INVALID_REQUEST: 'invalidRequest',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'notFound',
  RATE_LIMIT_EXCEEDED: 'rateLimitExceeded',
  BACKEND_ERROR: 'backendError',
  UNAUTHORIZED: 'unauthorized',
} as const;

export const YOUTUBE_ERROR_MESSAGES = {
  [YOUTUBE_ERROR_CODES.UPLOAD_LIMIT_EXCEEDED]:
    'You have reached your daily upload limit. Please try again tomorrow.',
  [YOUTUBE_ERROR_CODES.QUOTA_EXCEEDED]:
    'YouTube API quota exceeded. Please try again later.',
  [YOUTUBE_ERROR_CODES.FAILED_PRECONDITION]:
    'Thumbnail upload failed. The image may be too large (max 2MB) or in an unsupported format.',
  [YOUTUBE_ERROR_CODES.YOUTUBE_SIGNUP_REQUIRED]:
    'No YouTube channel found. Please create a YouTube channel for this Google account.',
  [YOUTUBE_ERROR_CODES.INVALID_REQUEST]:
    'Invalid request. Please check your video settings.',
  [YOUTUBE_ERROR_CODES.FORBIDDEN]:
    'Access forbidden. Please check your permissions.',
  [YOUTUBE_ERROR_CODES.NOT_FOUND]:
    'Resource not found.',
  [YOUTUBE_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    'Rate limit exceeded. Please try again in a few moments.',
  [YOUTUBE_ERROR_CODES.BACKEND_ERROR]:
    'YouTube service error. Please try again later.',
  [YOUTUBE_ERROR_CODES.UNAUTHORIZED]:
    'Authentication failed. Please reconnect your YouTube account.',
} as const;

export function mapYouTubeError(errorBody: string): {
  type: 'refresh-token' | 'bad-body' | 'retry';
  value: string;
} | undefined {
  try {
    const error = JSON.parse(errorBody);
    
    if (error.error?.errors) {
      const reason = error.error.errors[0]?.reason;
      
      // Upload limit errors
      if (reason === YOUTUBE_ERROR_CODES.UPLOAD_LIMIT_EXCEEDED || 
          reason === YOUTUBE_ERROR_CODES.QUOTA_EXCEEDED) {
        return {
          type: 'bad-body',
          value: YOUTUBE_ERROR_MESSAGES[reason as keyof typeof YOUTUBE_ERROR_MESSAGES] || YOUTUBE_ERROR_MESSAGES[YOUTUBE_ERROR_CODES.UPLOAD_LIMIT_EXCEEDED],
        };
      }
      
      // Thumbnail errors
      if (reason === YOUTUBE_ERROR_CODES.FAILED_PRECONDITION) {
        return {
          type: 'bad-body',
          value: YOUTUBE_ERROR_MESSAGES[YOUTUBE_ERROR_CODES.FAILED_PRECONDITION],
        };
      }
      
      // Channel not found
      if (reason === YOUTUBE_ERROR_CODES.YOUTUBE_SIGNUP_REQUIRED || 
          errorBody.includes('youtube.signup.required')) {
        return {
          type: 'bad-body',
          value: YOUTUBE_ERROR_MESSAGES[YOUTUBE_ERROR_CODES.YOUTUBE_SIGNUP_REQUIRED],
        };
      }
      
      // Authentication errors
      if (reason === YOUTUBE_ERROR_CODES.UNAUTHORIZED || 
          error.error.code === 401) {
        return {
          type: 'refresh-token',
          value: YOUTUBE_ERROR_MESSAGES[YOUTUBE_ERROR_CODES.UNAUTHORIZED],
        };
      }
      
      // Rate limit errors
      if (reason === YOUTUBE_ERROR_CODES.RATE_LIMIT_EXCEEDED || 
          error.error.code === 429) {
        return {
          type: 'retry',
          value: YOUTUBE_ERROR_MESSAGES[YOUTUBE_ERROR_CODES.RATE_LIMIT_EXCEEDED],
        };
      }
      
      // Backend errors
      if (reason === YOUTUBE_ERROR_CODES.BACKEND_ERROR || 
          error.error.code >= 500) {
        return {
          type: 'retry',
          value: YOUTUBE_ERROR_MESSAGES[YOUTUBE_ERROR_CODES.BACKEND_ERROR],
        };
      }
    }
  } catch (e) {
    // If parsing fails, return undefined
  }
  
  return undefined;
}
