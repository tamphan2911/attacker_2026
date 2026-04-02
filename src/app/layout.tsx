import type { Metadata } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const bodyFont = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const displayFont = Be_Vietnam_Pro({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://attacker-2026.local"),
  title: {
    default: "Attacker 2026",
    template: "%s | Attacker 2026",
  },
  description:
    "Frontend-first bilingual concept for the Attacker 2026 student fintech competition.",
  openGraph: {
    title: "Attacker 2026",
    description:
      "Responsive, bilingual, modern fintech competition website concept for students and organizers.",
    siteName: "Attacker 2026",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders>
          <SiteShell>{children}</SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
