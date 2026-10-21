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

import { ThemeProvider } from "@/lib/theme-context";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('bizflow_theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-blue-600 selection:text-white bg-[#F8FAFC] dark:bg-[#080E1A] text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <InstallProvider>
              <SWRegister />
              <OfflineBanner />
              {children}
              <InstallPrompt />
            </InstallProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
