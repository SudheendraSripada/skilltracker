import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Skill Tracker",
  description: "Plan, track, and validate your learning progress in one workspace.",
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
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
