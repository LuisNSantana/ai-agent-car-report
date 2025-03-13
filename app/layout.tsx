import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI AGENT",
  description: "AI AGENT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexClientProvider>
    <html lang="en" className="dark">
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          "antialiased min-h-screen bg-background"
        )}
      >
        {children}
      </body>
    </html>
    </ConvexClientProvider>
  );
}
