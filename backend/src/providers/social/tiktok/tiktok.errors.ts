// TikTok error code mappings

export const TIKTOK_ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_ACCESS_TOKEN: 'invalid_access_token',
  ACCESS_TOKEN_EXPIRED: 'access_token_expired',
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
  SPAM_RISK_TOO_MANY_POSTS: 'spam_risk_too_many_posts',
  SPAM_RISK_USER_BANNED_FROM_POSTING: 'spam_risk_user_banned_from_posting',
  UNAUDITED_CLIENT_IN_LIVE_ENV: 'unaudited_client_in_live_env',
  VIDEO_DURATION_TOO_SHORT: 'video_duration_too_short',
  VIDEO_DURATION_TOO_LONG: 'video_duration_too_long',
  VIDEO_SIZE_TOO_LARGE: 'video_size_too_large',
  VIDEO_FORMAT_INVALID: 'video_format_invalid',
  VIDEO_RESOLUTION_TOO_LOW: 'video_resolution_too_low',
  UPLOAD_FAILED: 'upload_failed',
  PROCESSING_FAILED: 'processing_failed',
  INVALID_PARAMS: 'invalid_params',
  SERVER_ERROR: 'server_error',
} as const;

export const TIKTOK_ERROR_MESSAGES = {
  [TIKTOK_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    'Rate limit exceeded. Please try again in a few minutes.',
  [TIKTOK_ERROR_CODES.INVALID_ACCESS_TOKEN]:
    'Invalid access token. Please reconnect your TikTok account.',
  [TIKTOK_ERROR_CODES.ACCESS_TOKEN_EXPIRED]:
    'Access token expired. Please reconnect your TikTok account.',
  [TIKTOK_ERROR_CODES.INSUFFICIENT_PERMISSIONS]:
    'Insufficient permissions. Please reconnect with required permissions.',
  [TIKTOK_ERROR_CODES.SPAM_RISK_TOO_MANY_POSTS]:
    'Too many posts detected. Please wait before posting again.',
  [TIKTOK_ERROR_CODES.SPAM_RISK_USER_BANNED_FROM_POSTING]:
    'Your account has been temporarily restricted from posting.',
  [TIKTOK_ERROR_CODES.UNAUDITED_CLIENT_IN_LIVE_ENV]:
    'App is not approved for production use. Please complete TikTok app review.',
  [TIKTOK_ERROR_CODES.VIDEO_DURATION_TOO_SHORT]:
    'Video duration must be at least 3 seconds.',
  [TIKTOK_ERROR_CODES.VIDEO_DURATION_TOO_LONG]:
    'Video duration must not exceed 10 minutes.',
  [TIKTOK_ERROR_CODES.VIDEO_SIZE_TOO_LARGE]:
    'Video file size exceeds maximum limit (4GB).',
  [TIKTOK_ERROR_CODES.VIDEO_FORMAT_INVALID]:
    'Invalid video format. Supported formats: MP4, MOV, MPEG, AVI, FLV, WebM.',
  [TIKTOK_ERROR_CODES.VIDEO_RESOLUTION_TOO_LOW]:
    'Video resolution is too low. Minimum resolution: 360p.',
  [TIKTOK_ERROR_CODES.UPLOAD_FAILED]:
    'Video upload failed. Please try again.',
  [TIKTOK_ERROR_CODES.PROCESSING_FAILED]:
    'Video processing failed. Please check your video and try again.',
  [TIKTOK_ERROR_CODES.INVALID_PARAMS]:
    'Invalid parameters provided.',
  [TIKTOK_ERROR_CODES.SERVER_ERROR]:
    'TikTok server error. Please try again later.',
} as const;

export function mapTikTokError(errorBody: string): {
  type: 'refresh-token' | 'bad-body' | 'retry';
  value: string;
} | undefined {
  try {
    const error = JSON.parse(errorBody);
    
    if (error.error) {
      const code = error.error.code;
      const message = error.error.message;
      
      // Authentication errors
      if (code === TIKTOK_ERROR_CODES.INVALID_ACCESS_TOKEN ||
          code === TIKTOK_ERROR_CODES.ACCESS_TOKEN_EXPIRED ||
          message?.includes('access_token') ||
          message?.includes('unauthorized')) {
        return {
          type: 'refresh-token',
          value: TIKTOK_ERROR_MESSAGES[TIKTOK_ERROR_CODES.ACCESS_TOKEN_EXPIRED],
        };
      }
      
      // Rate limit errors
      if (code === TIKTOK_ERROR_CODES.RATE_LIMIT_EXCEEDED ||
          message?.includes('rate_limit') ||
          message?.includes('too_many_requests')) {
        return {
          type: 'retry',
          value: TIKTOK_ERROR_MESSAGES[TIKTOK_ERROR_CODES.RATE_LIMIT_EXCEEDED],
        };
      }
      
      // Spam detection errors
      if (code === TIKTOK_ERROR_CODES.SPAM_RISK_TOO_MANY_POSTS ||
          code === TIKTOK_ERROR_CODES.SPAM_RISK_USER_BANNED_FROM_POSTING ||
          message?.includes('spam')) {
        // Fix: Add type checking before indexing
        const errorMessage = typeof code === 'string' && code in TIKTOK_ERROR_MESSAGES 
          ? TIKTOK_ERROR_MESSAGES[code as keyof typeof TIKTOK_ERROR_MESSAGES] 
          : 'Spam detected. Please try again later.';
        return {
          type: 'bad-body',
          value: errorMessage,
        };
      }
      
      // Video validation errors
      if (code === TIKTOK_ERROR_CODES.VIDEO_DURATION_TOO_SHORT ||
          code === TIKTOK_ERROR_CODES.VIDEO_DURATION_TOO_LONG ||
          code === TIKTOK_ERROR_CODES.VIDEO_SIZE_TOO_LARGE ||
          code === TIKTOK_ERROR_CODES.VIDEO_FORMAT_INVALID ||
          code === TIKTOK_ERROR_CODES.VIDEO_RESOLUTION_TOO_LOW) {
        // Fix: Add type checking before indexing
        const errorMessage = typeof code === 'string' && code in TIKTOK_ERROR_MESSAGES 
          ? TIKTOK_ERROR_MESSAGES[code as keyof typeof TIKTOK_ERROR_MESSAGES] 
          : 'Invalid video format or size.';
        return {
          type: 'bad-body',
          value: errorMessage,
        };
      }
      
      // Upload/processing errors
      if (code === TIKTOK_ERROR_CODES.UPLOAD_FAILED ||
          code === TIKTOK_ERROR_CODES.PROCESSING_FAILED) {
        // Fix: Add type checking before indexing
        const errorMessage = typeof code === 'string' && code in TIKTOK_ERROR_MESSAGES 
          ? TIKTOK_ERROR_MESSAGES[code as keyof typeof TIKTOK_ERROR_MESSAGES] 
          : 'Upload failed. Please try again.';
        return {
          type: 'retry',
          value: errorMessage,
        };
      }
      
      // Server errors
      if (code === TIKTOK_ERROR_CODES.SERVER_ERROR ||
          message?.includes('server_error') ||
          message?.includes('internal_error')) {
        return {
          type: 'retry',
          value: TIKTOK_ERROR_MESSAGES[TIKTOK_ERROR_CODES.SERVER_ERROR],
        };
      }
      
      // Permission errors
      if (code === TIKTOK_ERROR_CODES.INSUFFICIENT_PERMISSIONS ||
          message?.includes('permission')) {
        return {
          type: 'bad-body',
          value: TIKTOK_ERROR_MESSAGES[TIKTOK_ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        };
      }
    }
  } catch (e) {
    // If parsing fails, return undefined
  }
  
  return undefined;
}
