import { Router } from "express";
import { StorageController } from "../controllers/storage.controller";

const router = Router();
const storageController = new StorageController();

// GET /api/storage/providers - List available storage providers
router.get(
  "/providers",
  storageController.getProviders.bind(storageController),
);

// GET /api/storage/auth/:provider - Get OAuth URL for storage provider
router.get(
  "/auth/:provider",
  storageController.getAuthUrl.bind(storageController),
);

// GET /api/storage/callback/:provider - OAuth callback
router.get(
  "/callback/:provider",
  storageController.handleCallback.bind(storageController),
);

// GET /api/storage/integrations - List user's connected storage
router.get(
  "/integrations",
  storageController.getIntegrations.bind(storageController),
);

// DELETE /api/storage/integrations/:id - Disconnect storage
router.delete(
  "/integrations/:id",
  storageController.deleteIntegration.bind(storageController),
);

// GET /api/storage/:integrationId/files - List files in folder
router.get(
  "/:integrationId/files",
  storageController.listFiles.bind(storageController),
);

// GET /api/storage/:integrationId/download/:fileId - Get download URL
router.get(
  "/:integrationId/download/:fileId",
  storageController.getDownloadUrl.bind(storageController),
);

// POST /api/storage/:integrationId/import/:fileId - Import file to temp storage
router.post(
  "/:integrationId/import/:fileId",
  storageController.importFile.bind(storageController),
);

// POST /api/storage/:integrationId/search - Search files
router.post(
  "/:integrationId/search",
  storageController.searchFiles.bind(storageController),
);

// GET /api/storage/:integrationId/thumbnail/:fileId - Get thumbnail URL
router.get(
  "/:integrationId/thumbnail/:fileId",
  storageController.getThumbnail.bind(storageController),
);

// POST /api/storage/:integrationId/batch-import - Batch import files
router.post(
  "/:integrationId/batch-import",
  storageController.batchImport.bind(storageController),
);

// GET /api/storage/:integrationId/shared-drives - List shared drives (Google Drive only)
router.get(
  "/:integrationId/shared-drives",
  storageController.listSharedDrives.bind(storageController),
);

// POST /api/storage/:integrationId/export/:fileId - Export Google Workspace file
router.post(
  "/:integrationId/export/:fileId",
  storageController.exportFile.bind(storageController),
);

export default router;
