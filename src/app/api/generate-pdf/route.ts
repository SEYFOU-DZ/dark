import { NextRequest, NextResponse } from "next/server";
import { generateQuotePdf } from "@/lib/pdf-generator";
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

    const pdfBytes = await generateQuotePdf(body);
    const filename = `${body.quotationNo}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
