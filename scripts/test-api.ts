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

async function run() {
  try {
    // Attempt to download the resource using authenticated API
    const result = await cloudinary.api.resource("motor-quotes/test-quote-raw.pdf", {
      resource_type: "raw",
    });
    console.log("RESOURCE DETAIL SUCCESS:", result);
  } catch (error) {
    console.error("RESOURCE DETAIL ERROR:", error);
  }
}

run().catch(console.error);
