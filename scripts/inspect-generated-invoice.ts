import fs from "fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

async function inspect(file: string) {
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();
  console.log(`\n=== ${file} ===`);
  for (const item of tc.items) {
    if (!("str" in item)) continue;
    const s = item.str;
    if (
      /INV|500|750|01\/11|02\/07|مثال|ﻣ/.test(s) ||
      s.includes("042") ||
      s.includes("CAMRY")
    ) {
      const t = item.transform;
      console.log(
        JSON.stringify({
          str: s,
          x: +t[4].toFixed(1),
          y: +t[5].toFixed(1),
          w: item.width ? +item.width.toFixed(1) : null,
          h: item.height ? +item.height.toFixed(1) : null,
        })
      );
    }
  }
}

async function checkValues(file: string) {
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();
  const all = tc.items
    .filter((i) => "str" in i)
    .map((i) => (i as { str: string }).str)
    .join("");
  for (const v of ["PRIVATE", "987654", "750.00", "TOYOTA CAMRY"]) {
    console.log(`${file} has ${v}:`, all.includes(v));
  }
}

async function main() {
  await inspect("test-final-invoice.pdf");
  await checkValues("test-final-invoice.pdf");
}

main().catch(console.error);
