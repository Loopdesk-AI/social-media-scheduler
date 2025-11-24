export interface StorageProvider {
  identifier: string;
  name: string;
  icon: string;
}

export const storageProviders: StorageProvider[] = [
  {
    identifier: 'google-drive',
    name: 'Google Drive',
    icon: 'HardDrive'
  },
  {
    identifier: 'dropbox',
    name: 'Dropbox',
    icon: 'HardDrive'
  }
];