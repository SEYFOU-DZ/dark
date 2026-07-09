import fs from "fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

async function main() {
  const b = new Uint8Array(fs.readFileSync("test-final-invoice.pdf"));
  const doc = await pdfjs.getDocument({ data: b }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();

  for (const item of tc.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const y = item.transform[5];
    if (y > 170 && y < 720) {
      console.log(JSON.stringify({
        str: item.str,
        x: +item.transform[4].toFixed(1),
        y: +y.toFixed(1),
      }));
    }
  }
}

main().catch(console.error);
