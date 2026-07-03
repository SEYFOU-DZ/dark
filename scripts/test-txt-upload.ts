import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import https from "https";

// Manually parse env file
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      process.env[key.trim()] = values.join("=").trim();
    }
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  try {
    const pdfBytes = fs.readFileSync("public/templates/quote-source.pdf");

    // Upload using upload_stream as raw with public_id ending in .txt
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "motor-quotes",
          public_id: "test-quote-raw-txt.txt",
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error("UPLOAD ERROR:", error);
            return reject(error);
          }
          console.log("UPLOAD SUCCESS:", result);
          
          if (result && result.secure_url) {
            https.get(result.secure_url, (res) => {
              console.log("DOWNLOAD STATUS:", res.statusCode);
              console.log("DOWNLOAD HEADERS:", res.headers);
              resolve(null);
            });
          } else {
            reject(new Error("No result"));
          }
        }
      );
      uploadStream.end(pdfBytes);
    });
  } catch (error) {
    console.error("ERROR:", error);
  }
}

run().catch(console.error);
