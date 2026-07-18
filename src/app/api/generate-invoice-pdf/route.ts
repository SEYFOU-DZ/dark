import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePdfBytes } from "@/lib/invoice/pdf-generator";
import { uploadPdfToCloudinary } from "@/lib/cloudinary";
import type { InvoiceFormData } from "@/lib/invoice/types";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InvoiceFormData;

    if (!body.invoiceNo || !body.customerName) {
      return NextResponse.json(
        { error: "Missing required invoice data." },
        { status: 400 }
      );
    }

    const filename = `${body.invoiceNo}`;

    // Phase 1: Generate PDF bytes
    const rawPdfBytes = await generateInvoicePdfBytes(body);

    // Phase 2: Upload raw PDF to Cloudinary — get the storage URL
    const storageUrl = await uploadPdfToCloudinary(rawPdfBytes, filename, "motor-invoices");

    // Phase 3: Build the QR URL — points to our internal viewer route
    // Use NEXT_PUBLIC_APP_URL in production (e.g. https://your-domain.com).
    // Falls back to localhost for local development.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const qrUrl = `${appUrl}/api/view/${encodeURIComponent(filename)}`;

    // Phase 4: Embed QR code in the PDF
    const pdf = await PDFDocument.load(rawPdfBytes);
    const pages = pdf.getPages();

    const qrPng = await QRCode.toBuffer(qrUrl, {
      type: "png",
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
    const qrImage = await pdf.embedPng(qrPng);

    // Add QR code to the first page (top right corner)
    const page = pages[0];
    const { width, height } = page.getSize();
    const qrSize = 54;
    page.drawImage(qrImage, {
      x: width - qrSize - 20,
      y: height - qrSize - 20,
      width: qrSize,
      height: qrSize,
    });

    const finalPdfBytes = await pdf.save();

    return new NextResponse(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "X-Pdf-Url": storageUrl,
      },
    });
  } catch (error) {
    console.error("Invoice PDF generation error:", error);
    return NextResponse.json(
      { error: "Could not generate invoice PDF. Please try again." },
      { status: 500 }
    );
  }
}
