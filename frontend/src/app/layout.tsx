import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
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
  title: "Kenya Re · CAT Risk Intelligence — Nairobi Flood Model",
  description: "AI-Powered Urban Pluvial Flood Catastrophe Model & Underwriting Platform for Kenya Re",
  icons: {
    icon: [
      { url: "/image.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/image.png",
    apple: "/image.png",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster position="top-right" richColors />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
