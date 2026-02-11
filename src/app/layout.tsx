import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skill Tracker",
  description: "Plan, track, and validate your learning progress in one workspace.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
