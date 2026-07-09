import { NextRequest, NextResponse } from "next/server";
import { generateQuotePdfBytes, embedQrCodeInPdf } from "@/lib/pdf-generator";
import { uploadPdfToCloudinary } from "@/lib/cloudinary";
import type { QuoteFormData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuoteFormData;

    if (!body.quotationNo || !body.insuredName) {
      return NextResponse.json(
        { error: "Missing required quotation data." },
        { status: 400 }
      );
    }

    const filename = `${body.quotationNo}`;

    // Phase 1: Generate PDF bytes (with old QR blanked out)
    const rawPdfBytes = await generateQuotePdfBytes(body);

    // Phase 2: Upload raw PDF to Cloudinary — get the storage URL
    const storageUrl = await uploadPdfToCloudinary(rawPdfBytes, filename);

    // Phase 3: Build the QR URL — points to our internal viewer route
    // so scanning with a phone opens a real web page (which redirects to Cloudinary).
    // Use NEXT_PUBLIC_APP_URL in production (e.g. https://your-domain.com).
    // Falls back to localhost for local development.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const qrUrl = `${appUrl}/api/view/${encodeURIComponent(filename)}`;

    // Phase 4: Embed QR code that links to the viewer route
    const finalPdfBytes = await embedQrCodeInPdf(rawPdfBytes, qrUrl);

    return new NextResponse(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "X-Pdf-Url": storageUrl,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Could not generate PDF. Please try again." },
      { status: 500 }
    );
  }
}
