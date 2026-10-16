import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizFlow Ethiopia - Multi-tenant POS & Business Management",
  description: "Next-generation point of sale, inventory tracking, and financial analytics for Ethiopian retail and wholesale businesses.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BizFlow",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E40AF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { LanguageProvider } from "@/lib/i18n/language-context";
import { SWRegister } from "@/components/pwa/sw-register";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { InstallProvider } from "@/components/pwa/install-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        <LanguageProvider>
          <InstallProvider>
            <SWRegister />
            <OfflineBanner />
            {children}
            <InstallPrompt />
          </InstallProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
