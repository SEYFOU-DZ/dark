import fs from "fs";
import { PDFDocument, PDFName } from "pdf-lib";

async function checkInteractive() {
  const bytes = fs.readFileSync("new.pdf");
  const pdfDoc = await PDFDocument.load(bytes);
  const acroForm = pdfDoc.catalog.lookup(PDFName.of("AcroForm"));
  if (acroForm) {
    console.log("AcroForm exists!");
    console.log(acroForm.toString());
  } else {
    console.log("No AcroForm in Catalog.");
  }
}
checkInteractive().catch(console.error);
