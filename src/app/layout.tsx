import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Aruneeka Planner Pro | Editorial Plan System",
  description: "Next-gen editorial planning for content creators",
  icons: {
    icon: '/assets/aruneeka.png',
    apple: '/assets/aruneeka.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aruneeka Pro",
  },
};

import AruneekaUpdateDetector from "@/components/AruneekaUpdateDetector";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <AruneekaUpdateDetector />
      </body>
    </html>
  );
}
