import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
// @ts-expect-error arabic-persian-reshaper does not ship TypeScript types.
import reshaper from "arabic-persian-reshaper";
import type { CustomInvoiceFormData } from "./types";

// ─── Page constants (A4) ─────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H  = 841.89;
const ML      = 40;
const MR      = 40;
const MT      = 36;
const CNTW    = PAGE_W - ML - MR;

// ─── Colors ──────────────────────────────────────────────────────────────────
const BLACK = rgb(0,    0,    0   );
const DARK  = rgb(0.12, 0.12, 0.12);
const GRAY  = rgb(0.45, 0.45, 0.45);
const LGRAY = rgb(0.80, 0.80, 0.80);
const RED   = rgb(0.75, 0.05, 0.05);

// ─── Arabic reshaper ─────────────────────────────────────────────────────────
function hasAr(text: string): boolean { return /[\u0600-\u06FF]/.test(text); }
function shapeAr(text: string): string {
  if (!text || !hasAr(text)) return text;
  try {
    const shaped = reshaper.ArabicShaper.convertArabic(text.trim());
    const parts  = shaped.match(/([\u0600-\u06FF\u200C\u200D\s]+)|([^\u0600-\u06FF]+)/g);
    if (!parts) return shaped.split("").reverse().join("");
    return parts
      .map((p: string) => hasAr(p) ? p.split("").reverse().join("") : p)
      .reverse().join("");
  } catch { return text; }
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────
type Fnt  = PDFFont;
type Clr  = ReturnType<typeof rgb>;
type Opts = {
  size?  : number;
  font?  : Fnt;
  color? : Clr;
  align? : "left" | "center" | "right";
  arabic?: boolean;
};

/** Base draw: caller supplies the exact font.
 *  fakeBold=true draws the glyph twice at +0.45px offset to simulate bold weight. */
function baseDraw(page: PDFPage) {
  return (text: string, x: number, y: number, font: Fnt, opts: Opts = {}, fakeBold = false) => {
    const { size = 9, color = DARK, align = "left", arabic = false } = opts;
    const isAr = arabic || hasAr(text);
    const str  = isAr ? shapeAr(text) : text;
    if (!str) return;
    const w = font.widthOfTextAtSize(str, size);
    let dx = x;
    if (align === "right")  dx = x - w;
    if (align === "center") dx = x - w / 2;
    page.drawText(str, { x: dx, y, size, font, color });
    if (fakeBold) {
      page.drawText(str, { x: dx + 0.45, y, size, font, color });
    }
  };
}

function hl(page: PDFPage, x1: number, y: number, x2: number, t = 0.4, c: Clr = LGRAY) {
  page.drawLine({ start:{ x:x1, y }, end:{ x:x2, y }, thickness:t, color:c });
}
function vl(page: PDFPage, x: number, y1: number, y2: number, t = 0.4, c: Clr = LGRAY) {
  page.drawLine({ start:{ x, y:y1 }, end:{ x, y:y2 }, thickness:t, color:c });
}

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generateCustomInvoicePdf(data: CustomInvoiceFormData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  // ── Latin fonts ──
  let regF: Fnt, medF: Fnt, heavyF: Fnt;
  try {
    regF   = await pdf.embedFont(fs.readFileSync(path.join(fontsDir, "Arial.ttf")));
    heavyF = await pdf.embedFont(fs.readFileSync(path.join(fontsDir, "ArialBlack.ttf")));
  } catch {
    regF   = await pdf.embedFont(StandardFonts.Helvetica);
    heavyF = await pdf.embedFont(StandardFonts.HelveticaBold);
  }
  medF = await pdf.embedFont(StandardFonts.HelveticaBold); // medium label weight

  // ── Arabic font ──
  let arRegF: Fnt = regF;
  for (const fn of ["NotoSansArabic-Regular.ttf", "Amiri.ttf", "DroidArabicNaskh.ttf"]) {
    try { arRegF = await pdf.embedFont(fs.readFileSync(path.join(fontsDir, fn))); break; }
    catch { /**/ }
  }

  // ── Convenience draw helpers ──
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const raw  = baseDraw(page);

  /** Regular weight (body text) */
  const dt = (text: string, x: number, y: number, opts: Opts = {}) => {
    const isAr = opts.arabic || hasAr(text);
    raw(text, x, y, isAr ? arRegF : regF, opts, false);
  };

  /** Medium-bold weight (labels, table headers, totals, "ملاحظات").
   *  Arabic: uses fake-bold double-draw since no bold Arabic font is available in public/fonts. */
  const dtM = (text: string, x: number, y: number, opts: Opts = {}) => {
    const isAr = opts.arabic || hasAr(text);
    raw(text, x, y, isAr ? arRegF : medF, opts, isAr);
  };

  /** Heavy weight (company name in header only). */
  const dtH = (text: string, x: number, y: number, opts: Opts = {}) => {
    const isAr = opts.arabic || hasAr(text);
    raw(text, x, y, isAr ? arRegF : heavyF, opts, isAr);
  };

  // ─── Snapshot ───
  const snap = data.companyHeaderSnapshot ?? {
    companyName : data.companyName ?? "",
    addressLines: [],
    logoUrl     : data.logoUrl ?? "",
  };
  const logoSrc = snap.logoUrl || data.logoUrl || "";

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  SECTION 1 – HEADER                                              ║
  // ╚══════════════════════════════════════════════════════════════════╝
  const topY = PAGE_H - MT;

  // LEFT – English company name + address
  let leftY = topY;
  if (snap.companyName) { dtH(snap.companyName, ML, leftY, { size:12, color:BLACK }); leftY -= 15; }
  for (const ln of snap.addressLines ?? []) {
    if (ln.en) { dt(ln.en, ML, leftY, { size:8, color:GRAY }); leftY -= 11; }
  }

  // RIGHT – Arabic company name + address
  let rightY = topY;
  if (snap.companyName) { dtH(snap.companyName, PAGE_W-MR, rightY, { size:12, color:BLACK, align:"right" }); rightY -= 15; }
  for (const ln of snap.addressLines ?? []) {
    if (ln.ar) { dt(ln.ar, PAGE_W-MR, rightY, { size:8, color:GRAY, align:"right", arabic:true }); rightY -= 11; }
  }

  // CENTER – Logo
  const logoAreaW = 150; const logoAreaH = 75;
  let logoBottom  = PAGE_H - MT - logoAreaH;
  if (logoSrc) {
    try {
      const buf = logoSrc.startsWith("data:image")
        ? Buffer.from(logoSrc.split(",")[1], "base64")
        : fs.readFileSync(logoSrc);
      const img = (logoSrc.includes("image/png") || logoSrc.endsWith(".png"))
        ? await pdf.embedPng(buf) : await pdf.embedJpg(buf);
      let sc = logoAreaW / img.width;
      if (img.height * sc > logoAreaH) sc = logoAreaH / img.height;
      const lw = img.width*sc, lh = img.height*sc;
      const lx = PAGE_W/2 - lw/2;
      const ly = (PAGE_H - MT - logoAreaH) + (logoAreaH/2 - lh/2);
      page.drawImage(img, { x:lx, y:ly, width:lw, height:lh });
      logoBottom = ly;
    } catch(e) { console.warn("Logo embed failed:", e); }
  }

  // Separator – below logo bottom and address lines
  const sepY = Math.min(leftY, rightY, logoBottom) - 16;
  hl(page, ML, sepY, PAGE_W-MR, 1.2, LGRAY);

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  SECTION 2 – "Invoice" TITLE                                     ║
  // ╚══════════════════════════════════════════════════════════════════╝
  const titleY = sepY - 28;
  raw("Invoice", PAGE_W/2, titleY, medF, { size:22, color:BLACK, align:"center" });

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  SECTION 3 – META TABLE                                          ║
  // ╚══════════════════════════════════════════════════════════════════╝
  const rowH    = 18;
  const tallH   = rowH * 2;
  const metaTop = titleY - 14;

  const normalRows = [
    { labelEn:"Customer",  labelAr:"العميل",             value: data.clientName    || "" },
    { labelEn:"Address",   labelAr:"العنوان",             value: data.clientAddress || "" },
    { labelEn:"Email",     labelAr:"البريد الإلكتروني",   value: data.clientEmail   || "" },
    { labelEn:"Phone",     labelAr:"الهاتف",              value: data.clientPhone   || "" },
  ];

  const normalH = normalRows.length * rowH;
  const metaH   = normalH + tallH;
  const metaBot = metaTop - metaH;

  // Outer border
  page.drawRectangle({ x:ML, y:metaBot, width:CNTW, height:metaH, opacity:0, borderColor:LGRAY, borderWidth:0.5 });

  // Normal rows
  normalRows.forEach((row, i) => {
    const rowTop = metaTop - i * rowH;
    const ty     = rowTop - rowH + 5;
    if (i > 0) hl(page, ML, rowTop, PAGE_W-MR, 0.4, LGRAY);
    dtM(row.labelEn,  ML+6,        ty, { size:8.5, color:DARK });
    dt (row.value,    PAGE_W/2,    ty, { size:8.5, color:DARK, align:"center" });
    dtM(row.labelAr,  PAGE_W-MR-6, ty, { size:8.5, color:DARK, align:"right", arabic:true });
  });

  // Tall combined last row
  const tallTop = metaTop - normalH;
  hl(page, ML, tallTop, PAGE_W-MR, 0.4, LGRAY);

  // Vertical divider in the tall row
  const halfX = ML + CNTW/2;
  vl(page, halfX, metaBot, tallTop, 0.4, LGRAY);

  // LEFT half: Invoice number (top) + Due date (bottom), NO line
  const leftTopTy  = tallTop - rowH + 5;
  const leftBotTy  = tallTop - rowH - rowH + 5;

  dtM("Invoice number", ML+6,            leftTopTy, { size:8.5, color:DARK });
  dt (data.invoiceNo||"", (ML+halfX)/2,  leftTopTy, { size:8.5, color:DARK, align:"center" });
  dtM("رقم الفاتورة",   halfX-6,         leftTopTy, { size:8.5, color:DARK, align:"right", arabic:true });

  dtM("Due date",       ML+6,            leftBotTy, { size:8.5, color:DARK });
  dt (data.dueDate||"", (ML+halfX)/2,    leftBotTy, { size:8.5, color:DARK, align:"center" });
  dtM("تاريخ الاستحقاق",halfX-6,         leftBotTy, { size:8.5, color:DARK, align:"right", arabic:true });

  // RIGHT half: Date (vertically centered)
  const rightCy = tallTop - tallH/2 + 2;
  dtM("Date",             halfX+6,            rightCy, { size:8.5, color:DARK });
  dt (data.invoiceDate||"",(halfX+PAGE_W-MR)/2,rightCy,{ size:8.5, color:DARK, align:"center" });
  dtM("التاريخ",          PAGE_W-MR-6,        rightCy, { size:8.5, color:DARK, align:"right", arabic:true });

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  SECTION 4 – ITEMS TABLE                                         ║
  // ╚══════════════════════════════════════════════════════════════════╝
  const thH      = 22;
  const itemRowH = 28;
  const itemsTop = metaBot - 16;

  const CW = { idx:28, desc:158, qty:40, price:70, taxable:76, vat:65, total:78 };
  const xR       = PAGE_W - MR;
  const xIdx     = xR - CW.idx;
  const xDesc    = xIdx - CW.desc;
  const xQty     = xDesc - CW.qty;
  const xPrice   = xQty  - CW.price;
  const xTaxable = xPrice - CW.taxable;
  const xVat     = xTaxable - CW.vat;

  const itemsBoxH = thH + data.items.length * itemRowH;

  // Outer border only
  page.drawRectangle({ x:ML, y:itemsTop-itemsBoxH, width:CNTW, height:itemsBoxH, opacity:0, borderColor:LGRAY, borderWidth:0.5 });
  hl(page, ML, itemsTop,     PAGE_W-MR, 0.5, LGRAY);
  hl(page, ML, itemsTop-thH, PAGE_W-MR, 0.5, LGRAY);

  const thY = itemsTop - thH + 7;
  const drawTH = (label: string, cx: number) =>
    dtM(label, cx, thY, { size:8, color:DARK, align:"center", arabic: hasAr(label) });

  drawTH("#",                      xIdx     + CW.idx/2);
  drawTH("الوصف",                  xDesc    + CW.desc/2);
  drawTH("الكمية",                 xQty     + CW.qty/2);
  drawTH("السعر",                  xPrice   + CW.price/2);
  drawTH("المبلغ الخاضع للضريبة",  xTaxable + CW.taxable/2);
  drawTH("القيمة المضافة",         xVat     + CW.vat/2);
  drawTH("المجموع",                ML       + CW.total/2);

  let curY = itemsTop - thH;
  data.items.forEach((item, i) => {
    if (i > 0) hl(page, ML, curY, PAGE_W-MR, 0.3, LGRAY);

    const ty  = curY - 13;
    const ty2 = curY - 21;

    const lineTotal = item.unitPrice * item.quantity;
    const itemTax   = (lineTotal * (data.taxRate || 0)) / 100;
    const lineGross = lineTotal + itemTax;

    dt(String(i + 1), xIdx + CW.idx/2, ty, { size:8.5, color:DARK, align:"center" });

    if (item.descriptionAr) dtM(item.descriptionAr, xIdx-5, ty,  { size:8.5, color:DARK, align:"right", arabic:true });
    if (item.descriptionEn) dt (item.descriptionEn, xIdx-5, ty2, { size:7.5, color:GRAY, align:"right" });

    dt(String(item.quantity),      xQty     + CW.qty/2,     ty, { size:8.5, color:DARK, align:"center" });
    dt(item.unitPrice.toFixed(2),  xPrice   + CW.price/2,   ty, { size:8.5, color:DARK, align:"center" });
    dt(lineTotal.toFixed(2),       xTaxable + CW.taxable/2, ty, { size:8.5, color:DARK, align:"center" });
    dt(itemTax.toFixed(2),         xVat     + CW.vat/2,     ty, { size:8.5, color:DARK, align:"center" });
    dt(lineGross.toFixed(2),       ML       + CW.total/2,   ty, { size:8.5, color:DARK, align:"center" });

    curY -= itemRowH;
  });

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  SECTION 5 – TOTALS (left side)                                  ║
  // ╚══════════════════════════════════════════════════════════════════╝
  const subtotal = data.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const disc     = data.discount || 0;
  const taxBase  = subtotal - disc;
  const taxAmt   = (taxBase * (data.taxRate || 0)) / 100;
  const grand    = taxBase + taxAmt;
  const curr     = data.currency || "SAR";

  const totRows = [
    { label:"المجموع الفرعي",               val: subtotal },
    ...(disc > 0 ? [{ label:"الخصم",         val: disc }] : []),
    { label:"إجمالي ضريبة القيمة المضافة",   val: taxAmt  },
    { label:"المجموع شامل القيمة المضافة",   val: grand   },
  ];

  const totalsStartY = curY - 18;
  const totSpacing   = 19;
  const totRightX    = ML + CNTW * 0.42;

  let totY = totalsStartY;
  for (const row of totRows) {
    const valStr = row.val.toFixed(2);
    dtM(valStr, ML, totY, { size:9, color:BLACK });
    dtM(curr,   ML + medF.widthOfTextAtSize(valStr, 9) + 3, totY, { size:9, color:BLACK });
    dtM(row.label, totRightX, totY, { size:9, color:BLACK, align:"right", arabic:true });
    totY -= totSpacing;
  }

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  SECTION 6 – NOTES (right side, BELOW where totals end)         ║
  // ╚══════════════════════════════════════════════════════════════════╝
  const notesList = (
    Array.isArray(data.notes) ? data.notes : (data.notes ? [data.notes as string] : [])
  ).filter((n: string) => n && n.trim());

  if (notesList.length > 0) {
    let nY = totY - 2;
    dtM("ملاحظات", PAGE_W-MR, nY, { size:9, color:BLACK, align:"right", arabic:true });
    nY -= 14;
    for (const note of notesList) {
      dt(note.trim(), PAGE_W-MR, nY, { size:8.5, color:GRAY, align:"right", arabic: hasAr(note) });
      nY -= 13;
    }
  }

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  SECTION 7 – GUARANTEE STAMP (bottom-left)                      ║
  // ╚══════════════════════════════════════════════════════════════════╝
  const stampCx = ML + 60;
  const stampCy = totY - 68;
  const outerR  = 46;
  const innerR  = 23; // Shrunken inner circle to expand ring space

  // 1. Outer circle (solid thick red border)
  page.drawEllipse({ x:stampCx, y:stampCy, xScale:outerR, yScale:outerR, borderColor:RED, borderWidth:3.5, opacity:0 });

  // 2. Inner circle (very thick red border)
  page.drawEllipse({ x:stampCx, y:stampCy, xScale:innerR, yScale:innerR, borderColor:RED, borderWidth:5.5, opacity:0 });

  // 3. Masking rectangle to create the horizontal gap in the inner circle
  const gAngle = -15; // rotation angle
  const gRad   = gAngle * Math.PI / 180;
  const cos    = Math.cos(gRad);
  const sin    = Math.sin(gRad);
  const maskW  = 56;
  const maskH  = 17;
  const rx     = stampCx - (maskW / 2) * cos + (maskH / 2) * sin;
  const ry     = stampCy - (maskW / 2) * sin - (maskH / 2) * cos;

  page.drawRectangle({
    x: rx,
    y: ry,
    width: maskW,
    height: maskH,
    color: rgb(1, 1, 1),
    rotate: degrees(gAngle),
  });

  // 4. "GUARANTEE" text – centered, enlarged to size 10
  const gText = "GUARANTEE";
  const gSize = 10;
  const gW    = medF.widthOfTextAtSize(gText, gSize);
  page.drawText(gText, {
    x: stampCx - (gW / 2) * cos + 3.3 * sin,
    y: stampCy - (gW / 2) * sin - 3.3 * cos,
    size: gSize, font: medF, color: RED, rotate: degrees(gAngle),
  });

  // 5. "100 %" – pulled inward to midpoint of widened gap (offset 33.5)
  const ringOffset = 33.5;
  const tText = "100 %";
  const tSize = 8.5;
  const tW    = medF.widthOfTextAtSize(tText, tSize);
  page.drawText(tText, {
    x: stampCx - (tW / 2) * cos + ringOffset * sin,
    y: stampCy - (tW / 2) * sin + ringOffset * cos,
    size: tSize, font: medF, color: RED, rotate: degrees(gAngle),
  });

  // 6. "% 001" – bottom ring area (upside-down)
  const bAngle = 180 + gAngle;
  const bRad   = bAngle * Math.PI / 180;
  const bText  = "% 001";
  const bSize  = 8.5;
  const bW     = medF.widthOfTextAtSize(bText, bSize);
  page.drawText(bText, {
    x: stampCx - (bW / 2) * Math.cos(bRad) + ringOffset * Math.sin(bRad),
    y: stampCy - (bW / 2) * Math.sin(bRad) + ringOffset * Math.cos(bRad),
    size: bSize, font: medF, color: RED, rotate: degrees(bAngle),
  });

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  SECTION 8 – FOOTER                                              ║
  // ╚══════════════════════════════════════════════════════════════════╝
  const footerY = 30;
  hl(page, ML, footerY+18, PAGE_W-MR, 0.5, LGRAY);

  if (snap.companyName) {
    dt(snap.companyName, ML,       footerY, { size:8, color:GRAY });
    dt(snap.companyName, PAGE_W/2, footerY, { size:8, color:GRAY, align:"center", arabic: hasAr(snap.companyName) });
  }
  dt("Page 1 of 1-",     PAGE_W-MR, footerY+9, { size:7.5, color:GRAY, align:"right" });
  dt(data.invoiceNo||"", PAGE_W-MR, footerY,   { size:7.5, color:GRAY, align:"right" });

  return pdf.save();
}
