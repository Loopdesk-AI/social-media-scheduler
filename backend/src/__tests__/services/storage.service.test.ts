import { StorageService } from '../../services/storage.service';
import { integrationManager } from '../../providers/integration.manager';
import { GoogleDriveProvider } from '../../providers/storage/google-drive/google-drive.provider';
import { DropboxProvider } from '../../providers/storage/dropbox/dropbox.provider';
import { StorageFile } from '../../providers/base/storage.interface';

// Mock dependencies
jest.mock('../../providers/integration.manager');
jest.mock('../../providers/storage/google-drive/google-drive.provider');
jest.mock('../../providers/storage/dropbox/dropbox.provider');

describe('StorageService', () => {
  let service: StorageService;
  let mockGoogleProvider: jest.Mocked<GoogleDriveProvider>;
  let mockDropboxProvider: jest.Mocked<DropboxProvider>;

  const mockIntegrationId = 'integration-123';
  const mockUserId = 'user-123';
  const mockFileId = 'file-123';
  const mockAccessToken = 'access-token-123';

  beforeEach(() => {
    service = new StorageService();

    // Reset mocks
    jest.clearAllMocks();

    // Setup provider mocks
    mockGoogleProvider = new GoogleDriveProvider() as jest.Mocked<GoogleDriveProvider>;
    mockDropboxProvider = new DropboxProvider() as jest.Mocked<DropboxProvider>;

    // Mock integration manager to return our mock providers
    (integrationManager.getStorageIntegration as jest.Mock).mockImplementation((identifier) => {
      if (identifier === 'google-drive') return mockGoogleProvider;
      if (identifier === 'dropbox') return mockDropboxProvider;
      return null;
    });

    // Mock getIntegration to return a valid integration
    jest.spyOn(service as any, 'ensureValidToken').mockResolvedValue(mockAccessToken);
    jest.spyOn(service as any, 'getProvider').mockReturnValue(mockGoogleProvider);
  });

  describe('searchFiles', () => {
    it('should call provider searchFiles method', async () => {
      const mockFiles: StorageFile[] = [
        { id: '1', name: 'test.jpg', mimeType: 'image/jpeg', size: 100, modifiedTime: '2023-01-01', isFolder: false, path: '/test.jpg' }
      ];

      mockGoogleProvider.searchFiles.mockResolvedValue({ files: mockFiles });

      const result = await service.searchFiles({ providerIdentifier: 'google-drive' } as any, 'test');

      expect(mockGoogleProvider.searchFiles).toHaveBeenCalledWith(mockAccessToken, { query: 'test' });
      expect(result.files).toEqual(mockFiles);
    });

    it('should handle provider not supporting search', async () => {
      // Mock provider without searchFiles
      const providerWithoutSearch = { ...mockGoogleProvider };
      delete (providerWithoutSearch as any).searchFiles;
      jest.spyOn(service as any, 'getProvider').mockReturnValue(providerWithoutSearch);

      await expect(service.searchFiles({ providerIdentifier: 'google-drive' } as any, 'test'))
        .rejects.toThrow('Search not supported');
    });
  });

  describe('getThumbnail', () => {
    it('should call provider getThumbnail method', async () => {
      const mockUrl = 'https://example.com/thumb.jpg';
      mockGoogleProvider.getThumbnail.mockResolvedValue(mockUrl);

      const result = await service.getThumbnail({ providerIdentifier: 'google-drive' } as any, mockFileId, 256);

      expect(mockGoogleProvider.getThumbnail).toHaveBeenCalledWith(mockAccessToken, mockFileId, 256);
      expect(result).toEqual(mockUrl);
    });
  });

  describe('batchGetFiles', () => {
    it('should call provider batchGetFiles method', async () => {
      const mockFileIds = ['1', '2'];
      const mockFiles: StorageFile[] = [
        { id: '1', name: '1.jpg', mimeType: 'image/jpeg', size: 100, modifiedTime: '2023-01-01', isFolder: false, path: '/1.jpg' },
        { id: '2', name: '2.jpg', mimeType: 'image/jpeg', size: 100, modifiedTime: '2023-01-01', isFolder: false, path: '/2.jpg' }
      ];

      mockGoogleProvider.batchGetFiles.mockResolvedValue(mockFiles);

      const result = await service.batchGetFiles({ providerIdentifier: 'google-drive' } as any, mockFileIds);

      expect(mockGoogleProvider.batchGetFiles).toHaveBeenCalledWith(mockAccessToken, mockFileIds);
      expect(result).toHaveLength(2);
    });
  });

  describe('listSharedDrives', () => {
    it('should call provider listSharedDrives method', async () => {
      const mockDrives = [{ id: 'd1', name: 'Team Drive 1' }];
      mockGoogleProvider.listSharedDrives.mockResolvedValue(mockDrives);

      const result = await service.listSharedDrives({ providerIdentifier: 'google-drive' } as any);

      expect(mockGoogleProvider.listSharedDrives).toHaveBeenCalledWith(mockAccessToken);
      expect(result).toEqual(mockDrives);
    });
  });

  describe('exportFile', () => {
    it('should call provider exportFile method', async () => {
      const mockStream = {} as any;
      mockGoogleProvider.exportFile.mockResolvedValue({
        stream: mockStream,
        filename: 'doc.pdf',
        mimeType: 'application/pdf'
      });

      const result = await service.exportFile({ providerIdentifier: 'google-drive' } as any, mockFileId, 'pdf');

      expect(mockGoogleProvider.exportFile).toHaveBeenCalledWith(mockAccessToken, mockFileId, 'pdf');
      expect(result.filename).toBe('doc.pdf');
    });
  });
});