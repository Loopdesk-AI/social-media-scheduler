// Facebook error code mappings

export const FACEBOOK_ERROR_CODES = {
  INVALID_ACCESS_TOKEN: 190,
  PERMISSIONS_ERROR: 200,
  DUPLICATE_POST: 368,
  RATE_LIMIT_EXCEEDED: 4,
  RATE_LIMIT_ISSUES: 17,
  TEMPORARY_BLOCK: 369, // Fix: Use unique code instead of duplicate 368
  SPAM_DETECTED: 370,   // Fix: Use unique code instead of duplicate 368
  VIDEO_UPLOAD_FAILED: 1363041,
  VIDEO_TOO_LARGE: 1363037,
  INVALID_PARAMETER: 100,
  UNKNOWN_ERROR: 1,
} as const;

export const FACEBOOK_ERROR_MESSAGES = {
  [FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN]:
    'Facebook access token is invalid or expired. Please reconnect your account.',
  [FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR]:
    'Insufficient permissions. Please reconnect with required permissions.',
  [FACEBOOK_ERROR_CODES.DUPLICATE_POST]:
    'Duplicate post detected. Facebook does not allow posting the same content multiple times.',
  [FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    'Facebook rate limit exceeded. Please try again later.',
  [FACEBOOK_ERROR_CODES.RATE_LIMIT_ISSUES]:
    'Too many requests. Please slow down and try again.',
  [FACEBOOK_ERROR_CODES.TEMPORARY_BLOCK]:
    'Your account has been temporarily blocked from posting. Please try again later.',
  [FACEBOOK_ERROR_CODES.SPAM_DETECTED]:
    'Content flagged as spam. Please modify your post.',
  [FACEBOOK_ERROR_CODES.VIDEO_UPLOAD_FAILED]:
    'Video upload failed. Please check your video format and try again.',
  [FACEBOOK_ERROR_CODES.VIDEO_TOO_LARGE]:
    'Video file is too large. Maximum size is 10GB.',
  [FACEBOOK_ERROR_CODES.INVALID_PARAMETER]:
    'Invalid parameters provided. Please check your request.',
  [FACEBOOK_ERROR_CODES.UNKNOWN_ERROR]:
    'An unknown error occurred. Please try again.',
} as const;

export function mapFacebookError(errorBody: string): {
  type: 'refresh-token' | 'bad-body' | 'retry';
  value: string;
} | undefined {
  try {
    const error = JSON.parse(errorBody);
    
    if (error.error) {
      const code = error.error.code;
      const subcode = error.error.error_subcode;
      const message = error.error.message;
      
      // Token errors
      if (code === FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN ||
          message?.includes('access token') ||
          message?.includes('OAuthException')) {
        return {
          type: 'refresh-token',
          value: FACEBOOK_ERROR_MESSAGES[FACEBOOK_ERROR_CODES.INVALID_ACCESS_TOKEN],
        };
      }
      
      // Permission errors
      if (code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR ||
          message?.includes('permission')) {
        return {
          type: 'bad-body',
          value: FACEBOOK_ERROR_MESSAGES[FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR],
        };
      }
      
      // Duplicate post
      if (code === FACEBOOK_ERROR_CODES.DUPLICATE_POST ||
          message?.includes('duplicate')) {
        return {
          type: 'bad-body',
          value: FACEBOOK_ERROR_MESSAGES[FACEBOOK_ERROR_CODES.DUPLICATE_POST],
        };
      }
      
      // Rate limiting
      if (code === FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED ||
          code === FACEBOOK_ERROR_CODES.RATE_LIMIT_ISSUES ||
          message?.includes('rate limit') ||
          message?.includes('too many')) {
        return {
          type: 'retry',
          value: FACEBOOK_ERROR_MESSAGES[FACEBOOK_ERROR_CODES.RATE_LIMIT_EXCEEDED],
        };
      }
      
      // Spam/blocking
      if (code === FACEBOOK_ERROR_CODES.SPAM_DETECTED ||
          code === FACEBOOK_ERROR_CODES.TEMPORARY_BLOCK ||
          message?.includes('spam') ||
          message?.includes('blocked')) {
        return {
          type: 'bad-body',
          value: FACEBOOK_ERROR_MESSAGES[FACEBOOK_ERROR_CODES.SPAM_DETECTED],
        };
      }
      
      // Video errors
      if (code === FACEBOOK_ERROR_CODES.VIDEO_UPLOAD_FAILED ||
          code === FACEBOOK_ERROR_CODES.VIDEO_TOO_LARGE ||
          message?.includes('video')) {
        // Fix: Add type checking before indexing
        const errorMessage = typeof code === 'number' && code in FACEBOOK_ERROR_MESSAGES 
          ? FACEBOOK_ERROR_MESSAGES[code as keyof typeof FACEBOOK_ERROR_MESSAGES] 
          : 'Video upload error';
        return {
          type: 'bad-body',
          value: errorMessage,
        };
      }
      
      // Invalid parameters
      if (code === FACEBOOK_ERROR_CODES.INVALID_PARAMETER) {
        return {
          type: 'bad-body',
          value: FACEBOOK_ERROR_MESSAGES[FACEBOOK_ERROR_CODES.INVALID_PARAMETER],
        };
      }
    }
  } catch (e) {
    // If parsing fails, return undefined
  }
  
  return undefined;
}
