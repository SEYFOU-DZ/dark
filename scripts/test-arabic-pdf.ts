import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
// @ts-ignore
import reshaper from "arabic-persian-reshaper";

async function run() {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Amiri.ttf"));
  const amiriFont = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage([600, 400]);

  const arabicText = "محمد العربي";
  console.log("Original:", arabicText);

  // Reshape and reverse
  const reshaped = reshaper.ArabicShaper.convertArabic(arabicText);
  console.log("Reshaped:", reshaped);

  const reversed = reshaped.split("").reverse().join("");
  console.log("Reversed:", reversed);

  page.drawText(reversed, {
    x: 400,
    y: 200,
    size: 24,
    font: amiriFont,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync("test-arabic-font.pdf", pdfBytes);
  console.log("test-arabic-font.pdf saved successfully!");
}

run().catch(console.error);
