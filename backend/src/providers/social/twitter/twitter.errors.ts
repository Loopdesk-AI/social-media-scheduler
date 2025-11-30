// Twitter/X error code mappings

export const TWITTER_ERROR_TYPES = {
  DUPLICATE_CONTENT: 'duplicate',
  RATE_LIMIT_EXCEEDED: 'rate-limit-exceeded',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not-found',
  INVALID_REQUEST: 'invalid-request',
  MEDIA_ERROR: 'media-error',
  TWEET_NOT_FOUND: 'tweet-not-found',
} as const;

export const TWITTER_ERROR_MESSAGES = {
  [TWITTER_ERROR_TYPES.DUPLICATE_CONTENT]:
    'Duplicate content detected. Twitter does not allow posting the same content multiple times.',
  [TWITTER_ERROR_TYPES.RATE_LIMIT_EXCEEDED]:
    'Twitter rate limit exceeded. Please wait 15 minutes before trying again.',
  [TWITTER_ERROR_TYPES.UNAUTHORIZED]:
    'Twitter authentication failed. Please reconnect your account.',
  [TWITTER_ERROR_TYPES.FORBIDDEN]:
    'Access forbidden. Your account may be restricted or suspended.',
  [TWITTER_ERROR_TYPES.NOT_FOUND]:
    'Resource not found.',
  [TWITTER_ERROR_TYPES.INVALID_REQUEST]:
    'Invalid request. Please check your tweet content.',
  [TWITTER_ERROR_TYPES.MEDIA_ERROR]:
    'Media upload failed. Please check your file format and size.',
  [TWITTER_ERROR_TYPES.TWEET_NOT_FOUND]:
    'Tweet not found or has been deleted.',
} as const;

export function mapTwitterError(errorBody: string, statusCode?: number): {
  type: 'refresh-token' | 'bad-body' | 'retry';
  value: string;
} | undefined {
  try {
    const error = JSON.parse(errorBody);
    
    // Check status code first
    if (statusCode === 401) {
      return {
        type: 'refresh-token',
        value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.UNAUTHORIZED],
      };
    }

    if (statusCode === 429) {
      return {
        type: 'retry',
        value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.RATE_LIMIT_EXCEEDED],
      };
    }

    if (statusCode === 403) {
      return {
        type: 'bad-body',
        value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.FORBIDDEN],
      };
    }

    // Parse error details
    if (error.errors && Array.isArray(error.errors)) {
      const firstError = error.errors[0];
      const message = firstError.message || firstError.detail || '';
      
      // Duplicate content
      if (message.includes('duplicate') || 
          message.includes('already') ||
          firstError.type === TWITTER_ERROR_TYPES.DUPLICATE_CONTENT) {
        return {
          type: 'bad-body',
          value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.DUPLICATE_CONTENT],
        };
      }
      
      // Rate limiting
      if (message.includes('rate limit') || 
          message.includes('too many requests') ||
          firstError.type === TWITTER_ERROR_TYPES.RATE_LIMIT_EXCEEDED) {
        return {
          type: 'retry',
          value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.RATE_LIMIT_EXCEEDED],
        };
      }
      
      // Authentication
      if (message.includes('unauthorized') || 
          message.includes('authentication') ||
          message.includes('token')) {
        return {
          type: 'refresh-token',
          value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.UNAUTHORIZED],
        };
      }
      
      // Media errors
      if (message.includes('media') || 
          message.includes('upload')) {
        return {
          type: 'bad-body',
          value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.MEDIA_ERROR],
        };
      }
      
      // Invalid request
      if (message.includes('invalid') || 
          message.includes('bad request')) {
        return {
          type: 'bad-body',
          value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.INVALID_REQUEST],
        };
      }
    }

    // Check title/detail
    if (error.title || error.detail) {
      const errorText = `${error.title || ''} ${error.detail || ''}`.toLowerCase();
      
      if (errorText.includes('unauthorized') || errorText.includes('token')) {
        return {
          type: 'refresh-token',
          value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.UNAUTHORIZED],
        };
      }
      
      if (errorText.includes('rate limit')) {
        return {
          type: 'retry',
          value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.RATE_LIMIT_EXCEEDED],
        };
      }
    }
  } catch (e) {
    // If parsing fails, check status code
    if (statusCode === 401) {
      return {
        type: 'refresh-token',
        value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.UNAUTHORIZED],
      };
    }

    if (statusCode === 429) {
      return {
        type: 'retry',
        value: TWITTER_ERROR_MESSAGES[TWITTER_ERROR_TYPES.RATE_LIMIT_EXCEEDED],
      };
    }
  }
  
  return undefined;
}
