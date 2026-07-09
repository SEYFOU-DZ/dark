import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/contexts/LocaleContext";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Request and invoice dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
