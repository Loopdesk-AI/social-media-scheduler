import { useState, useEffect, useCallback } from 'react';
import { RateLimitState } from '../types/ai';

const STORAGE_KEY = 'loopdesk-ai-rate-limit';
const MAX_REQUESTS_PER_HOUR = 20; // Adjust based on your API limits
const RESET_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

export function useRateLimit() {
  const [rateLimit, setRateLimit] = useState<RateLimitState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if reset time has passed
      if (Date.now() > parsed.resetTime) {
        return {
          requestsRemaining: MAX_REQUESTS_PER_HOUR,
          resetTime: Date.now() + RESET_INTERVAL,
          lastRequest: 0,
        };
      }
      return parsed;
    }
    return {
      requestsRemaining: MAX_REQUESTS_PER_HOUR,
      resetTime: Date.now() + RESET_INTERVAL,
      lastRequest: 0,
    };
  });

  // Save to localStorage whenever rate limit changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rateLimit));
  }, [rateLimit]);

  // Check if we can make a request
  const canMakeRequest = useCallback((): boolean => {
    // Reset if time has passed
    if (Date.now() > rateLimit.resetTime) {
      setRateLimit({
        requestsRemaining: MAX_REQUESTS_PER_HOUR,
        resetTime: Date.now() + RESET_INTERVAL,
        lastRequest: 0,
      });
      return true;
    }

    return rateLimit.requestsRemaining > 0;
  }, [rateLimit]);

  // Track a request
  const trackRequest = useCallback(() => {
    setRateLimit((prev) => ({
      ...prev,
      requestsRemaining: Math.max(0, prev.requestsRemaining - 1),
      lastRequest: Date.now(),
    }));
  }, []);

  // Get time until reset in minutes
  const getTimeUntilReset = useCallback((): number => {
    const timeRemaining = rateLimit.resetTime - Date.now();
    return Math.ceil(timeRemaining / (60 * 1000)); // Convert to minutes
  }, [rateLimit.resetTime]);

  // Format time until reset as string
  const getFormattedResetTime = useCallback((): string => {
    const minutes = getTimeUntilReset();
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }, [getTimeUntilReset]);

  // Reset the rate limit (for testing or manual reset)
  const resetRateLimit = useCallback(() => {
    setRateLimit({
      requestsRemaining: MAX_REQUESTS_PER_HOUR,
      resetTime: Date.now() + RESET_INTERVAL,
      lastRequest: 0,
    });
  }, []);

  return {
    requestsRemaining: rateLimit.requestsRemaining,
    maxRequests: MAX_REQUESTS_PER_HOUR,
    canMakeRequest: canMakeRequest(),
    trackRequest,
    getTimeUntilReset,
    getFormattedResetTime,
    resetRateLimit,
  };
}

