import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const token = request.cookies.get("token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/company-headers
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${backendUrl}/api/company-headers`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(request),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching company headers:", error);
    return NextResponse.json([]);
  }
}

// POST /api/company-headers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/company-headers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(request),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to create company header" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating company header:", error);
    return NextResponse.json(
      { error: "Could not create company header" },
      { status: 500 }
    );
  }
}
