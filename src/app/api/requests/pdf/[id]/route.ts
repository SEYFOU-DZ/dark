import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { generateQuotePdfBytes } from "@/lib/pdf-generator";
import type { QuoteFormData } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const requestRes = await fetch(`${backendUrl}/api/requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!requestRes.ok) {
      const errText = await requestRes.text();
      console.error("Backend request fetch failed:", requestRes.status, errText);
      return NextResponse.json(
        { error: requestRes.status === 404 ? "Request not found" : "Not authorized" },
        { status: requestRes.status }
      );
    }

    const requestData = await requestRes.json();

    const pdfBytes = await generateQuotePdfBytes({
      quotationNo: requestData._id.slice(-6),
      insuredName: requestData.customerName,
      insuredPhone: requestData.customerPhone,
      vehicleMake: requestData.vehicleMake,
      vehicleModel: requestData.vehicleModel,
      vehicleYear: requestData.vehicleYear,
      vehiclePlate: requestData.vehiclePlate,
      description: requestData.description,
      basicPremium: 0,
      additionalCovers: [] as any,
      covers: [] as any,
      benefits: [] as any,
      quoteIssueDate: requestData.createdAt.split('T')[0],
      printedDate: requestData.createdAt.split('T')[0],
    } as any);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="request-${requestData._id.slice(-6)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Request PDF fetch error:", error);
    return NextResponse.json({ error: "Could not load request PDF" }, { status: 500 });
  }
}