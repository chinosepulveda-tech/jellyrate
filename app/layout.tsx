import type { Metadata, Viewport } from "next";
import { Geist, Archivo_Black, Archivo } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
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
    <html lang="es" className={`${geistSans.variable} ${archivoBlack.variable} ${archivo.variable} h-full`}>
      <body className="min-h-full bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
