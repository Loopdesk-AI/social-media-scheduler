// Local filesystem storage implementation

import { StorageProvider } from "./storage.interface";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { copyFile, stat, unlink } from "fs/promises";

export class LocalStorage implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor() {
    this.baseDir =
      process.env.STORAGE_LOCAL_PATH || join(process.cwd(), "uploads");
    this.baseUrl =
      process.env.STORAGE_LOCAL_URL || "http://localhost:3000/uploads";
  }

  async upload(filePath: string, destination: string): Promise<string> {
    const fullPath = join(this.baseDir, destination);

    // Ensure directory exists
    await fs.mkdir(dirname(fullPath), { recursive: true });

    // Copy file to destination
    await copyFile(filePath, fullPath);

    return destination;
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.baseDir, path);

    try {
      await unlink(fullPath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // File doesn't exist, ignore
    }
  }

  async getUrl(path: string): Promise<string> {
    return `${this.baseUrl}/${path}`;
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = join(this.baseDir, path);

    try {
      await stat(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getSize(path: string): Promise<number> {
    const fullPath = join(this.baseDir, path);
    const stats = await stat(fullPath);
    return stats.size;
  }
}
