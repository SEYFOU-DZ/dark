import { NextRequest, NextResponse } from "next/server";
import { generateCustomInvoicePdf } from "@/lib/custom-invoice/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Read token from cookies
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch invoice data from backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const invoiceRes = await fetch(`${backendUrl}/api/custom-invoices/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!invoiceRes.ok) {
      const errText = await invoiceRes.text();
      console.error("Backend custom invoice fetch failed:", invoiceRes.status, errText);
      return NextResponse.json(
        { error: invoiceRes.status === 404 ? "Invoice not found" : "Not authorized" },
        { status: invoiceRes.status }
      );
    }

    const invoiceData = await invoiceRes.json();

    // Check if user wants to download
    const isDownload = request.nextUrl.searchParams.get("download") === "true";
    const contentDisposition = isDownload 
      ? `attachment; filename="custom-invoice-${invoiceData.invoiceNo}.pdf"`
      : `inline; filename="custom-invoice-${invoiceData.invoiceNo}.pdf"`;

    // Try fetching from cloudinary first if pdfUrl exists
    if (invoiceData.pdfUrl) {
      try {
        const pdfRes = await fetch(invoiceData.pdfUrl);
        if (pdfRes.ok) {
          const arrayBuffer = await pdfRes.arrayBuffer();
          return new NextResponse(Buffer.from(arrayBuffer), {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": contentDisposition,
              "Cache-Control": "no-store",
            },
          });
        }
      } catch (err) {
        console.warn("Failed to fetch PDF from Cloudinary, falling back to regeneration", err);
      }
    }

    // Fallback: Regenerate PDF from stored data
    const pdfBytes = await generateCustomInvoicePdf(invoiceData);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Custom invoice PDF fetch error:", error);
    return NextResponse.json(
      { error: "Could not load invoice PDF" },
      { status: 500 }
    );
  }
}
