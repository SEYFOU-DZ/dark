import https from "https";
import fs from "fs";
import path from "path";

const fontDir = path.join(process.cwd(), "public", "fonts");
if (!fs.existsSync(fontDir)) {
  fs.mkdirSync(fontDir, { recursive: true });
}

const urls = [
  // Fontsource Cairo TTF urls
  "https://cdn.jsdelivr.net/npm/@fontsource/cairo/files/cairo-arabic-400-normal.ttf",
  "https://cdn.jsdelivr.net/npm/@fontsource/cairo/files/cairo-all-400-normal.ttf",
  "https://cdn.jsdelivr.net/npm/@fontsource/cairo/files/cairo-latin-400-normal.ttf",
  // Fontsource Amiri TTF urls
  "https://cdn.jsdelivr.net/npm/@fontsource/amiri/files/amiri-arabic-400-normal.ttf",
  "https://cdn.jsdelivr.net/npm/@fontsource/amiri/files/amiri-all-400-normal.ttf",
  "https://cdn.jsdelivr.net/npm/@fontsource/amiri/files/amiri-latin-400-normal.ttf",
  // Standard Google Fonts raw URLs
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/cairo/Cairo%5Bwdth%2Cwght%5D.ttf",
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf",
];

function tryDownload(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("Checking:", url);
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const dest = path.join(fontDir, url.includes("cairo") ? "Cairo.ttf" : "Amiri.ttf");
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("SUCCESS! Saved to:", dest);
          resolve(true);
        });
      } else {
        console.log("Status:", res.statusCode, "for", url);
        resolve(false);
      }
    }).on("error", (err) => {
      console.log("Error for", url, err.message);
      resolve(false);
    });
  });
}

async function run() {
  for (const url of urls) {
    const success = await tryDownload(url);
    if (success) {
      console.log("Font downloaded successfully!");
      return;
    }
  }
  console.log("Failed to download any font from CDN.");
}

run();
