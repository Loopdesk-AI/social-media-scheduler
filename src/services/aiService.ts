import { SuggestionRequest, SuggestionResponse, AIError } from '../types/ai';
import { getCharacterLimit } from '../lib/constants';

const API_URL = 'https://api.perplexity.ai/chat/completions';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

class AIService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
  }

  /**
   * Generate a post suggestion using Perplexity AI
   */
  async generateSuggestion(
    request: SuggestionRequest
  ): Promise<SuggestionResponse> {
    if (!this.apiKey) {
      throw this.createError(
        'Perplexity API key not configured. Please add VITE_PERPLEXITY_API_KEY to your .env file.',
        'CONFIG_ERROR',
        false
      );
    }

    const charLimit = request.charLimit || getCharacterLimit(request.platform);
    const prompt = this.buildPrompt(request, charLimit);

    return this.makeRequestWithRetry(prompt, request.platform);
  }

  /**
   * Build the AI prompt based on user requirements
   */
  private buildPrompt(request: SuggestionRequest, charLimit: number): string {
    const { topic, platform, tone, context } = request;

    let prompt = `Generate a ${tone} social media post for ${platform.toUpperCase()} about "${topic}".`;

    if (context) {
      prompt += ` Context: ${context}.`;
    }

    prompt += `\n\nRequirements:
- Keep it under ${charLimit} characters
- Make it engaging and ${tone}
- Include relevant emojis where appropriate
- Format for ${platform}
- Do NOT include hashtags in the main text (we'll add them separately)
- Return ONLY the post text, nothing else`;

    return prompt;
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequestWithRetry(
    prompt: string,
    platform: string,
    retryCount = 0
  ): Promise<SuggestionResponse> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a professional social media content creator. Generate engaging, platform-appropriate content that respects character limits.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limiting
        if (response.status === 429) {
          if (retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            await this.sleep(delay);
            return this.makeRequestWithRetry(prompt, platform, retryCount + 1);
          }
          throw this.createError(
            'Rate limit exceeded. Please try again in a few moments.',
            'RATE_LIMIT',
            true
          );
        }

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          throw this.createError(
            'Invalid API key. Please check your Perplexity API key.',
            'AUTH_ERROR',
            false
          );
        }

        throw this.createError(
          errorData.message || `API request failed with status ${response.status}`,
          'API_ERROR',
          response.status >= 500
        );
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw this.createError(
          'Invalid response from AI service',
          'INVALID_RESPONSE',
          false
        );
      }

      const content = data.choices[0].message.content.trim();

      return {
        content,
        hashtags: this.extractHashtags(content),
        metadata: {
          model: data.model || 'sonar-pro',
          tokensUsed: data.usage?.total_tokens,
        },
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      // Network or unknown errors
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        await this.sleep(delay);
        return this.makeRequestWithRetry(prompt, platform, retryCount + 1);
      }

      throw this.createError(
        'Network error. Please check your connection and try again.',
        'NETWORK_ERROR',
        true
      );
    }
  }

  /**
   * Extract hashtags from content (if any slip through)
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = content.match(hashtagRegex);
    return matches || [];
  }

  /**
   * Create a standardized error object
   */
  private createError(
    message: string,
    code: string,
    retryable: boolean
  ): AIError {
    const error = new Error(message) as Error & AIError;
    error.code = code;
    error.retryable = retryable;
    return error;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const aiService = new AIService();

