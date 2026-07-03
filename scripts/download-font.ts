import https from "https";
import fs from "fs";
import path from "path";

const fontDir = path.join(process.cwd(), "public", "fonts");
if (!fs.existsSync(fontDir)) {
  fs.mkdirSync(fontDir, { recursive: true });
}

// Function to fetch json
function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Node.js" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// Function to download a file
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  try {
    console.log("Fetching font package metadata...");
    const metadata = await fetchJson("https://data.jsdelivr.net/v1/package/npm/@fontsource/cairo");
    
    // Find all files in files/
    const ttfFiles = metadata.files
      .filter((f: any) => f.name === "files")[0]?.files
      ?.filter((f: any) => f.name.endsWith(".ttf") || f.name.endsWith(".woff") || f.name.endsWith(".woff2")) || [];

    console.log("Files found:", ttfFiles.map((f: any) => f.name));

    // Let's search for a TTF file in the package
    // Wait, let's look at the flat file structure of the package if possible
    const flatList = await fetchJson("https://data.jsdelivr.net/v1/package/npm/@fontsource/cairo@5.0.0/flat");
    console.log("Flat list length:", flatList.files.length);
    
    const ttfPath = flatList.files.find((f: any) => f.name.endsWith(".ttf"));
    if (ttfPath) {
      const downloadUrl = `https://cdn.jsdelivr.net/npm/@fontsource/cairo@5.0.0${ttfPath.name}`;
      console.log("Downloading font from:", downloadUrl);
      await downloadFile(downloadUrl, path.join(fontDir, "Cairo-Regular.ttf"));
      console.log("Downloaded Cairo-Regular.ttf successfully!");
    } else {
      console.log("No .ttf font file found in flat list. Trying Amiri...");
      const amiriFlatList = await fetchJson("https://data.jsdelivr.net/v1/package/npm/@fontsource/amiri@5.0.0/flat");
      const amiriTtfPath = amiriFlatList.files.find((f: any) => f.name.endsWith(".ttf"));
      if (amiriTtfPath) {
        const downloadUrl = `https://cdn.jsdelivr.net/npm/@fontsource/amiri@5.0.0${amiriTtfPath.name}`;
        console.log("Downloading font from:", downloadUrl);
        await downloadFile(downloadUrl, path.join(fontDir, "Amiri-Regular.ttf"));
        console.log("Downloaded Amiri-Regular.ttf successfully!");
      } else {
        console.log("No .ttf font found in Amiri package either.");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
