import { StorageService } from '../../services/storage.service';
import { integrationManager } from '../../providers/integration.manager';
import { GoogleDriveProvider } from '../../providers/storage/google-drive/google-drive.provider';
import { DropboxProvider } from '../../providers/storage/dropbox/dropbox.provider';
import { prisma } from '../../database/prisma.client';

// Mock external dependencies
jest.mock('../../providers/integration.manager');
jest.mock('../../providers/storage/google-drive/google-drive.provider');
jest.mock('../../providers/storage/dropbox/dropbox.provider');
jest.mock('../../database/prisma.client', () => ({
    prisma: {
        integration: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('Storage Integration Tests', () => {
    let service: StorageService;
    let mockGoogleProvider: jest.Mocked<GoogleDriveProvider>;
    let mockDropboxProvider: jest.Mocked<DropboxProvider>;

    const mockUserId = 'user-123';
    const mockIntegrationId = 'integration-123';
    const mockAccessToken = 'access-token-123';

    beforeEach(() => {
        service = new StorageService();
        jest.clearAllMocks();

        mockGoogleProvider = new GoogleDriveProvider() as jest.Mocked<GoogleDriveProvider>;
        mockDropboxProvider = new DropboxProvider() as jest.Mocked<DropboxProvider>;

        // Setup provider mocks
        (integrationManager.getStorageIntegration as jest.Mock).mockImplementation((identifier) => {
            if (identifier === 'google-drive') return mockGoogleProvider;
            if (identifier === 'dropbox') return mockDropboxProvider;
            throw new Error(`Provider ${identifier} not found`);
        });

        // Setup basic provider methods
        mockGoogleProvider.identifier = 'google-drive';
        mockGoogleProvider.name = 'Google Drive';
        mockDropboxProvider.identifier = 'dropbox';
        mockDropboxProvider.name = 'Dropbox';
    });

    describe('End-to-End Flow: Google Drive', () => {
        it('should handle complete file search flow', async () => {
            // 1. Mock valid token
            jest.spyOn(service as any, 'ensureValidToken').mockResolvedValue(mockAccessToken);
            jest.spyOn(service as any, 'getProvider').mockReturnValue(mockGoogleProvider);

            // 2. Mock search results
            const mockFiles = [
                { id: '1', name: 'test.jpg', mimeType: 'image/jpeg', size: 1000, modifiedTime: '2023-01-01', isFolder: false }
            ];
            mockGoogleProvider.searchFiles.mockResolvedValue({ files: mockFiles });

            // 3. Execute search
            const result = await service.searchFiles({ providerIdentifier: 'google-drive' } as any, 'test');

            // 4. Verify interactions
            expect(mockGoogleProvider.searchFiles).toHaveBeenCalledWith(mockAccessToken, { query: 'test' });
            expect(result.files).toHaveLength(1);
            expect(result.files[0].name).toBe('test.jpg');
        });

        it('should handle token refresh during operation', async () => {
            // 1. Mock expired token and refresh flow
            const mockIntegration = {
                id: mockIntegrationId,
                providerIdentifier: 'google-drive',
                token: 'expired-token',
                refreshToken: 'valid-refresh-token',
                tokenExpiration: new Date(Date.now() - 10000), // Expired
            };

            // Mock decryption
            jest.spyOn(service as any['encryptionService'], 'decrypt').mockImplementation((val) => val);
            jest.spyOn(service as any['encryptionService'], 'encrypt').mockImplementation((val) => val);

            // Mock refresh
            mockGoogleProvider.refreshToken.mockResolvedValue({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                expiresIn: 3600,
                id: 'user-id',
                email: 'test@example.com',
                name: 'Test User'
            });

            // Mock DB update
            (prisma.integration.update as jest.Mock).mockResolvedValue({});

            // 2. Execute operation (listFiles)
            mockGoogleProvider.listFiles.mockResolvedValue({ files: [] });

            // We need to call ensureValidToken directly or through a public method
            // Since we can't easily mock the private method's internal logic while testing it,
            // we'll test the public method that calls it.

            // However, for this integration test, we want to verify the service handles the refresh.
            // We'll mock the getProvider to return our mock.
            jest.spyOn(service as any, 'getProvider').mockReturnValue(mockGoogleProvider);

            // Call listFiles with the expired integration
            await service.listFiles(mockIntegration as any);

            // 3. Verify refresh was called
            expect(mockGoogleProvider.refreshToken).toHaveBeenCalledWith('valid-refresh-token');

            // 4. Verify DB was updated
            expect(prisma.integration.update).toHaveBeenCalledWith({
                where: { id: mockIntegrationId },
                data: expect.objectContaining({
                    token: 'new-access-token',
                }),
            });

            // 5. Verify operation was retried/called with new token
            // Note: In the real implementation, listFiles calls ensureValidToken which returns the new token,
            // then calls provider.listFiles with that new token.
            expect(mockGoogleProvider.listFiles).toHaveBeenCalledWith('new-access-token', undefined, undefined);
        });
    });

    describe('End-to-End Flow: Dropbox', () => {
        it('should handle batch file retrieval', async () => {
            // 1. Mock valid token
            jest.spyOn(service as any, 'ensureValidToken').mockResolvedValue(mockAccessToken);
            jest.spyOn(service as any, 'getProvider').mockReturnValue(mockDropboxProvider);

            // 2. Mock batch results
            const mockFiles = [
                { id: '1', name: 'doc.pdf', mimeType: 'application/pdf', size: 500, modifiedTime: '2023-01-01', isFolder: false },
                { id: '2', name: 'image.png', mimeType: 'image/png', size: 2000, modifiedTime: '2023-01-01', isFolder: false }
            ];
            mockDropboxProvider.batchGetFiles.mockResolvedValue(mockFiles);

            // 3. Execute batch get
            const result = await service.batchGetFiles({ providerIdentifier: 'dropbox' } as any, ['1', '2']);

            // 4. Verify interactions
            expect(mockDropboxProvider.batchGetFiles).toHaveBeenCalledWith(mockAccessToken, ['1', '2']);
            expect(result).toHaveLength(2);
        });
    });
});
