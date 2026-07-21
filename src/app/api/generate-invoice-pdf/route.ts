import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePdfBytes } from "@/lib/invoice/pdf-generator";
import { uploadPdfToCloudinary } from "@/lib/cloudinary";
import type { InvoiceFormData } from "@/lib/invoice/types";

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

    // Generate PDF bytes
    const pdfBytes = await generateInvoicePdfBytes(body);

    // Upload PDF to Cloudinary — get the storage URL
    const storageUrl = await uploadPdfToCloudinary(pdfBytes, filename, "motor-invoices");

    return new NextResponse(Buffer.from(pdfBytes), {
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
