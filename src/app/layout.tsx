import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudentHire - Where Student Talent Meets Opportunity",
  description: "Hire talented student designers, developers, editors, and creators — or find your next gig as a student freelancer.",
  keywords: ["freelance", "student", "hire", "jobs", "talent", "marketplace"],
  authors: [{ name: "StudentHire" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "StudentHire - Where Student Talent Meets Opportunity",
    description: "The freelance marketplace built for students and the clients who need their talent.",
    siteName: "StudentHire",
    type: "website",
  },
};

import { Web3Provider } from "@/components/providers/web3-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
