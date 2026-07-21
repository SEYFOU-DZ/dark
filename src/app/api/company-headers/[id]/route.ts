import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const token = request.cookies.get("token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// DELETE /api/company-headers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${backendUrl}/api/company-headers/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(request),
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to delete company header" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company header:", error);
    return NextResponse.json(
      { error: "Could not delete company header" },
      { status: 500 }
    );
  }
}

// PUT /api/company-headers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/company-headers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(request),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to update" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating company header:", error);
    return NextResponse.json(
      { error: "Could not update company header" },
      { status: 500 }
    );
  }
}
