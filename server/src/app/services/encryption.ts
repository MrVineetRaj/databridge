import crypto from "crypto";
import { envConf } from "../lib/envConf";

class EncryptionServices {
  private algorithm = "aes-256-gcm";
  private encryptionKey: Buffer;

  constructor() {
    // Get from environment variable
    const keyHex = envConf.ENCRYPTION_KEY;
    // console.log(keyHex)
    if (!keyHex) {
      throw new Error("ENCRYPTION_KEY not set in environment");
    }
    this.encryptionKey = Buffer.from(keyHex, "hex");
  }

  /**
   * Encrypt sensitive data (passwords, tokens, etc)
   */
  encrypt(plaintext: string): string {
    // Generate random IV for each encryption
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv
    ) as crypto.CipherGCM; // ✅ Explicit type casting

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag for verification
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted (all hex)
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): {
    success: boolean;
    result: string;
  } {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(":");

    if (!ivHex || !authTagHex || !encrypted) {
      return {
        success: false,
        result: "",
      };
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv
    ) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return { success: true, result: decrypted };
  }
}

export const encryptionServices = new EncryptionServices();
