import fs from "fs";
import { PDFDocument, PDFName } from "pdf-lib";

async function checkFonts() {
  const bytes = fs.readFileSync("new.pdf");
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPage(0);
  const resources = page.node.Resources();
  const fontDict = resources?.lookup(PDFName.of("Font"));
  console.log("Fonts dict keys:", fontDict instanceof PDFName ? "is PDFName" : fontDict?.constructor.name);
  if (fontDict) {
    // If it's a dictionary, print its keys
    // @ts-ignore
    console.log("Keys:", fontDict.keys().map(k => k.decodeText()));
  }
}
checkFonts().catch(console.error);
