// Storage factory to create appropriate storage provider

import { StorageProvider } from "./storage.interface";
import { R2Storage } from "./r2.storage";

/**
 * Create the storage provider
 * Uses Cloudflare R2 for cloud-based file storage
 */
export function createStorageProvider(): StorageProvider {
  return new R2Storage();
}

// Export singleton instance
export const storage = createStorageProvider();
