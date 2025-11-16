// Storage interface for file management

export interface StorageProvider {
  /**
   * Upload a file to storage
   * @param filePath Local file path
   * @param destination Destination path in storage
   * @returns URL or path to uploaded file
   */
  upload(filePath: string, destination: string): Promise<string>;

  /**
   * Delete a file from storage
   * @param path File path in storage
   */
  delete(path: string): Promise<void>;

  /**
   * Get public URL for a file
   * @param path File path in storage
   * @returns Public URL
   */
  getUrl(path: string): Promise<string>;

  /**
   * Check if file exists
   * @param path File path in storage
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file size
   * @param path File path in storage
   */
  getSize(path: string): Promise<number>;
}
