// LinkedIn error code mappings

export const LINKEDIN_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const LINKEDIN_ERROR_MESSAGES = {
  [LINKEDIN_ERROR_CODES.UNAUTHORIZED]:
    'LinkedIn authentication failed. Please reconnect your account.',
  [LINKEDIN_ERROR_CODES.FORBIDDEN]:
    'Insufficient permissions. Please reconnect with required permissions.',
  [LINKEDIN_ERROR_CODES.NOT_FOUND]:
    'Resource not found. The post or organization may have been deleted.',
  [LINKEDIN_ERROR_CODES.CONFLICT]:
    'Duplicate post detected. Please modify your content.',
  [LINKEDIN_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    'LinkedIn rate limit exceeded. Please try again in a few minutes.',
  [LINKEDIN_ERROR_CODES.INTERNAL_SERVER_ERROR]:
    'LinkedIn server error. Please try again later.',
  [LINKEDIN_ERROR_CODES.SERVICE_UNAVAILABLE]:
    'LinkedIn service temporarily unavailable. Please try again later.',
} as const;

export function mapLinkedInError(errorBody: string, statusCode?: number): {
  type: 'refresh-token' | 'bad-body' | 'retry';
  value: string;
} | undefined {
  try {
    // Check status code first
    if (statusCode === LINKEDIN_ERROR_CODES.UNAUTHORIZED) {
      return {
        type: 'refresh-token',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.UNAUTHORIZED],
      };
    }

    if (statusCode === LINKEDIN_ERROR_CODES.RATE_LIMIT_EXCEEDED) {
      return {
        type: 'retry',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.RATE_LIMIT_EXCEEDED],
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        type: 'retry',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.INTERNAL_SERVER_ERROR],
      };
    }

    // Parse error body
    const error = JSON.parse(errorBody);

    // Token expiration
    if (error.message?.includes('token') || 
        error.message?.includes('expired') ||
        error.message?.includes('unauthorized')) {
      return {
        type: 'refresh-token',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.UNAUTHORIZED],
      };
    }

    // Permission errors
    if (error.message?.includes('permission') || 
        error.message?.includes('forbidden') ||
        statusCode === LINKEDIN_ERROR_CODES.FORBIDDEN) {
      return {
        type: 'bad-body',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.FORBIDDEN],
      };
    }

    // Duplicate content
    if (error.message?.includes('duplicate') || 
        error.message?.includes('conflict') ||
        statusCode === LINKEDIN_ERROR_CODES.CONFLICT) {
      return {
        type: 'bad-body',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.CONFLICT],
      };
    }

    // Rate limiting
    if (error.message?.includes('rate') || 
        error.message?.includes('throttle')) {
      return {
        type: 'retry',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.RATE_LIMIT_EXCEEDED],
      };
    }

    // Server errors
    if (error.message?.includes('server') || 
        error.message?.includes('internal')) {
      return {
        type: 'retry',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.INTERNAL_SERVER_ERROR],
      };
    }
  } catch (e) {
    // If parsing fails, check status code
    if (statusCode === LINKEDIN_ERROR_CODES.UNAUTHORIZED) {
      return {
        type: 'refresh-token',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.UNAUTHORIZED],
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        type: 'retry',
        value: LINKEDIN_ERROR_MESSAGES[LINKEDIN_ERROR_CODES.INTERNAL_SERVER_ERROR],
      };
    }
  }

  return undefined;
}
