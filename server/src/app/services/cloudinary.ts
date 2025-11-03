import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { envConf } from "../lib/envConf";
import { db } from "../lib/db";

cloudinary.config({
  cloud_name: envConf.CLOUDINARY_CLOUD_NAME,
  api_key: envConf.CLOUDINARY_API_KEY,
  api_secret: envConf.CLOUDINARY_API_SECRET,
});

class CloudinaryServices {
  async uploadBackupToCloudinary({
    backupFilePath,
  }: {
    backupFilePath: string;
  }) {
    const compressedPath = `${backupFilePath}.gz`;

    // 1. Compress
    execSync(`gzip -c "${backupFilePath}" > "${compressedPath}"`);
    console.log(`✅ Compressed backup: ${compressedPath}`);

    // 2. Upload as a raw file
    const result = await cloudinary.uploader.upload(compressedPath, {
      resource_type: "raw",
      folder: "databridge/db_backups", // optional folder
      use_filename: true,
      unique_filename: false,
      type: "authenticated",
    });

    console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`, {
      ...result,
    });

    // 4. Cleanup local dump (optional)
    fs.unlinkSync(backupFilePath);
    fs.unlinkSync(compressedPath);

    return {
      success: true,
      result,
    };
  }

  async singedURLforCloudinaryFile({ publicId }: { publicId: string }) {
    try {
      const signedUrl = cloudinary.utils.private_download_url(publicId, "raw", {
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 60 * 5, // expires in 5 min
        resource_type: "raw",
      });

      console.log({ signedUrl });
      return signedUrl;
    } catch (error) {
      throw error;
    }
  }
}

export const cloudinaryServices = new CloudinaryServices();
