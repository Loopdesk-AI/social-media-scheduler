import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus Metrics Service
 * Collects and exposes application metrics
 */
export class MetricsService {
  private registry: Registry;

  // HTTP metrics
  public httpRequestDuration: Histogram;
  public httpRequestTotal: Counter;
  public httpRequestErrors: Counter;

  // Queue metrics
  public queueJobsProcessed: Counter;
  public queueJobsFailed: Counter;
  public queueJobDuration: Histogram;
  public queueSize: Gauge;

  // Integration metrics
  public integrationRequests: Counter;
  public integrationErrors: Counter;
  public integrationResponseTime: Histogram;

  // Post metrics
  public postsCreated: Counter;
  public postsPublished: Counter;
  public postsFailed: Counter;

  // Social Media metrics
  public socialPostsTotal: Counter;
  public socialApiRequestsTotal: Counter;
  public socialApiErrorsTotal: Counter;
  public socialRateLimitHitsTotal: Counter;
  public socialPostPublishDuration: Histogram;
  public socialOAuthFlowDuration: Histogram;
  public socialMediaUploadDuration: Histogram;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // HTTP metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    // Queue metrics
    this.queueJobsProcessed = new Counter({
      name: 'queue_jobs_processed_total',
      help: 'Total number of queue jobs processed',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.queueJobsFailed = new Counter({
      name: 'queue_jobs_failed_total',
      help: 'Total number of queue jobs failed',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.queueJobDuration = new Histogram({
      name: 'queue_job_duration_seconds',
      help: 'Duration of queue job processing in seconds',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.queueSize = new Gauge({
      name: 'queue_size',
      help: 'Current size of the queue',
      labelNames: ['state'],
      registers: [this.registry],
    });

    // Integration metrics
    this.integrationRequests = new Counter({
      name: 'integration_requests_total',
      help: 'Total number of integration API requests',
      labelNames: ['provider', 'operation'],
      registers: [this.registry],
    });

    this.integrationErrors = new Counter({
      name: 'integration_errors_total',
      help: 'Total number of integration errors',
      labelNames: ['provider', 'error_type'],
      registers: [this.registry],
    });

    this.integrationResponseTime = new Histogram({
      name: 'integration_response_time_seconds',
      help: 'Response time of integration API calls',
      labelNames: ['provider', 'operation'],
      registers: [this.registry],
    });

    // Post metrics
    this.postsCreated = new Counter({
      name: 'posts_created_total',
      help: 'Total number of posts created',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.postsPublished = new Counter({
      name: 'posts_published_total',
      help: 'Total number of posts published',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.postsFailed = new Counter({
      name: 'posts_failed_total',
      help: 'Total number of posts failed',
      labelNames: ['provider', 'error_type'],
      registers: [this.registry],
    });

    // Social Media Platform Metrics
    this.socialPostsTotal = new Counter({
      name: 'social_posts_total',
      help: 'Total number of social media posts',
      labelNames: ['platform', 'status'], // status: success, failed, pending
      registers: [this.registry],
    });

    this.socialApiRequestsTotal = new Counter({
      name: 'social_api_requests_total',
      help: 'Total number of social media API requests',
      labelNames: ['platform', 'endpoint'],
      registers: [this.registry],
    });

    this.socialApiErrorsTotal = new Counter({
      name: 'social_api_errors_total',
      help: 'Total number of social media API errors',
      labelNames: ['platform', 'error_type'],
      registers: [this.registry],
    });

    this.socialRateLimitHitsTotal = new Counter({
      name: 'social_rate_limit_hits_total',
      help: 'Total number of rate limit hits',
      labelNames: ['platform'],
      registers: [this.registry],
    });

    this.socialPostPublishDuration = new Histogram({
      name: 'social_post_publish_duration_seconds',
      help: 'Duration of social media post publishing in seconds',
      labelNames: ['platform'],
      registers: [this.registry],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60], // seconds
    });

    this.socialOAuthFlowDuration = new Histogram({
      name: 'social_oauth_flow_duration_seconds',
      help: 'Duration of OAuth authentication flow in seconds',
      labelNames: ['platform'],
      registers: [this.registry],
      buckets: [0.5, 1, 2, 5, 10, 20], // seconds
    });

    this.socialMediaUploadDuration = new Histogram({
      name: 'social_media_upload_duration_seconds',
      help: 'Duration of media upload to social platforms in seconds',
      labelNames: ['platform', 'media_type'],
      registers: [this.registry],
      buckets: [1, 5, 10, 30, 60, 120, 300], // seconds
    });

    console.log('✅ Prometheus metrics initialized');
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJSON(): Promise<any> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
    this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();
  }

  /**
   * Record HTTP error
   */
  recordHttpError(method: string, route: string, errorType: string): void {
    this.httpRequestErrors.labels(method, route, errorType).inc();
  }

  /**
   * Update queue size metrics
   */
  updateQueueSize(waiting: number, active: number, delayed: number): void {
    this.queueSize.labels('waiting').set(waiting);
    this.queueSize.labels('active').set(active);
    this.queueSize.labels('delayed').set(delayed);
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
