import fs from "fs";
import path from "path";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
// @ts-expect-error arabic-persian-reshaper does not ship TypeScript types.
import reshaper from "arabic-persian-reshaper";
import type { CustomInvoiceFormData } from "./types";

// Font sizes
const FS_TITLE = 32;
const FS_HEADING = 14;
const FS_NORMAL = 11;
const FS_SMALL = 10;

// Colors - Professional dark theme (pencil-like dark gray)
const COLOR_DARK = rgb(0.2, 0.2, 0.2);
const COLOR_WHITE = rgb(1, 1, 1);
const COLOR_GRAY = rgb(0.5, 0.5, 0.5);
const COLOR_LIGHT_GRAY = rgb(0.95, 0.95, 0.95);
const COLOR_BORDER = rgb(0.9, 0.9, 0.9);

// Page dimensions (A4)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

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

export async function generateCustomInvoicePdf(
  data: CustomInvoiceFormData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // Load fonts
  const latinFont = await pdf.embedFont(StandardFonts.Helvetica);
  const latinBoldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  
  // Load Arabic font
  let arabicFont: PDFFont;
  try {
    const arabicFontBytes = fs.readFileSync(
      path.join(process.cwd(), "public", "fonts", "Amiri.ttf")
    );
    arabicFont = await pdf.embedFont(arabicFontBytes);
  } catch (e) {
    console.warn('Could not load Arabic font, using Helvetica');
    arabicFont = latinFont;
  }

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const isArabic = data.language === 'ar';

  // Helper function to draw text with simple alignment
  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number = FS_NORMAL,
    font: PDFFont = latinFont,
    color: any = rgb(0, 0, 0),
    align: 'left' | 'center' | 'right' = 'left'
  ) => {
    const isArab = hasArabic(text);
    const activeFont = isArab ? arabicFont : font;
    const shapedText = isArab ? shapeArabic(text) : text;
    
    let drawX = x;
    const textWidth = activeFont.widthOfTextAtSize(shapedText, size);
    
    if (align === 'right') {
      drawX = x - textWidth;
    } else if (align === 'center') {
      drawX = x - textWidth / 2;
    }
    // For 'left', keep x as is (start from left)

    page.drawText(shapedText, {
      x: drawX,
      y,
      size,
      font: activeFont,
      color,
    });
  };

  // Header section - Flex-like layout with equal containers
  const headerTopY = PAGE_HEIGHT - 80;
  const headerWidth = PAGE_WIDTH - 2 * MARGIN;
  const halfWidth = headerWidth / 2;
  const leftContainerX = MARGIN;
  const rightContainerX = MARGIN + halfWidth;
  const centerY = headerTopY - 25;
  
  // Left container: Logo (centered in its container)
  if (data.logoUrl) {
    try {
      let logoBytes: Buffer;
      let logoImage: any;
      
      if (data.logoUrl.startsWith('data:image')) {
        const base64Data = data.logoUrl.split(',')[1];
        logoBytes = Buffer.from(base64Data, 'base64');
        
        if (data.logoUrl.includes('image/png')) {
          logoImage = await pdf.embedPng(logoBytes);
        } else if (data.logoUrl.includes('image/jpeg') || data.logoUrl.includes('image/jpg')) {
          logoImage = await pdf.embedJpg(logoBytes);
        } else {
          logoImage = await pdf.embedPng(logoBytes);
        }
        
        // Logo dimensions handling
        const maxLogoWidth = halfWidth * 0.8;
        const maxLogoHeight = 70; // Increased max height as requested
        let logoScale = maxLogoWidth / logoImage.width;
        let logoHeight = logoImage.height * logoScale;
        
        if (logoHeight > maxLogoHeight) {
           logoScale = maxLogoHeight / logoImage.height;
           logoHeight = maxLogoHeight;
        }
        const logoWidth = logoImage.width * logoScale;
        
        // Logo aligned to the very left edge (MARGIN)
        const logoX = MARGIN;
        const logoY = centerY - logoHeight / 2;
        
        page.drawImage(logoImage, {
          x: logoX,
          y: logoY,
          width: logoWidth,
          height: logoHeight,
        });
      }
    } catch (e) {
      console.warn('Failed to embed logo:', e);
    }
  }

  // Right container: INVOICE title (aligned to the right edge)
  const invoiceTitle = isArabic ? 'الفاتورة' : 'INVOICE';
  drawText(invoiceTitle, PAGE_WIDTH - MARGIN, centerY - FS_TITLE / 3, FS_TITLE, latinBoldFont, COLOR_DARK, 'right');

  // Second row: Company name on the left, Date & Invoice No on the right
  const secondRowY = centerY - 60;
  
  // Company name aligned to the left edge
  if (data.companyName) {
    drawText(data.companyName, MARGIN, secondRowY, FS_HEADING + 2, latinBoldFont, COLOR_DARK, 'left');
  }

  // Date and Invoice No (aligned to the right edge)
  const invoiceNoLabel = isArabic ? 'رقم الفاتورة:' : 'Invoice No:';
  const invoiceDateLabel = isArabic ? 'التاريخ:' : 'Date:';
  
  const valueSize = FS_SMALL;
  
  if (isArabic) {
      // In Arabic, Label on the right, Value on the left
      const noLabelW = arabicFont.widthOfTextAtSize(shapeArabic(invoiceNoLabel), valueSize);
      drawText(invoiceNoLabel, PAGE_WIDTH - MARGIN, secondRowY, valueSize, latinBoldFont, COLOR_DARK, 'right');
      drawText(data.invoiceNo || '', PAGE_WIDTH - MARGIN - noLabelW - 5, secondRowY, valueSize, latinBoldFont, COLOR_DARK, 'right');
      
      const dateLabelW = arabicFont.widthOfTextAtSize(shapeArabic(invoiceDateLabel), valueSize);
      drawText(invoiceDateLabel, PAGE_WIDTH - MARGIN, secondRowY - 20, valueSize, latinBoldFont, COLOR_DARK, 'right');
      drawText(data.invoiceDate || '', PAGE_WIDTH - MARGIN - dateLabelW - 5, secondRowY - 20, valueSize, latinBoldFont, COLOR_DARK, 'right');
  } else {
      // In English, Value on the right, Label on the left of the value
      const valW = latinBoldFont.widthOfTextAtSize(data.invoiceNo || '', valueSize);
      drawText(data.invoiceNo || '', PAGE_WIDTH - MARGIN, secondRowY, valueSize, latinBoldFont, COLOR_DARK, 'right');
      drawText(invoiceNoLabel, PAGE_WIDTH - MARGIN - valW - 5, secondRowY, valueSize, latinBoldFont, COLOR_DARK, 'right');
      
      const dateValW = latinBoldFont.widthOfTextAtSize(data.invoiceDate || '', valueSize);
      drawText(data.invoiceDate || '', PAGE_WIDTH - MARGIN, secondRowY - 20, valueSize, latinBoldFont, COLOR_DARK, 'right');
      drawText(invoiceDateLabel, PAGE_WIDTH - MARGIN - dateValW - 5, secondRowY - 20, valueSize, latinBoldFont, COLOR_DARK, 'right');
  }

  let currentY = secondRowY - 50;

  // Draw line separator
  page.drawLine({
    start: { x: MARGIN, y: currentY },
    end: { x: PAGE_WIDTH - MARGIN, y: currentY },
    thickness: 2,
    color: COLOR_DARK,
  });

  currentY -= 40;

  // Items table header - Larger and professional
  const tableHeaderY = currentY;
  const tableHeaderHeight = 35;
  const tableWidth = PAGE_WIDTH - 2 * MARGIN;

  page.drawRectangle({
    x: MARGIN,
    y: tableHeaderY - tableHeaderHeight,
    width: tableWidth,
    height: tableHeaderHeight,
    color: COLOR_DARK,
  });

  const descLabel = isArabic ? 'الوصف' : 'Description';
  const qtyLabel = isArabic ? 'الكمية' : 'Quantity';
  const priceLabel = isArabic ? 'السعر' : 'Price';
  const itemTotalLabel = isArabic ? 'الإجمالي' : 'Total';

  // Column widths
  const colWidths = [tableWidth * 0.45, tableWidth * 0.15, tableWidth * 0.2, tableWidth * 0.2];

  if (isArabic) {
    drawText(descLabel, PAGE_WIDTH - MARGIN - 15, tableHeaderY - 22, FS_HEADING, latinBoldFont, COLOR_WHITE, 'right');
    drawText(qtyLabel, PAGE_WIDTH - MARGIN - colWidths[0] - 15, tableHeaderY - 22, FS_HEADING, latinBoldFont, COLOR_WHITE, 'right');
    drawText(priceLabel, PAGE_WIDTH - MARGIN - colWidths[0] - colWidths[1] - 15, tableHeaderY - 22, FS_HEADING, latinBoldFont, COLOR_WHITE, 'right');
    drawText(itemTotalLabel, MARGIN + 15, tableHeaderY - 22, FS_HEADING, latinBoldFont, COLOR_WHITE, 'left');
  } else {
    drawText(descLabel, MARGIN + 15, tableHeaderY - 22, FS_HEADING, latinBoldFont, COLOR_WHITE);
    drawText(qtyLabel, MARGIN + colWidths[0] + 15, tableHeaderY - 22, FS_HEADING, latinBoldFont, COLOR_WHITE);
    drawText(priceLabel, MARGIN + colWidths[0] + colWidths[1] + 15, tableHeaderY - 22, FS_HEADING, latinBoldFont, COLOR_WHITE);
    drawText(itemTotalLabel, PAGE_WIDTH - MARGIN - 15, tableHeaderY - 22, FS_HEADING, latinBoldFont, COLOR_WHITE, 'right');
  }

  currentY -= tableHeaderHeight;

  // Items rows - Taller and more spacious
  const rowHeight = 40;

  for (const item of data.items) {
    page.drawRectangle({
      x: MARGIN,
      y: currentY - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: COLOR_WHITE,
    });

    page.drawLine({
      start: { x: MARGIN, y: currentY - rowHeight },
      end: { x: PAGE_WIDTH - MARGIN, y: currentY - rowHeight },
      thickness: 1,
      color: COLOR_BORDER,
    });

    if (isArabic) {
      drawText(item.description || '', PAGE_WIDTH - MARGIN - 15, currentY - 25, FS_NORMAL, arabicFont, rgb(0, 0, 0), 'right');
      drawText(String(item.quantity), PAGE_WIDTH - MARGIN - colWidths[0] - 15, currentY - 25, FS_NORMAL, latinFont, rgb(0, 0, 0), 'right');
      drawText(`${item.price.toFixed(2)} ${data.currency}`, PAGE_WIDTH - MARGIN - colWidths[0] - colWidths[1] - 15, currentY - 25, FS_NORMAL, latinFont, rgb(0, 0, 0), 'right');
      drawText(`${item.total.toFixed(2)} ${data.currency}`, MARGIN + 15, currentY - 25, FS_NORMAL, latinBoldFont, rgb(0, 0, 0), 'left');
    } else {
      drawText(item.description || '', MARGIN + 15, currentY - 25, FS_NORMAL, latinFont, rgb(0, 0, 0));
      drawText(String(item.quantity), MARGIN + colWidths[0] + 15, currentY - 25, FS_NORMAL, latinFont, rgb(0, 0, 0));
      drawText(`${item.price.toFixed(2)} ${data.currency}`, MARGIN + colWidths[0] + colWidths[1] + 15, currentY - 25, FS_NORMAL, latinFont, rgb(0, 0, 0));
      drawText(`${item.total.toFixed(2)} ${data.currency}`, PAGE_WIDTH - MARGIN - 15, currentY - 25, FS_NORMAL, latinBoldFont, rgb(0, 0, 0), 'right');
    }

    currentY -= rowHeight;
  }

  // Totals section - Larger and more prominent
  currentY -= 30;

  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * data.taxRate) / 100;
  const total = subtotal + taxAmount;

  const totalsWidth = 220;
  const totalsX = isArabic ? MARGIN : PAGE_WIDTH - MARGIN - totalsWidth;

  // Subtotal
  page.drawRectangle({
    x: totalsX,
    y: currentY - 30,
    width: totalsWidth,
    height: 30,
    color: COLOR_LIGHT_GRAY,
  });

  const subtotalLabel = isArabic ? 'المجموع الفرعي:' : 'Subtotal:';
  if (isArabic) {
    drawText(subtotalLabel, totalsX + totalsWidth - 15, currentY - 20, FS_NORMAL, latinFont, rgb(0, 0, 0), 'right');
    drawText(`${subtotal.toFixed(2)} ${data.currency}`, totalsX + 15, currentY - 20, FS_NORMAL, latinBoldFont, rgb(0, 0, 0), 'left');
  } else {
    drawText(subtotalLabel, totalsX + 15, currentY - 20, FS_NORMAL, latinFont, rgb(0, 0, 0));
    drawText(`${subtotal.toFixed(2)} ${data.currency}`, totalsX + totalsWidth - 15, currentY - 20, FS_NORMAL, latinBoldFont, rgb(0, 0, 0), 'right');
  }

  currentY -= 30;

  // Tax
  page.drawRectangle({
    x: totalsX,
    y: currentY - 30,
    width: totalsWidth,
    height: 30,
    color: COLOR_LIGHT_GRAY,
  });

  const taxLabel = isArabic ? `الضريبة (${data.taxRate}%):` : `Tax (${data.taxRate}%):`;
  if (isArabic) {
    drawText(taxLabel, totalsX + totalsWidth - 15, currentY - 20, FS_NORMAL, latinFont, rgb(0, 0, 0), 'right');
    drawText(`${taxAmount.toFixed(2)} ${data.currency}`, totalsX + 15, currentY - 20, FS_NORMAL, latinBoldFont, rgb(0, 0, 0), 'left');
  } else {
    drawText(taxLabel, totalsX + 15, currentY - 20, FS_NORMAL, latinFont, rgb(0, 0, 0));
    drawText(`${taxAmount.toFixed(2)} ${data.currency}`, totalsX + totalsWidth - 15, currentY - 20, FS_NORMAL, latinBoldFont, rgb(0, 0, 0), 'right');
  }

  currentY -= 30;

  // Total - Larger and dark background
  page.drawRectangle({
    x: totalsX,
    y: currentY - 40,
    width: totalsWidth,
    height: 40,
    color: COLOR_DARK,
  });

  const totalLabel = isArabic ? 'الإجمالي:' : 'Total:';
  if (isArabic) {
    drawText(totalLabel, totalsX + totalsWidth - 15, currentY - 25, FS_HEADING + 2, latinBoldFont, COLOR_WHITE, 'right');
    drawText(`${total.toFixed(2)} ${data.currency}`, totalsX + 15, currentY - 25, FS_HEADING + 2, latinBoldFont, COLOR_WHITE, 'left');
  } else {
    drawText(totalLabel, totalsX + 15, currentY - 25, FS_HEADING + 2, latinBoldFont, COLOR_WHITE);
    drawText(`${total.toFixed(2)} ${data.currency}`, totalsX + totalsWidth - 15, currentY - 25, FS_HEADING + 2, latinBoldFont, COLOR_WHITE, 'right');
  }

  currentY -= 60;

  // Notes section with bullet points - Larger and more prominent
  if (data.notes && data.notes.length > 0) {
    const notesLabel = isArabic ? 'ملاحظات:' : 'Notes:';
    drawText(notesLabel, isArabic ? PAGE_WIDTH - MARGIN : MARGIN, currentY, FS_HEADING, latinBoldFont, COLOR_DARK, isArabic ? 'right' : 'left');
    currentY -= 25;

    const notes = Array.isArray(data.notes) ? data.notes : [data.notes];
    for (const note of notes) {
      if (note && note.trim()) {
        if (isArabic) {
          drawText('•', PAGE_WIDTH - MARGIN, currentY, FS_NORMAL, latinFont, COLOR_DARK, 'right');
          drawText(note.trim(), PAGE_WIDTH - MARGIN - 15, currentY, FS_NORMAL, arabicFont, rgb(0, 0, 0), 'right');
        } else {
          drawText('•', MARGIN, currentY, FS_NORMAL, latinFont, COLOR_DARK);
          drawText(note.trim(), MARGIN + 20, currentY, FS_NORMAL, latinFont, rgb(0, 0, 0));
        }
        currentY -= 22;
      }
    }
  }

  currentY -= 40;

  // Signature section
  const signatureLabel = isArabic ? 'التوقيع:' : 'Signature:';
  drawText(signatureLabel, isArabic ? PAGE_WIDTH - MARGIN : MARGIN, currentY, FS_HEADING, latinFont, COLOR_DARK, isArabic ? 'right' : 'left');

  if (data.signatureType === 'image' && data.signatureData) {
    try {
      if (data.signatureData.startsWith('data:image')) {
        const sigBytes = Buffer.from(data.signatureData.split(',')[1], 'base64');
        const sigImage = await pdf.embedPng(sigBytes);
        const sigDims = sigImage.scale(0.4);
        page.drawImage(sigImage, {
          x: isArabic ? PAGE_WIDTH - MARGIN - sigDims.width : MARGIN,
          y: currentY - 70,
          width: sigDims.width,
          height: sigDims.height,
        });
      }
    } catch (e) {
      console.warn('Failed to embed signature image:', e);
    }
  } else if (data.signatureData) {
    try {
      const sigBytes = Buffer.from(data.signatureData.split(',')[1], 'base64');
      const sigImage = await pdf.embedPng(sigBytes);
      const sigDims = sigImage.scale(0.4);
      page.drawImage(sigImage, {
        x: isArabic ? PAGE_WIDTH - MARGIN - sigDims.width : MARGIN,
        y: currentY - 70,
        width: sigDims.width,
        height: sigDims.height,
      });
    } catch (e) {
      console.warn('Failed to embed manual signature:', e);
    }
  }

  // Signature line
  page.drawLine({
    start: { x: isArabic ? PAGE_WIDTH - MARGIN - 200 : MARGIN, y: currentY - 75 },
    end: { x: isArabic ? PAGE_WIDTH - MARGIN : MARGIN + 200, y: currentY - 75 },
    thickness: 1,
    color: COLOR_DARK,
  });

  // Footer - Professional
  const footerY = 60;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 25 },
    end: { x: PAGE_WIDTH - MARGIN, y: footerY + 25 },
    thickness: 1,
    color: COLOR_BORDER,
  });

  const footerText = isArabic ? 'شكراً لتعاملكم معنا' : 'Thank you for your business';
  drawText(footerText, PAGE_WIDTH / 2, footerY, FS_NORMAL, latinFont, COLOR_GRAY, 'center');

  // Add invoice number in footer for reference
  const refText = isArabic ? `رقم المرجع: ${data.invoiceNo}` : `Reference: ${data.invoiceNo}`;
  drawText(refText, PAGE_WIDTH / 2, footerY - 15, FS_SMALL, latinFont, COLOR_GRAY, 'center');

  return pdf.save();
}

