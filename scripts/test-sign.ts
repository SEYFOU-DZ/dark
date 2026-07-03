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
  secure: true,
});

async function run() {
  const url = cloudinary.url("motor-quotes/test-quote-raw", {
    resource_type: "raw",
    sign_url: true,
    type: "upload",
  });
  console.log("SIGNED RAW URL:", url);

  const imgUrl = cloudinary.url("motor-quotes/test-quote-image.pdf", {
    resource_type: "image",
    sign_url: true,
    type: "upload",
  });
  console.log("SIGNED IMAGE URL:", imgUrl);
}

run().catch(console.error);
