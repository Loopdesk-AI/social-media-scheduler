import { timer } from '../../utils/helpers';
import { RefreshToken, BadBody, NotEnoughScopes } from '../../utils/errors';

/**
 * Abstract base class for social media providers
 * Provides common functionality for OAuth, error handling, and API calls
 */
export abstract class SocialAbstract {
  abstract identifier: string;
  maxConcurrentJob = 1;

  /**
   * Handle platform-specific errors
   * Override this method in provider implementations
   * @param body Error response body
   * @returns Error type and message, or undefined if not handled
   */
  public handleErrors(
    body: string
  ):
    | { type: 'refresh-token' | 'bad-body' | 'retry'; value: string }
    | undefined {
    return undefined;
  }

  /**
   * Fetch with automatic retry and error handling
   * @param url Request URL
   * @param options Fetch options
   * @param identifier Provider identifier for logging
   * @param totalRetries Current retry count
   * @returns Response object
   */
  async fetch(
    url: string,
    options: RequestInit = {},
    identifier = '',
    totalRetries = 0
  ): Promise<Response> {
    const response = await fetch(url, options);

    // Success responses
    if (response.status === 200 || response.status === 201) {
      return response;
    }

    // Max retries exceeded
    if (totalRetries > 2) {
      throw new BadBody(identifier, '{}', options.body || '{}');
    }

    // Get response body
    let json = '{}';
    try {
      json = await response.text();
    } catch (err) {
      json = '{}';
    }

    // Rate limiting or server errors - retry
    if (
      response.status === 429 ||
      response.status === 500 ||
      json.includes('rate_limit_exceeded') ||
      json.includes('Rate limit')
    ) {
      console.log(`Rate limit or server error, retrying in 5s... (attempt ${totalRetries + 1}/3)`);
      await timer(5000);
      return this.fetch(url, options, identifier, totalRetries + 1);
    }

    // Check for platform-specific errors
    const handleError = this.handleErrors(json || '{}');

    // Retry on transient errors
    if (handleError?.type === 'retry') {
      console.log(`Transient error, retrying in 5s... (attempt ${totalRetries + 1}/3)`);
      await timer(5000);
      return this.fetch(url, options, identifier, totalRetries + 1);
    }

    // Token refresh required
    if (
      response.status === 401 &&
      (handleError?.type === 'refresh-token' || !handleError)
    ) {
      throw new RefreshToken(
        identifier,
        json,
        options.body!,
        handleError?.value || 'Token refresh required'
      );
    }

    // Bad request or other errors
    throw new BadBody(
      identifier,
      json,
      options.body!,
      handleError?.value || 'Request failed'
    );
  }

  /**
   * Check if granted scopes match required scopes
   * @param required Required scopes array
   * @param got Granted scopes (string or array)
   * @returns True if all required scopes are granted
   */
  checkScopes(required: string[], got: string | string[]): boolean {
    if (Array.isArray(got)) {
      if (!required.every((scope) => got.includes(scope))) {
        throw new NotEnoughScopes(
          `Missing required scopes: ${required.filter(s => !got.includes(s)).join(', ')}`
        );
      }
      return true;
    }

    // Parse string scopes
    const newGot = decodeURIComponent(got);
    const splitType = newGot.indexOf(',') > -1 ? ',' : ' ';
    const gotArray = newGot.split(splitType);
    
    if (!required.every((scope) => gotArray.includes(scope))) {
      throw new NotEnoughScopes(
        `Missing required scopes: ${required.filter(s => !gotArray.includes(s)).join(', ')}`
      );
    }

    return true;
  }
}
