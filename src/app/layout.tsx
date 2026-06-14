import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OriginCacheReset } from "@/components/OriginCacheReset";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FleetView · Tracksolid Pro",
  description: "Live fleet tracking, playback, geofencing and device management powered by Tracksolid Pro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>
          <OriginCacheReset />
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
