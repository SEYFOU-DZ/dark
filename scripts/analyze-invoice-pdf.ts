import fs from "fs";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

async function main() {
  const pdfPath = path.join(process.cwd(), "public/templates/invoice-source.pdf");
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();

  const placeholders: object[] = [];
  const allText: object[] = [];

  for (const item of tc.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const t = item.transform;
    const entry = {
      str: item.str,
      x: +t[4].toFixed(1),
      y: +t[5].toFixed(1),
      w: item.width ? +item.width.toFixed(1) : null,
      h: item.height ? +item.height.toFixed(1) : null,
      font: item.fontName,
    };
    allText.push(entry);
    if (
      item.str.includes("مثال") ||
      item.str.includes("ﻣ") ||
      /INV-|^\d{2}\/\d{2}\/\d{4}$|^\d+\.\d{2}$/.test(item.str.trim())
    ) {
      placeholders.push(entry);
    }
  }

  console.log("=== PLACEHOLDER / EXAMPLE VALUES ===");
  for (const p of placeholders) console.log(JSON.stringify(p));

  console.log("\n=== ALL TEXT (first 20) ===");
  for (const p of allText.slice(0, 20)) console.log(JSON.stringify(p));
}

main().catch(console.error);
