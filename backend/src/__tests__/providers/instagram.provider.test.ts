// Instagram Provider Tests

import { InstagramProvider } from '../../providers/social/instagram/instagram.provider';

describe('InstagramProvider', () => {
  let provider: InstagramProvider;

  beforeEach(() => {
    provider = new InstagramProvider();
  });

  describe('Configuration', () => {
    it('should have correct identifier', () => {
      expect(provider.identifier).toBe('instagram');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('Instagram\\n(Facebook Business)');
    });

    it('should have correct max length', () => {
      expect(provider.maxLength()).toBe(2200);
    });

    it('should have correct scopes', () => {
      expect(provider.scopes).toContain('instagram_basic');
      expect(provider.scopes).toContain('instagram_content_publish');
    });

    it('should have correct max concurrent jobs', () => {
      expect(provider.maxConcurrentJob).toBe(10);
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate valid auth URL', async () => {
      const result = await provider.generateAuthUrl();
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('codeVerifier');
      expect(result).toHaveProperty('state');
      expect(result.url).toContain('facebook.com');
      expect(result.url).toContain('oauth');
    });
  });

  describe('handleErrors', () => {
    it('should handle rate limit error', () => {
      const errorBody = JSON.stringify({
        error: { message: '2207042' }
      });
      
      const result = provider.handleErrors(errorBody);
      
      expect(result).toBeDefined();
      expect(result?.type).toBe('bad-body');
      expect(result?.value).toContain('25 posts per day');
    });

    it('should handle revoked token error', () => {
      const errorBody = JSON.stringify({
        error: { message: 'REVOKED_ACCESS_TOKEN' }
      });
      
      const result = provider.handleErrors(errorBody);
      
      expect(result).toBeDefined();
      expect(result?.type).toBe('refresh-token');
    });

    it('should return undefined for unknown errors', () => {
      const errorBody = JSON.stringify({
        error: { message: 'Unknown error' }
      });
      
      const result = provider.handleErrors(errorBody);
      
      expect(result).toBeUndefined();
    });
  });
});
