import fs from "fs";
import { PDFDocument } from "pdf-lib";

async function checkFormFields() {
  const bytes = fs.readFileSync("new.pdf");
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  console.log(`Number of form fields: ${fields.length}`);
  for (const field of fields) {
    console.log(`Field name: ${field.getName()}, Type: ${field.constructor.name}`);
  }
}

checkFormFields().catch(console.error);
