import type { Metadata, Viewport } from "next";
import { Geist, Archivo } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Variable font — incluye eje wdth (75–125) y wght (100–900)
// font-stretch: expanded  →  wdth 125 (letras más anchas, igual a Claude Design)
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "JellyRate",
  description: "Rate anything. Trust your people.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JellyRate",
  },
  icons: {
    apple: [
      { url: "/apple-touch-icon.png", sizes: "1024x1024" },
      { url: "/apple-touch-icon-180.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${archivo.variable} h-full`}>
      <body className="min-h-full bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
