import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Skill Tracker",
  description: "Plan, track, and validate your learning progress in one workspace.",
  metadataBase: new URL(getSiteUrl()),
  keywords: [
    "skill tracker",
    "learning tracker",
    "study planner",
    "progress tracking",
    "learning roadmap",
    "personal learning",
  ],
  openGraph: {
    title: "Skill Tracker",
    description: "Plan, track, and validate your learning progress in one workspace.",
    type: "website",
    images: ["/og.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Tracker",
    description: "Plan, track, and validate your learning progress in one workspace.",
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
