import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a PDF buffer to Cloudinary and returns the secure URL.
 * The file is stored under the "motor-quotes" folder with the given filename as public_id.
 */
export async function uploadPdfToCloudinary(
  pdfBytes: Uint8Array,
  publicId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "motor-quotes",
        public_id: publicId,
        overwrite: true,
        format: "txt", // Upload as .txt to bypass Cloudinary's PDF download block
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result.secure_url);
      }
    );

    // Write the buffer to the upload stream
    const buffer = Buffer.from(pdfBytes);
    uploadStream.end(buffer);
  });
}

/**
 * Returns the raw Cloudinary text URL for a given quotation ID.
 */
export function getCloudinaryTxtUrl(quotationId: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  return `https://res.cloudinary.com/${cloudName}/raw/upload/motor-quotes/${quotationId}.txt`;
}
