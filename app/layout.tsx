import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";

/**
 * Geist for everything except data labels. Loaded with the full 400/600/700/800
 * weight range so headlines (bold/extrabold) and body (regular) all use the
 * same family — matches the Stitch DESIGN.md.
 */
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
  weight: ["400", "500", "600", "700", "800"],
});

/**
 * JetBrains Mono is reserved for "data labels" per the design system: ETAs,
 * plate numbers, monetary amounts, and small-caps labels.
 */
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Ntole — Ride hailing in Malawi",
  description:
    "Hail a ride or send a package across Malawi. Fair fares billed by distance and time.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ntole",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#121414",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${geist.variable} ${jetbrains.variable}`}
    >
      <head>
        {/*
          Material Symbols Outlined — used as the project's icon system.
          Loaded via Google Fonts because the variation font + symbol-name
          glyph lookup work out-of-the-box and match the Stitch HTML 1:1.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background text-on-background antialiased font-body-md">
        {children}
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
