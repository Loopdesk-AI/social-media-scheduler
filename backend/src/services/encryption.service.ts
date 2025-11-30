import crypto from 'crypto';

/**
 * Encryption service for securing OAuth tokens
 * Uses AES-256-CBC encryption with random IV
 * 
 * Uses lazy initialization to ensure environment variables are loaded
 * before attempting to access them.
 */
class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private key: Buffer | null = null;
  private initialized = false;

  /**
   * Initialize the encryption key from environment variables
   * This is called lazily on first use to ensure dotenv has loaded
   */
  private initialize(): void {
    if (this.initialized) {
      return;
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }

    if (encryptionKey.length !== 64) {
      throw new Error(
        `ENCRYPTION_KEY must be exactly 64 characters (32 bytes in hex). ` +
        `Current length: ${encryptionKey.length}. ` +
        'Generate a new key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }

    try {
      this.key = Buffer.from(encryptionKey, 'hex');
      this.initialized = true;
    } catch (error) {
      throw new Error(
        'ENCRYPTION_KEY must be a valid hexadecimal string. ' +
        'Generate a new key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
  }

  /**
   * Encrypt text using AES-256-CBC
   * @param text Plain text to encrypt
   * @returns Encrypted text in format: iv:encryptedData
   */
  encrypt(text: string): string {
    this.initialize();

    if (!this.key) {
      throw new Error('Encryption service not properly initialized');
    }

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Encryption failed: ${message}`);
    }
  }

  /**
   * Decrypt text using AES-256-CBC
   * @param text Encrypted text in format: iv:encryptedData
   * @returns Decrypted plain text
   */
  decrypt(text: string): string {
    this.initialize();

    if (!this.key) {
      throw new Error('Encryption service not properly initialized');
    }

    try {
      const parts = text.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Decryption failed: ${message}`);
    }
  }
}

// Create singleton instance (but don't initialize yet)
const encryptionService = new EncryptionService();

// Export wrapper functions that call the service methods
export const encrypt = (text: string): string => encryptionService.encrypt(text);
export const decrypt = (text: string): string => encryptionService.decrypt(text);

// Also export the service instance for testing
export { encryptionService };
