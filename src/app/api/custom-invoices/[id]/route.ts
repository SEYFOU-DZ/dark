import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Read token from cookies to forward to backend
    const token = request.cookies.get("token")?.value;
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/custom-invoices/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to delete invoice" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom invoice:", error);
    return NextResponse.json(
      { error: "Could not delete invoice" },
      { status: 500 }
    );
  }
}
