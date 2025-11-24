import { MediaResolverService } from '../../services/media-resolver.service';
import { StorageService } from '../../services/storage.service';
import { prisma } from '../../database/prisma.client';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('../../services/storage.service');
jest.mock('../../database/prisma.client', () => ({
    prisma: {
        integration: {
            findFirst: jest.fn()
        }
    }
}));
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    promises: {
        copyFile: jest.fn(),
        unlink: jest.fn()
    }
}));

describe('MediaResolverService', () => {
    let service: MediaResolverService;
    let mockStorageService: jest.Mocked<StorageService>;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();

        // Setup mocks
        (fs.existsSync as jest.Mock).mockReturnValue(true);

        // Initialize service
        service = new MediaResolverService();
        mockStorageService = (service as any).storageService;
    });

    it('should resolve storage paths correctly', async () => {
        const userId = 'user-123';
        const media = [
            { path: '/storage/integration-1/files/file-1', type: 'image' }
        ];

        // Mock prisma response
        (prisma.integration.findFirst as jest.Mock).mockResolvedValue({
            id: 'integration-1',
            userId,
            providerIdentifier: 'google-drive'
        });

        // Mock storage service response
        mockStorageService.downloadFileToTemp.mockResolvedValue({
            path: '/tmp/temp-file',
            filename: 'test.jpg',
            mimeType: 'image/jpeg'
        });

        const { resolvedMedia, cleanup } = await service.resolveMedia(media, userId);

        // Verify interactions
        expect(prisma.integration.findFirst).toHaveBeenCalledWith({
            where: {
                id: 'integration-1',
                userId,
                deletedAt: null
            }
        });

        expect(mockStorageService.downloadFileToTemp).toHaveBeenCalled();
        expect(fs.promises.copyFile).toHaveBeenCalled();
        expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/temp-file'); // Should delete temp file

        // Verify result
        expect(resolvedMedia[0].path).toContain('test.jpg');
        expect(resolvedMedia[0].path).not.toContain('/storage/');

        // Verify cleanup function
        await cleanup();
        expect(fs.promises.unlink).toHaveBeenCalledTimes(2); // Once for temp, once for cleanup
    });

    it('should ignore non-storage paths', async () => {
        const userId = 'user-123';
        const media = [
            { path: 'https://example.com/image.jpg', type: 'image' }
        ];

        const { resolvedMedia, cleanup } = await service.resolveMedia(media, userId);

        expect(prisma.integration.findFirst).not.toHaveBeenCalled();
        expect(mockStorageService.downloadFileToTemp).not.toHaveBeenCalled();
        expect(resolvedMedia[0].path).toBe('https://example.com/image.jpg');
    });
});
