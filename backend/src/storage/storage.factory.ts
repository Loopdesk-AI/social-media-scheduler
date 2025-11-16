// Storage factory to create appropriate storage provider

import { StorageProvider } from './storage.interface';
import { LocalStorage } from './local.storage';
// Remove R2 storage import to avoid AWS SDK dependency

export function createStorageProvider(): StorageProvider {
  // Only use local storage to avoid AWS SDK dependency
  return new LocalStorage();
}

// Export singleton instance
export const storage = createStorageProvider();
