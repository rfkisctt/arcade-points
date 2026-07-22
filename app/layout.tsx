import type { Metadata } from "next";
import "./globals.css";
import { Navbar, LangProvider } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Arcade Points | Google Cloud Arcade Facilitator 2026 Points Calculator",
  description: "Automatically calculate your Google Cloud Arcade Facilitator 2026 points. Track badges, view your score, and check the public leaderboard.",
  verification: {
    google: "_PhvYjgeuVrpi5hIi78lb8D301iWUjP2BKNNfuQAHMg",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Arcade Points | Google Cloud Arcade Facilitator 2026",
    description: "Automatic points calculator for Google Cloud Arcade Facilitator 2026. Track badges, calculate points, and rank on the public leaderboard.",
    url: "https://arcade-pts.vercel.app",
    siteName: "Arcade Points",
    images: [
      {
        url: "https://arcade-pts.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Arcade Points - Calculate your arcade points",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcade Points | Google Cloud Arcade Facilitator 2026",
    description: "Automatic points calculator for Google Cloud Arcade Facilitator 2026. Track badges, calculate points, and check your leaderboard ranking.",
    images: ["https://arcade-pts.vercel.app/og-image.png"],
  },
  metadataBase: new URL("https://arcade-pts.vercel.app"),
  alternates: {
    canonical: "/",
    languages: {
      "id": "https://arcade-pts.vercel.app",
      "en": "https://arcade-pts.vercel.app",
      "x-default": "https://arcade-pts.vercel.app",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#141414] text-[#fafafa] min-h-screen antialiased overflow-x-hidden" suppressHydrationWarning>

        <div className="guide-lines" aria-hidden="true">
          <div className="guide-lines-inner" />
        </div>

        <LangProvider>
          <SmoothScroll />
          <Navbar />
          <main className="relative z-[1]">{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
