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
    // Test 1: with format but no extension in public_id
    const url1 = cloudinary.utils.private_download_url("motor-quotes/test-quote-raw", "pdf", {
      resource_type: "raw",
    });
    console.log("URL 1:", url1);
    https.get(url1, (res) => console.log("URL 1 STATUS:", res.statusCode));

    // Test 2: without format, but with extension in public_id
    const url2 = cloudinary.utils.private_download_url("motor-quotes/test-quote-raw.pdf", "", {
      resource_type: "raw",
    });
    console.log("URL 2:", url2);
    https.get(url2, (res) => console.log("URL 2 STATUS:", res.statusCode));
  } catch (error) {
    console.error("ERROR:", error);
  }
}

run().catch(console.error);
