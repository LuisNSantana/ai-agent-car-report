import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { NavigationProvider } from "@/lib/context/navigation";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zynk - Your AI Assistant",
  description: "Zynk is your AI assistant for research, writing, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          "antialiased min-h-screen bg-background"
        )}
      >
        <ClerkProvider>
          <ConvexClientProvider>
            <ThemeProvider 
              attribute="class" 
              defaultTheme="dark" 
              enableSystem 
              disableTransitionOnChange
            >
              <NavigationProvider>
                {children}
              </NavigationProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
