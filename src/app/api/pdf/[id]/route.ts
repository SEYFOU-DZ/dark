import { NextRequest, NextResponse } from "next/server";
import { getCloudinaryTxtUrl } from "@/lib/cloudinary";

/**
 * GET /api/pdf/[id]
 *
 * Proxy route that fetches the raw PDF bytes (stored as .txt) from Cloudinary
 * and streams it back to the browser as a true PDF with correct headers.
 * This completely bypasses Cloudinary's 401 PDF access restrictions and
 * browser CORS issues.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^[A-Z0-9\-]+$/i.test(id)) {
    return new NextResponse("Invalid quote ID", { status: 400 });
  }

  const download = request.nextUrl.searchParams.get("download") === "true";

  // Get the Cloudinary URL of the raw text asset
  const cloudinaryUrl = getCloudinaryTxtUrl(id);

  try {
    const response = await fetch(cloudinaryUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Failed to fetch PDF from Cloudinary: ${response.statusText}`);
      return new NextResponse("PDF not found on server", { status: 404 });
    }

    const pdfBuffer = await response.arrayBuffer();

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    
    if (download) {
      headers.set("Content-Disposition", `attachment; filename="${id}.pdf"`);
    } else {
      headers.set("Content-Disposition", "inline");
    }

    // Cache control
    headers.set("Cache-Control", "public, max-age=86400");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
