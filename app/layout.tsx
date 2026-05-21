import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";
import { ThemeProvider } from "@/components/shared/theme-provider";

/**
 * Single sans family across the whole product. Plus Jakarta Sans has a
 * confident humanist grotesque feel that reads premium without leaning
 * into either generic system-UI or coder-y monospace territory. We use it
 * for display, body, and labels — `--font-mono` aliases the same family
 * so any pre-existing `font-label-*` utilities keep working.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ntole — Ride hailing in Malawi",
  description:
    "Hail a ride or send a package across Malawi. Fair fares billed by distance and time.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ntole",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121414" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('ntole-theme');
    var d = t === 'light' || t === 'dark' ? t
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.classList.add(d);
    document.documentElement.style.colorScheme = d;
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={jakarta.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background text-on-background antialiased font-body-md">
        <ThemeProvider>{children}</ThemeProvider>
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
