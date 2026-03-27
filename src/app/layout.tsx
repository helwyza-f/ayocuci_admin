import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AyoCuci Admin",
  description: "Super Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
