import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';

/**
 * Sentry Error Tracking Service
 * Monitors and reports errors to Sentry
 */
export class SentryService {
  private initialized = false;

  /**
   * Initialize Sentry
   */
  init(app: Express): void {
    // Only initialize if DSN is provided
    if (!process.env.SENTRY_DSN) {
      console.log('⚠️  Sentry DSN not configured, error tracking disabled');
      return;
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        // Enable profiling
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
    });

    // Setup Express error handlers
    Sentry.setupExpressErrorHandler(app);

    this.initialized = true;
    console.log('✅ Sentry error tracking initialized');
  }

  /**
   * Check if Sentry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Capture exception manually
   */
  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    Sentry.captureException(error, {
      extra: context,
    });
  }

  /**
   * Capture message manually
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.initialized) {
      return;
    }

    Sentry.captureMessage(message, level);
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser(user);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.initialized) {
      return;
    }

    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Close Sentry and flush events
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await Sentry.close(2000);
  }
}

// Export singleton instance
export const sentryService = new SentryService();
