import fs from "fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
// @ts-ignore
import reshaper from "arabic-persian-reshaper";
import { generateInvoicePdfBytes } from "../src/lib/invoice/pdf-generator";

const sample = {
  invoiceNo: "INV-2026-0702-042",
  invoiceDate: "02/07/2026",
  customerName: "أحمد محمد علي",
  vehicleType: "TOYOTA CAMRY",
  vehicleCategory: "PRIVATE",
  trafficCode: "987654",
  feeDescription: "رسوم مسترده عليك سدادها",
  feeAmount: 750,
  feeNotes: "—",
};

function shapeForPdfSearch(text: string): string {
  const shaped = reshaper.ArabicShaper.convertArabic(text);
  return shaped.split("").reverse().join("");
}

async function extractText(bytes: Uint8Array) {
  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();
  return tc.items
    .filter((item) => "str" in item)
    .map((item) => (item as { str: string }).str)
    .join("");
}

async function main() {
  const bytes = await generateInvoicePdfBytes(sample);
  fs.writeFileSync("test-final-invoice.pdf", bytes);

  const text = await extractText(bytes);
  const oldMarkers = [
    "INV-2026-0616-001",
    "01/11/2026",
    "234567",
    "500.00",
    "مثال",
    "ﻣثﺎل",
  ];
  const newMarkers = [
    sample.invoiceNo,
    sample.invoiceDate,
    sample.trafficCode,
    "750.00",
    sample.vehicleType,
    shapeForPdfSearch(sample.customerName),
    shapeForPdfSearch(sample.feeDescription),
  ];

  console.log("Old placeholders still visible:", oldMarkers.filter((m) => text.includes(m)));
  console.log("New values present:", newMarkers.filter((m) => text.includes(m)));
  console.log("Written test-final-invoice.pdf");
}

main().catch(console.error);
