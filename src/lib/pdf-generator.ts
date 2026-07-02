import fs from "fs";
import path from "path";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";
import type { QuoteFormData } from "./types";
import { calculatePremiums } from "./defaults";
import { formatCurrency, formatDateTime, formatVehicleValue } from "./format";

const FONT_SIZE = 8.3;
const FONT_SIZE_SMALL = 7.7;

interface TextField {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  align?: "left" | "right";
  size?: number;
}

const DYNAMIC_FIELDS: Record<string, TextField> = {
  quotationNo: { page: 0, x: 136, y: 735, width: 90, height: 12 },
  quoteIssueDate: { page: 0, x: 136, y: 720, width: 100, height: 12 },
  insuranceProduct: { page: 0, x: 136, y: 706, width: 158, height: 12 },
  insurancePeriod: { page: 0, x: 136, y: 692, width: 60, height: 12 },
  broker: { page: 0, x: 136, y: 677, width: 140, height: 12 },
  basicPremium: { page: 0, x: 488, y: 720, width: 58, height: 12, align: "right" },
  additionalCovers: { page: 0, x: 505, y: 706, width: 42, height: 12, align: "right" },
  subtotal: { page: 0, x: 488, y: 692, width: 58, height: 12, align: "right" },
  vat: { page: 0, x: 498, y: 677, width: 48, height: 12, align: "right" },
  totalWithVat: { page: 0, x: 483, y: 663, width: 63, height: 12, align: "right" },
  insuredName: { page: 0, x: 124, y: 618, width: 165, height: 12 },
  mobileNo: { page: 0, x: 124, y: 604, width: 100, height: 12 },
  dateOfBirth: { page: 0, x: 124, y: 590, width: 80, height: 12 },
  emailId: { page: 0, x: 124, y: 575, width: 185, height: 12 },
  ncdYears: { page: 0, x: 124, y: 561, width: 40, height: 12 },
  tcfNo: { page: 0, x: 124, y: 547, width: 90, height: 12 },
  nationality: { page: 0, x: 124, y: 533, width: 80, height: 12 },
  insuredType: { page: 0, x: 124, y: 519, width: 90, height: 12 },
  regLocPlate: { page: 0, x: 124, y: 504, width: 120, height: 12 },
  manufacturingYear: { page: 0, x: 390, y: 618, width: 50, height: 12 },
  make: { page: 0, x: 390, y: 604, width: 130, height: 12 },
  trimBodyType: { page: 0, x: 390, y: 590, width: 130, height: 12 },
  cylinders: { page: 0, x: 390, y: 576, width: 30, height: 12 },
  chassisNo: { page: 0, x: 390, y: 562, width: 155, height: 12 },
  seatingCapacity: { page: 0, x: 390, y: 548, width: 50, height: 12 },
  gccSpecification: { page: 0, x: 390, y: 534, width: 30, height: 12 },
  vehicleValue: { page: 0, x: 390, y: 519, width: 110, height: 12 },
  repairType: { page: 0, x: 390, y: 504, width: 80, height: 12 },
  lossOrDamage: { page: 0, x: 345, y: 456, width: 28, height: 12 },
  fireTheft: { page: 0, x: 345, y: 442, width: 28, height: 12 },
  thirdPartyBodily: { page: 0, x: 345, y: 428, width: 28, height: 12 },
  thirdPartyProperty: { page: 0, x: 345, y: 414, width: 28, height: 12 },
  pabDriver: { page: 0, x: 345, y: 386, width: 28, height: 12 },
  pabPassengers: { page: 0, x: 345, y: 371, width: 28, height: 12 },
  pabFamily: { page: 0, x: 345, y: 357, width: 28, height: 12 },
  geographicalArea: { page: 0, x: 345, y: 338, width: 28, height: 12 },
  stormFlood: { page: 0, x: 345, y: 319, width: 28, height: 12 },
  offRoad: { page: 0, x: 345, y: 305, width: 28, height: 12 },
  ambulance: { page: 0, x: 345, y: 291, width: 28, height: 12 },
  emergencyMedical: { page: 0, x: 345, y: 277, width: 28, height: 12 },
  windscreen: { page: 0, x: 345, y: 263, width: 28, height: 12 },
  personalEffects: { page: 0, x: 345, y: 249, width: 28, height: 12 },
  roadsideAssistance: { page: 0, x: 345, y: 235, width: 28, height: 12 },
  hireCarCovered: { page: 0, x: 348, y: 198, width: 25, height: 12 },
  hireCarPremium: { page: 0, x: 448, y: 198, width: 40, height: 12, align: "right" },
  agencyRepairCovered: { page: 0, x: 348, y: 185, width: 25, height: 12 },
  printedDate: { page: 0, x: 28, y: 88, width: 220, height: 12, size: FONT_SIZE_SMALL },
  basicDeductible: { page: 1, x: 146, y: 718, width: 80, height: 12 },
};

