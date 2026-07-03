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
    // Upload as raw with no format
    const result = await cloudinary.uploader.upload("public/templates/quote-source.pdf", {
      resource_type: "raw",
      folder: "motor-quotes",
      public_id: "test-quote-no-format",
      overwrite: true,
    });
    console.log("NO FORMAT UPLOAD RESULT:", result);

    const url = result.secure_url;
    https.get(url, (res) => {
      console.log("DOWNLOAD STATUS:", res.statusCode);
      console.log("DOWNLOAD HEADERS:", res.headers);
    });
  } catch (error) {
    console.error("ERROR:", error);
  }
}

run().catch(console.error);
