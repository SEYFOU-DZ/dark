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

    const pdfBytes = await generateInvoicePdfBytes(body);

    let storageUrl = "";
    try {
      storageUrl = await uploadPdfToCloudinary(pdfBytes, body.invoiceNo, "motor-invoices");
    } catch (uploadError) {
      console.warn("Cloudinary upload skipped:", uploadError);
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.invoiceNo}.pdf"`,
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
