import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePdfBytes } from "@/lib/invoice/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Read token from cookies (works server-side)
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch invoice data from backend using token
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const invoiceRes = await fetch(`${backendUrl}/api/invoices/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!invoiceRes.ok) {
      const errText = await invoiceRes.text();
      console.error("Backend invoice fetch failed:", invoiceRes.status, errText);
      return NextResponse.json(
        { error: invoiceRes.status === 404 ? "Invoice not found" : "Not authorized" },
        { status: invoiceRes.status }
      );
    }

    const invoiceData = await invoiceRes.json();

    // Regenerate PDF from stored invoice data
    const pdfBytes = await generateInvoicePdfBytes({
      invoiceNo: invoiceData.invoiceNo,
      invoiceDate: invoiceData.invoiceDate,
      customerName: invoiceData.customerName,
      vehicleType: invoiceData.vehicleType || "",
      vehicleCategory: invoiceData.vehicleCategory || "",
      trafficCode: invoiceData.trafficCode || "",
      feeDescription: invoiceData.feeDescription || "",
      feeAmount: invoiceData.feeAmount,
      feeNotes: invoiceData.feeNotes || "",
      notes1: invoiceData.notes || "",
      notes2: "",
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoiceData.invoiceNo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Invoice PDF fetch error:", error);
    return NextResponse.json(
      { error: "Could not load invoice PDF" },
      { status: 500 }
    );
  }
}