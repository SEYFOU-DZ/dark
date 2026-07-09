import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

/**
 * This script copies invoice-source.pdf to invoice-template.pdf
 * (the template that PDF-lib will overlay text onto).
 */

async function main() {
  const sourcePath = path.join(process.cwd(), "public", "templates", "invoice-source.pdf");
  const destPath = path.join(process.cwd(), "public", "templates", "invoice-template.pdf");

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source template not found: ${sourcePath}`);
  }

  const sourceBytes = fs.readFileSync(sourcePath);
  const pdf = await PDFDocument.load(sourceBytes);
  // Re-save to ensure clean slate
  const cleanBytes = await pdf.save();
  fs.writeFileSync(destPath, cleanBytes);

  console.log(`Built: ${destPath} (${cleanBytes.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});