export class GoogleDriveError extends Error {
  code: string;
  originalError?: any;
  retryable: boolean;

  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.name = 'GoogleDriveError';
    this.code = code;
    this.originalError = originalError;
    this.retryable = this.isRetryable(code);
  }

  private isRetryable(code: string): boolean {
    const retryableCodes = [
      'RATE_LIMIT_EXCEEDED',
      'QUOTA_EXCEEDED',
      'BACKEND_ERROR',
      'SERVICE_UNAVAILABLE',
      'TIMEOUT',
    ];
    return retryableCodes.includes(code);
  }
}

// Specific error types
export class GoogleDriveRateLimitError extends GoogleDriveError {
  constructor(message: string = 'Rate limit exceeded', originalError?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', originalError);
  }
}

export class GoogleDriveQuotaError extends GoogleDriveError {
  constructor(message: string = 'Storage quota exceeded', originalError?: any) {
    super(message, 'QUOTA_EXCEEDED', originalError);
  }
}

export class GoogleDriveNotFoundError extends GoogleDriveError {
  constructor(message: string = 'File not found', originalError?: any) {
    super(message, 'FILE_NOT_FOUND', originalError);
  }
}

export class GoogleDrivePermissionError extends GoogleDriveError {
  constructor(message: string = 'Permission denied', originalError?: any) {
    super(message, 'PERMISSION_DENIED', originalError);
  }
}

export class GoogleDriveInvalidFileTypeError extends GoogleDriveError {
  constructor(message: string = 'Invalid file type', originalError?: any) {
    super(message, 'INVALID_FILE_TYPE', originalError);
  }
}