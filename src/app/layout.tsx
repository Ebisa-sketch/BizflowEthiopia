import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizFlow Ethiopia - Multi-tenant POS & Business Management",
  description: "Next-generation point of sale, inventory tracking, and financial analytics for Ethiopian retail and wholesale businesses.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1E40AF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { LanguageProvider } from "@/lib/i18n/language-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