function getTemplatePath(): string {
  const blank = path.join(process.cwd(), "public", "templates", "quote-template.pdf");
  if (fs.existsSync(blank)) return blank;
  return path.join(process.cwd(), "public", "templates", "quote-source.pdf");
}

function drawWhiteOut(page: PDFPage, field: TextField) {
  page.drawRectangle({
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });
}

function drawFieldText(
  page: PDFPage,
  field: TextField,
  text: string,
  font: PDFFont
) {
  const size = field.size ?? FONT_SIZE;
  const trimmed = text.trim();
  if (!trimmed) return;

  let x = field.x + 2;
  if (field.align === "right") {
    const textWidth = font.widthOfTextAtSize(trimmed, size);
    x = field.x + field.width - textWidth;
  }

  page.drawText(trimmed, {
    x,
    y: field.y + 2,
    size,
    font,
    color: rgb(0, 0, 0),
  });
}

function buildValues(data: QuoteFormData) {
  const printedDate = data.printedDate || formatDateTime();
  const premiums = calculatePremiums(data.basicPremium, data.additionalCovers);

  return {
    quotationNo: data.quotationNo,
    quoteIssueDate: data.quoteIssueDate,
    insuranceProduct: data.insuranceProduct,
    insurancePeriod: data.insurancePeriod,
    broker: data.broker,
    basicPremium: formatCurrency(data.basicPremium),
    additionalCovers: formatCurrency(data.additionalCovers),
    subtotal: formatCurrency(premiums.subtotal),
    vat: formatCurrency(premiums.vat),
    totalWithVat: formatCurrency(premiums.totalWithVat),
    insuredName: data.insuredName.toUpperCase(),
    mobileNo: data.mobileNo,
    dateOfBirth: data.dateOfBirth,
    emailId: data.emailId,
    ncdYears: data.ncdYears,
    tcfNo: data.tcfNo,
    nationality: data.nationality,
    insuredType: data.insuredType.toUpperCase(),
    regLocPlate: data.regLocPlate,
    manufacturingYear: data.manufacturingYear,
    make: data.make.toUpperCase(),
    trimBodyType: data.trimBodyType.toUpperCase(),
    cylinders: data.cylinders,
    chassisNo: data.chassisNo.toUpperCase(),
    seatingCapacity: data.seatingCapacity,
    gccSpecification: data.gccSpecification,
    vehicleValue: formatVehicleValue(data.vehicleValue),
    repairType: data.repairType,
    lossOrDamage: data.lossOrDamage,
    fireTheft: data.fireTheft,
    thirdPartyBodily: data.thirdPartyBodily,
    thirdPartyProperty: data.thirdPartyProperty,
    pabDriver: data.pabDriver,
    pabPassengers: data.pabPassengers,
    pabFamily: data.pabFamily,
    geographicalArea: data.geographicalArea,
    stormFlood: data.stormFlood,
    offRoad: data.offRoad,
    ambulance: data.ambulance,
    emergencyMedical: data.emergencyMedical,
    windscreen: data.windscreen,
    personalEffects: data.personalEffects,
    roadsideAssistance: data.roadsideAssistance,
    hireCarCovered: data.hireCarCovered,
    hireCarPremium: formatCurrency(data.hireCarPremium),
    agencyRepairCovered: data.agencyRepairCovered,
    printedDate: `Printed/Updated Date: ${printedDate}`,
    basicDeductible: data.basicDeductible,
  };
}

export async function generateQuotePdf(data: QuoteFormData): Promise<Uint8Array> {
  const templateBytes = fs.readFileSync(getTemplatePath());
  const pdf = await PDFDocument.load(templateBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const values = buildValues(data);

  for (const [key, field] of Object.entries(DYNAMIC_FIELDS)) {
    const page = pages[field.page];
    drawWhiteOut(page, field);
    drawFieldText(page, field, values[key as keyof typeof values] ?? "", font);
  }

  return pdf.save();
}

export async function prepareBlankTemplate(): Promise<void> {
  const sourcePath = path.join(process.cwd(), "public", "templates", "quote-source.pdf");
  const outputPath = path.join(process.cwd(), "public", "templates", "quote-template.pdf");
  const templateBytes = fs.readFileSync(sourcePath);
  const pdf = await PDFDocument.load(templateBytes);
  const pages = pdf.getPages();

  for (const field of Object.values(DYNAMIC_FIELDS)) {
    drawWhiteOut(pages[field.page], field);
  }

  fs.writeFileSync(outputPath, await pdf.save());
}
