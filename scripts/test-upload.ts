import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

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

async function testUpload() {
  const result = await cloudinary.uploader.upload("public/templates/quote-source.pdf", {
    resource_type: "raw",
    folder: "motor-quotes",
    public_id: "test-quote-raw",
    overwrite: true,
  });
  console.log("RAW RESULT:", result);

  const imageResult = await cloudinary.uploader.upload("public/templates/quote-source.pdf", {
    resource_type: "image",
    folder: "motor-quotes",
    public_id: "test-quote-image",
    overwrite: true,
  });
  console.log("IMAGE RESULT:", imageResult);
}

testUpload().catch(console.error);
