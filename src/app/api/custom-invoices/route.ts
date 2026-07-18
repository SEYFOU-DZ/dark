import { NextRequest, NextResponse } from "next/server";
import { generateCustomInvoicePdf } from "@/lib/custom-invoice/pdf-generator";
import { uploadPdfToCloudinary } from "@/lib/cloudinary";
import type { CustomInvoiceFormData } from "@/lib/custom-invoice/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CustomInvoiceFormData;

    if (!body.invoiceNo || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Missing required invoice data." },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = (subtotal * body.taxRate) / 100;
    const total = subtotal + taxAmount;

    // Generate PDF
    const pdfBytes = await generateCustomInvoicePdf(body);

    // Upload to Cloudinary
    let storageUrl = "";
    try {
      storageUrl = await uploadPdfToCloudinary(pdfBytes, body.invoiceNo, "custom-invoices");
    } catch (uploadError) {
      console.warn("Cloudinary upload skipped:", uploadError);
    }

    // Save to backend
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const authHeader = request.headers.get('authorization') || '';
      const response = await fetch(`${backendUrl}/api/custom-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          ...body,
          items: body.items.map(item => ({
            ...item,
            total: item.price * item.quantity
          })),
          subtotal,
          taxAmount,
          total,
          pdfUrl: storageUrl,
        }),
      });

      if (!response.ok) {
        console.warn('Backend save failed, but PDF will still be returned');
      } else {
        console.log('Invoice saved successfully to backend');
      }
    } catch (backendError) {
      console.warn('Backend save failed, but PDF will still be returned:', backendError);
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
    console.error("Custom invoice PDF generation error:", error);
    return NextResponse.json(
      { error: "Could not generate invoice PDF. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/custom-invoices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Backend fetch failed, returning empty list');
      return NextResponse.json([]);
    }

    const data = await response.json();
    console.log('Fetched invoices:', data.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching custom invoices:", error);
    return NextResponse.json([]);
  }
}
