import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motor Quote Dashboard",
  description: "Create and download motor insurance quotation PDFs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
