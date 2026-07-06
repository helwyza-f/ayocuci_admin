import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AyoCuci Admin Hub",
  description: "Operational Command Center for AyoCuci",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <main>{children}</main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
