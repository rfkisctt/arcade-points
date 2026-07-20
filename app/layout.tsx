import type { Metadata } from "next";
import "./globals.css";
import { Navbar, LangProvider } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Arcade Points | Google Cloud Arcade Facilitator 2026 Points Calculator",
  description: "Hitung poin Google Cloud Arcade Facilitator 2026 secara otomatis. Kalkulator poin, leaderboard publik, dan daftar courses Arcade 2026.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Arcade Points | Google Cloud Arcade Facilitator 2026",
    description: "Kalkulator poin otomatis untuk Google Cloud Arcade Facilitator 2026. Lacak badge, hitung poin, dan lihat ranking di leaderboard publik.",
    url: "https://arcade-points.vercel.app",
    siteName: "Arcade Points",
    images: [
      {
        url: "https://arcade-points.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Arcade Points - Calculate your arcade points",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcade Points | Google Cloud Arcade Facilitator 2026",
    description: "Kalkulator poin otomatis untuk Google Cloud Arcade Facilitator 2026. Lacak badge, hitung poin, dan lihat ranking.",
    images: ["https://arcade-points.vercel.app/og-image.png"],
  },
  metadataBase: new URL("https://arcade-points.vercel.app"),
  alternates: {
    canonical: "/",
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
          <Navbar />
          <main className="relative z-[1]">{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
