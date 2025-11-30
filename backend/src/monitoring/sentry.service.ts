import logger from '../utils/logger';

/**
 * Simplified Sentry Service Stub
 *
 * This is a lightweight replacement for the Sentry SDK.
 * It logs errors using the application's logger instead of sending them to Sentry.
 *
 * To enable real Sentry integration, install @sentry/node and update this file.
 */
class SentryService {
  private enabled: boolean = false;

  constructor() {
    // Check if Sentry DSN is configured
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      logger.info('Sentry DSN configured but SDK not installed. Using local error logging.');
    }
    this.enabled = false;
  }

  /**
   * Initialize Sentry (no-op in stub version)
   */
  init(): void {
    logger.info('Sentry service initialized (stub mode - using local logging)');
  }

  /**
   * Capture an exception
   * In this stub version, it logs the error locally
   */
  captureException(error: Error, context?: Record<string, any>): string {
    const errorId = this.generateErrorId();

    logger.error('Captured exception:', {
      errorId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    });

    return errorId;
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): string {
    const errorId = this.generateErrorId();

    logger[level]('Captured message:', {
      errorId,
      message,
    });

    return errorId;
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; username?: string } | null): void {
    if (user) {
      logger.debug('Set user context:', { userId: user.id });
    } else {
      logger.debug('Cleared user context');
    }
  }

  /**
   * Set extra context
   */
  setExtra(key: string, value: any): void {
    logger.debug('Set extra context:', { key, value });
  }

  /**
   * Set tag
   */
  setTag(key: string, value: string): void {
    logger.debug('Set tag:', { key, value });
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: {
    category?: string;
    message?: string;
    level?: 'debug' | 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }): void {
    logger.debug('Breadcrumb:', breadcrumb);
  }

  /**
   * Start a new transaction (no-op in stub)
   */
  startTransaction(context: { name: string; op?: string }): {
    finish: () => void;
    setStatus: (status: string) => void;
  } {
    return {
      finish: () => {},
      setStatus: () => {},
    };
  }

  /**
   * Generate a unique error ID for tracking
   */
  private generateErrorId(): string {
    return `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Check if Sentry is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const sentryService = new SentryService();
