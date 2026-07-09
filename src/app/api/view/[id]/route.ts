import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/view/[id]
 *
 * This URL is embedded in every generated QR code.
 * When a phone scans the QR it lands here and sees the PDF
 * rendered inside an HTML page (iframe + fallback link).
 * This ensures a real "page" experience on any device.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^[A-Z0-9\-]+$/i.test(id)) {
    return new NextResponse("Invalid quote ID", { status: 400 });
  }

  // Point to our internal PDF proxy API route
  const pdfUrl = `/api/pdf/${id}`;
  const downloadUrl = `/api/pdf/${id}?download=true`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DNI Document — ${id}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f8fafc;
      color: #0f172a;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .logo {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #0f172a;
    }

    .quote-id {
      font-size: 12px;
      color: #94a3b8;
      font-family: "Courier New", monospace;
      background: #0f172a;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #334155;
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0ea5e9;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 14px;
      border-radius: 8px;
      text-decoration: none;
      transition: background 0.15s;
    }
    .download-btn:hover { background: #0284c7; }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    iframe {
      flex: 1;
      width: 100%;
      border: none;
      /* Fill remaining viewport height */
      height: calc(100dvh - 57px);
    }

    .fallback {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px 20px;
      text-align: center;
      flex: 1;
    }

    .fallback p { color: #94a3b8; font-size: 14px; }

    .fallback a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #0ea5e9;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 10px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">DNI</div>
    <div class="quote-id">${id}</div>
    <a class="download-btn" href="${downloadUrl}" download="${id}.pdf">
      &#8681; Download PDF
    </a>
  </header>

  <main>
    <iframe
      id="viewer"
      src="${pdfUrl}"
      title="DNI Document ${id}"
    ></iframe>

    <div class="fallback" id="fallback">
      <p>Your browser cannot display this PDF inline.</p>
      <a href="${downloadUrl}" download="${id}.pdf">&#8681; Download PDF</a>
    </div>
  </main>

  <script>
    // If the iframe fails to load, show the fallback download button
    var iframe = document.getElementById("viewer");
    var fallback = document.getElementById("fallback");

    iframe.addEventListener("error", function () {
      iframe.style.display = "none";
      fallback.style.display = "flex";
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

