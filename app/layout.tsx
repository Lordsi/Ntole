import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";

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
  themeColor: "#0B0C0E",
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-white antialiased">
        {children}
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
