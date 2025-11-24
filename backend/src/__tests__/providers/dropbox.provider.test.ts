import { DropboxProvider } from '../../providers/storage/dropbox/dropbox.provider';
import { DropboxError } from '../../providers/storage/dropbox/dropbox.errors';

// Mock the dropbox module
jest.mock('dropbox', () => {
  return {
    Dropbox: jest.fn().mockImplementation(() => {
      return {
        auth: {
          getAuthenticationUrl: jest.fn().mockReturnValue('https://example.com/auth'),
          getAccessTokenFromCode: jest.fn().mockResolvedValue({
            result: {
              access_token: 'access_token'
            }
          })
        },
        usersGetCurrentAccount: jest.fn().mockResolvedValue({
          result: {
            account_id: 'user123',
            email: 'test@example.com',
            name: {
              given_name: 'Test',
              surname: 'User'
            },
            profile_photo_url: 'https://example.com/photo.jpg'
          }
        }),
        usersGetSpaceUsage: jest.fn().mockResolvedValue({
          result: {
            used: 1000000,
            allocation: {
              allocated: 5000000
            }
          }
        }),
        filesListFolder: jest.fn().mockResolvedValue({
          result: {
            entries: [
              {
                '.tag': 'file',
                id: 'file1',
                name: 'test.mp4',
                size: 1000000,
                server_modified: '2023-01-01T00:00:00Z',
                path_display: '/test.mp4'
              }
            ],
            has_more: false,
            cursor: 'cursor123'
          }
        }),
        filesGetMetadata: jest.fn().mockImplementation(({ path }) => {
          if (path === 'file1') {
            return Promise.resolve({
              result: {
                '.tag': 'file',
                id: 'file1',
                name: 'test.mp4',
                size: 1000000,
                server_modified: '2023-01-01T00:00:00Z',
                path_display: '/test.mp4'
              }
            });
          }
          return Promise.reject(new Error('File not found'));
        }),
        filesDownload: jest.fn().mockResolvedValue({
          result: {
            fileBinary: 'file_content',
            name: 'test.mp4'
          }
        }),
        filesGetTemporaryLink: jest.fn().mockResolvedValue({
          result: {
            link: 'https://example.com/temp-link'
          }
        })
      };
    })
  };
});

describe('DropboxProvider', () => {
  let provider: DropboxProvider;

  beforeEach(() => {
    // Set environment variables for testing
    process.env.DROPBOX_CLIENT_ID = 'test_client_id';
    process.env.DROPBOX_CLIENT_SECRET = 'test_client_secret';
    process.env.DROPBOX_REDIRECT_URI = 'http://localhost:3001/callback';

    provider = new DropboxProvider();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate a valid OAuth URL', async () => {
      const result = await provider.generateAuthUrl();

      expect(result.url).toContain('https://example.com/auth');
      expect(result.state).toBeDefined();
    });
  });

  describe('authenticate', () => {
    it('should authenticate and return auth details', async () => {
      const result = await provider.authenticate({
        code: 'test_code'
      });

      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('should throw an error if access token is not available', async () => {
      // Mock the auth.getAccessTokenFromCode to return null access_token
      const Dropbox = require('dropbox').Dropbox;
      Dropbox.mockImplementationOnce(() => {
        return {
          auth: {
            getAccessTokenFromCode: jest.fn().mockResolvedValue({
              result: {
                access_token: null
              }
            })
          }
        };
      });

      const provider = new DropboxProvider();

      await expect(provider.authenticate({
        code: 'test_code'
      })).rejects.toThrow(DropboxError);
    });
  });

  describe('refreshToken', () => {
    it('should throw an error as Dropbox does not support refresh tokens in this implementation', async () => {
      await expect(provider.refreshToken('refresh_token'))
        .rejects.toThrow(DropboxError);
    });
  });

  describe('listFiles', () => {
    it('should list files from root folder', async () => {
      const result = await provider.listFiles('access_token');

      expect(result.files).toHaveLength(1);
      expect(result.files[0].id).toBe('file1');
      expect(result.files[0].name).toBe('test.mp4');
    });
  });

  describe('getFile', () => {
    it('should get file metadata', async () => {
      const result = await provider.getFile('access_token', 'file1');

      expect(result.id).toBe('file1');
      expect(result.name).toBe('test.mp4');
      expect(result.mimeType).toBe('application/octet-stream');
    });

    it('should throw an error for non-existent file', async () => {
      await expect(provider.getFile('access_token', 'nonexistent'))
        .rejects.toThrow(DropboxError);
    });
  });

  describe('downloadFile', () => {
    it('should download file content', async () => {
      const result = await provider.downloadFile('access_token', 'file1');

      expect(result.filename).toBe('test.mp4');
      expect(result.mimeType).toBe('application/octet-stream');
      expect(result.stream).toBeDefined();
    });
  });

  describe('getDownloadUrl', () => {
    it('should get temporary download URL', async () => {
      const result = await provider.getDownloadUrl('access_token', 'file1');

      expect(result).toBe('https://example.com/temp-link');
    });
  });

  describe('searchFiles', () => {
    it('should search files', async () => {
      const result = await provider.searchFiles('access_token', { query: 'test' });
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('test.jpg');
    });
  });

  describe('getThumbnail', () => {
    it('should get thumbnail', async () => {
      const result = await provider.getThumbnail('access_token', 'file1');
      expect(result).toContain('data:image/jpeg;base64,');
    });
  });

  describe('batchGetFiles', () => {
    it('should get multiple files', async () => {
      const result = await provider.batchGetFiles('access_token', ['file1']);
      expect(result).toHaveLength(1);
    });
  });
});