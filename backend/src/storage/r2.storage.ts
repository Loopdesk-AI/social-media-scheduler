// Cloudflare R2 storage implementation

import { StorageProvider } from "./storage.interface";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

export class R2Storage implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET || "";
    this.publicUrl =
      process.env.CLOUDFLARE_R2_PUBLIC_URL ||
      `https://${this.bucket}.r2.cloudflarestorage.com`;

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket) {
      throw new Error(
        "Cloudflare R2 configuration is incomplete. Required: CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY, CLOUDFLARE_R2_BUCKET",
      );
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(filePath: string, destination: string): Promise<string> {
    const fileStream = createReadStream(filePath);
    const stats = await stat(filePath);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: destination,
        Body: fileStream,
        ContentLength: stats.size,
      }),
    );

    return destination;
  }

  async delete(path: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.name !== "NoSuchKey") {
        throw error;
      }
    }
  }

  async getUrl(path: string): Promise<string> {
    return `${this.publicUrl}/${path}`;
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async getSize(path: string): Promise<number> {
    const response = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );
    return response.ContentLength || 0;
  }
}
