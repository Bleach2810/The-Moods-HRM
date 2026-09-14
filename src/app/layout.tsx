import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

// Static font classes to avoid online fetch failures during build on offline servers
const beVietnamPro = {
  variable: "--font-be-vietnam",
};

const spaceMono = {
  variable: "--font-space-mono",
};

export const viewport = {
  themeColor: "#7c4831",
};

export const metadata: Metadata = {
  title: "The Moods - Hệ Thống Tích Điểm & Vận Hành F&B SaaS",
  description: "Giải pháp đa chi nhánh (Multi-tenant) F&B hiện đại phong cách Neo-brutalism. Tích hợp Customer Mobile PWA, Staff Portal di động và Admin Dashboard chuyên sâu.",
  keywords: "themoods, f&b saas, loyalty program, coffee shop app, neo-brutalism web, tích điểm cà phê, phần mềm nhà hàng",
  icons: {
    icon: "/logo.png?v=5",
    shortcut: "/favicon.png?v=5",
    apple: [
      { url: "/ios/180.png", sizes: "180x180", type: "image/png" },
      { url: "/ios/152.png", sizes: "152x152", type: "image/png" },
      { url: "/ios/120.png", sizes: "120x120", type: "image/png" },
      { url: "/ios/76.png", sizes: "76x76", type: "image/png" },
    ],
  },

  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="The Moods" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('SW registered:', reg.scope);
                    },
                    function(err) {
                      console.log('SW registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>

      <body className={`${beVietnamPro.variable} ${spaceMono.variable} min-h-full bg-beige text-coffee antialiased selection:bg-coffee selection:text-beige`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}


