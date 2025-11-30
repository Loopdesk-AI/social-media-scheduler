import { GoogleDriveProvider } from '../../providers/storage/google-drive/google-drive.provider';
import { GoogleDriveError } from '../../providers/storage/google-drive/google-drive.errors';

// Mock the googleapis module
jest.mock('googleapis', () => {
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => {
          return {
            generateAuthUrl: jest.fn().mockReturnValue('https://example.com/auth'),
            getToken: jest.fn().mockResolvedValue({
              tokens: {
                access_token: 'access_token',
                refresh_token: 'refresh_token',
                expiry_date: Date.now() + 3600000
              }
            }),
            setCredentials: jest.fn(),
            refreshAccessToken: jest.fn().mockResolvedValue({
              credentials: {
                access_token: 'new_access_token',
                refresh_token: 'refresh_token',
                expiry_date: Date.now() + 3600000
              }
            })
          };
        })
      },
      oauth2: jest.fn().mockReturnValue({
        userinfo: {
          get: jest.fn().mockResolvedValue({
            data: {
              id: 'user123',
              email: 'test@example.com',
              name: 'Test User'
            }
          })
        }
      }),
      drive: jest.fn().mockReturnValue({
        about: {
          get: jest.fn().mockResolvedValue({
            data: {
              storageQuota: {
                usage: '1000000',
                limit: '5000000'
              }
            }
          })
        },
        files: {
          list: jest.fn().mockResolvedValue({
            data: {
              files: [
                {
                  id: 'file1',
                  name: 'test.mp4',
                  mimeType: 'video/mp4',
                  size: '1000000',
                  modifiedTime: '2023-01-01T00:00:00Z'
                }
              ]
            }
          }),
          get: jest.fn().mockImplementation(({ fileId, fields }) => {
            if (fileId === 'file1') {
              return Promise.resolve({
                data: {
                  id: 'file1',
                  name: 'test.mp4',
                  mimeType: 'video/mp4',
                  size: '1000000',
                  modifiedTime: '2023-01-01T00:00:00Z'
                }
              });
            }
            return Promise.reject(new Error('File not found'));
          }),
          download: jest.fn().mockResolvedValue({
            data: 'file_content'
          })
        }
      })
    }
  };
});

describe('GoogleDriveProvider', () => {
  let provider: GoogleDriveProvider;

  beforeEach(() => {
    // Set environment variables for testing
    process.env.GOOGLE_DRIVE_CLIENT_ID = 'test_client_id';
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = 'test_client_secret';
    process.env.GOOGLE_DRIVE_REDIRECT_URI = 'http://localhost:3001/callback';

    provider = new GoogleDriveProvider();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate a valid OAuth URL', async () => {
      const result = await provider.generateAuthUrl();

      expect(result.url).toContain('https://example.com/auth');
      expect(result.state).toBeDefined();
      expect(result.codeVerifier).toBeDefined();
    });
  });

  describe('authenticate', () => {
    it('should authenticate and return auth details', async () => {
      const result = await provider.authenticate({
        code: 'test_code'
      });

      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('should throw an error if user info is not available', async () => {
      // Mock the oauth2 userinfo.get to return null data
      const google = require('googleapis').google;
      google.oauth2.mockReturnValueOnce({
        userinfo: {
          get: jest.fn().mockResolvedValue({ data: null })
        }
      });

      const provider = new GoogleDriveProvider();

      await expect(provider.authenticate({
        code: 'test_code'
      })).rejects.toThrow(GoogleDriveError);
    });
  });

  describe('refreshToken', () => {
    it('should refresh the token and return new auth details', async () => {
      const result = await provider.refreshToken('refresh_token');

      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('should throw an error if user info is not available after refresh', async () => {
      // Mock the oauth2 userinfo.get to return null data after refresh
      const google = require('googleapis').google;
      google.oauth2.mockReturnValueOnce({
        userinfo: {
          get: jest.fn().mockResolvedValue({ data: null })
        }
      });

      const provider = new GoogleDriveProvider();

      await expect(provider.refreshToken('refresh_token'))
        .rejects.toThrow(GoogleDriveError);
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
      expect(result.mimeType).toBe('video/mp4');
    });

    it('should throw an error for non-existent file', async () => {
      await expect(provider.getFile('access_token', 'nonexistent'))
        .rejects.toThrow(GoogleDriveError);
    });
  });

  describe('downloadFile', () => {
    it('should download file content', async () => {
      const result = await provider.downloadFile('access_token', 'file1');

      expect(result.filename).toBe('test.mp4');
      expect(result.mimeType).toBe('video/mp4');
      expect(result.stream).toBeDefined();
    });
  });

  it('should get download URL', async () => {
    const result = await provider.getDownloadUrl('access_token', 'file1');

    expect(result).toBe('https://example.com/auth');
  });


  describe('searchFiles', () => {
    it('should search files with query', async () => {
      const result = await provider.searchFiles('access_token', { query: 'test' });
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('test.mp4');
    });
  });

  describe('getThumbnail', () => {
    it('should get thumbnail link', async () => {
      // Mock getFile to return thumbnailLink
      const google = require('googleapis').google;
      const mockGet = google.drive().files.get;
      mockGet.mockResolvedValueOnce({
        data: {
          id: 'file1',
          thumbnailLink: 'https://example.com/thumb.jpg'
        }
      });

      const result = await provider.getThumbnail('access_token', 'file1');
      expect(result).toBe('https://example.com/thumb.jpg');
    });
  });

  describe('batchGetFiles', () => {
    it('should get multiple files', async () => {
      const result = await provider.batchGetFiles('access_token', ['file1']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('file1');
    });
  });

  describe('listSharedDrives', () => {
    it('should list shared drives', async () => {
      // Mock drives.list
      const google = require('googleapis').google;
      const mockDrivesList = jest.fn().mockResolvedValue({
        data: {
          drives: [
            { id: 'drive1', name: 'Team Drive' }
          ]
        }
      });
      // We need to attach this mock to the drive instance
      // Since the mock setup is complex, we might need to adjust the global mock or spy on it
      // For now, let's assume we can modify the mock return value
      google.drive.mockReturnValue({
        ...google.drive(),
        drives: { list: mockDrivesList }
      });

      const result = await provider.listSharedDrives('access_token');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Team Drive');
    });
  });

  describe('exportFile', () => {
    it('should export google doc', async () => {
      // Mock files.export
      const google = require('googleapis').google;
      const mockExport = jest.fn().mockResolvedValue({
        data: 'exported_content'
      });

      google.drive.mockReturnValue({
        ...google.drive(),
        files: {
          ...google.drive().files,
          export: mockExport,
          get: jest.fn().mockResolvedValue({
            data: {
              id: 'doc1',
              name: 'Test Doc',
              mimeType: 'application/vnd.google-apps.document'
            }
          })
        }
      });

      const result = await provider.exportFile('access_token', 'doc1', 'application/pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toBe('Test Doc.pdf');
    });
  });
});