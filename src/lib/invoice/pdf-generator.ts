import fs from "fs";
import path from "path";
import {
  PDFDocument,
  rgb,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
// @ts-expect-error arabic-persian-reshaper does not ship TypeScript types.
import reshaper from "arabic-persian-reshaper";
import type { InvoiceFormData } from "./types";
import { formatFeeAmount } from "./defaults";

// ─── Font sizes ───────────────────────────────────────────────────────────────
const FS_NORMAL = 12;
const FS_SMALL  = 11;
const FS_BOLD   = 14;

// ─── Field map ────────────────────────────────────────────────────────────────
interface InvoiceField {
  x: number;
  y: number;
  width: number;
  height: number;
  size?: number;
  align?: "left" | "right" | "center";
  arabic?: boolean;
}

/**
 * Field coordinates from new.pdf (595.6 × 842.5 pt).
 *
 * Table layout (fee row):
 *   Column 1 (صفحة - Description): right-justified, right side
 *   Column 2 (المبلغ - Price):     centered around x=256 (from text extraction)
 *   Column 3 (ملاحظات - Notes):    left column ~32-180
 *
 * The template already has "رسوم مستردة" printed in column 1.
 * We only write feeAmount in column 2 and feeNotes in column 3.
 */
export const INVOICE_FIELDS: Record<string, InvoiceField> = {
  // ── Header ──────────────────────────────────────────────────────────────────
  invoiceNo:   { x: 318, y: 710.3, width: 210, height: 16, size: FS_NORMAL },
  invoiceDate: { x: 362, y: 684.1, width: 155, height: 16, size: FS_NORMAL },

  // ── Customer & Vehicle details ──────────────────────────────────────────────
  customerName:    { x: 90, y: 546.7, width: 320, height: 16, size: FS_BOLD, align: "center", arabic: true },
  vehicleType:     { x: 90, y: 495.4, width: 320, height: 16, size: FS_BOLD, align: "center", arabic: true },
  vehicleCategory: { x: 90, y: 451.5, width: 320, height: 16, size: FS_BOLD, align: "center", arabic: true },
  trafficCode:     { x: 90, y: 398.9, width: 320, height: 16, size: FS_BOLD, align: "center" },

  // ── Fee table ─────────────────────────────────────────────────────────────
  // feeDescription: NOT WRITTEN - template already has "رسوم مستردة" pre-printed
  // Price column (المبلغ): centered around x=256 (extraction evidence: 500.00 at x≈256)
  feeAmount:      { x: 200, y: 244.5, width: 140, height: 16, size: FS_BOLD, align: "center" },
  // Notes column (ملاحظات): left side, centered
  feeNotes:       { x: 32,  y: 244.5, width: 140, height: 16, size: FS_NORMAL, align: "center" },

  // ── Total row ─────────────────────────────────────────────────────────────
  totalAmount:    { x: 32,  y: 182.5, width: 200, height: 16, size: FS_BOLD, align: "right" },

  // ── Notes section (تحت عنوان "ملاحظات") ─────────────────────────────────────
  // Template already has two black bullet points (•) printed
  // We write text directly after each bullet - no "•", no "ملاحظة:" prefix
  notes1:         { x: 68,  y: 116.0, width: 470, height: 22, size: FS_BOLD + 2, align: "right", arabic: true },
  notes2:         { x: 68,  y: 89.0, width: 470, height: 22, size: FS_BOLD + 2, align: "right", arabic: true },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function shapeArabic(text: string): string {
  const trimmed = text.trim();
  if (!hasArabic(trimmed)) return trimmed;

  const shaped = reshaper.ArabicShaper.convertArabic(trimmed);
  const parts = shaped.match(/([\u0600-\u06FF\s]+)|([^\u0600-\u06FF]+)/g);
  if (!parts) return shaped.split("").reverse().join("");

  const reversedParts = parts.map((part: string) => {
    if (hasArabic(part)) {
      return part.split("").reverse().join("");
    }
    return part;
  });

  return reversedParts.reverse().join("");
}

function drawField(
  page: PDFPage,
  f: InvoiceField,
  text: string,
  latinFont: PDFFont,
  arabicFont: PDFFont,
) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const size   = f.size ?? FS_NORMAL;
  const drawY  = f.y;
  const isArab = hasArabic(trimmed);

  if (isArab) {
    const prepared = shapeArabic(trimmed);
    const tw = arabicFont.widthOfTextAtSize(prepared, size);

    let drawX: number;
    if (f.align === "center") {
      drawX = f.x + (f.width - tw) / 2;
    } else if (f.align === "right") {
      drawX = f.x + f.width - tw;
    } else {
      // left align for Arabic = right-to-left so draw at right edge
      drawX = f.x + f.width - tw;
    }

    page.drawText(prepared, {
      x: Math.max(f.x, drawX),
      y: drawY,
      size,
      font: arabicFont,
      color: rgb(0, 0, 0),
    });
  } else {
    const tw = latinFont.widthOfTextAtSize(trimmed, size);
    let drawX: number;
    if (f.align === "center") {
      drawX = f.x + (f.width - tw) / 2;
    } else if (f.align === "right") {
      drawX = f.x + f.width - tw;
    } else {
      drawX = f.x + 2;
    }

    page.drawText(trimmed, {
      x: drawX,
      y: drawY,
      size,
      font: latinFont,
      color: rgb(0, 0, 0),
    });
  }
}

// ─── Template path ────────────────────────────────────────────────────────────

function getInvoiceTemplatePath(): string {
  return path.join(process.cwd(), "public", "templates", "invoice-template.pdf");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateInvoicePdfBytes(
  data: InvoiceFormData,
): Promise<Uint8Array> {
  const templatePath = getInvoiceTemplatePath();
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing invoice template PDF: ${templatePath}`);
  }
  
  const templateBytes = fs.readFileSync(templatePath);
  const pdf = await PDFDocument.load(templateBytes);
  pdf.registerFontkit(fontkit);

  const latinFontBytes  = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "NotoSans.ttf"));
  const arabicFontBytes = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Amiri.ttf"));
  const latinFont  = await pdf.embedFont(latinFontBytes);
  const arabicFont = await pdf.embedFont(arabicFontBytes);

  const page = pdf.getPage(0);
  const amount = formatFeeAmount(data.feeAmount);

  // Just remove any "ملاحظة:" prefix - template has its own bullet points
  const cleanNote = (note: string): string => {
    return note.replace(/^ملاحظة:\s*/i, "").trim();
  };

  const values: Record<string, string> = {
    invoiceNo:       data.invoiceNo,
    invoiceDate:     data.invoiceDate,
    customerName:    data.customerName,
    vehicleType:     data.vehicleType,
    vehicleCategory: data.vehicleCategory,
    trafficCode:     data.trafficCode,
    // feeDescription: NOT written - pre-printed on template
    feeAmount:       amount,
    feeNotes:        data.feeNotes || "",
    totalAmount:     amount,
    notes1:          cleanNote(data.notes1 || ""),
    notes2:          cleanNote(data.notes2 || ""),
  };

  for (const [key, field] of Object.entries(INVOICE_FIELDS)) {
    const val = values[key] ?? "";
    if (val) drawField(page, field, val, latinFont, arabicFont);
  }

  return pdf.save();
}