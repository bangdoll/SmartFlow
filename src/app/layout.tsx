import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-context";

import { BookmarksProvider } from "@/hooks/use-bookmarks";
import { UserProvider } from '@/components/user-provider';

export const metadata: Metadata = {
  title: "智流 Smart Flow - 掌握每日科技趨勢",
  description: "每日 AI 科技新聞摘要，幫助您快速掌握最新趨勢。我們利用 AI 技術為您篩選並整理最重要的科技新聞。",
  keywords: ["AI", "人工智慧", "科技新聞", "趨勢", "Smart Flow", "智流"],
  authors: [{ name: "Smart Flow Team" }],
  openGraph: {
    title: "智流 Smart Flow - 掌握每日科技趨勢",
    description: "每日 AI 科技新聞摘要，利用 AI 技術為您篩選並整理最重要的科技新聞。",
    url: "https://smart-flow.rd.coach",
    siteName: "智流 Smart Flow",
    images: [
      {
        url: "/og-image.png", // Assuming this exists or will fallback
        width: 1200,
        height: 630,
      },
    ],
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "智流 Smart Flow - 掌握每日科技趨勢",
    description: "每日 AI 科技新聞摘要，幫助您快速掌握最新趨勢。",
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  }
};

import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <UserProvider>
              <BookmarksProvider>
                <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
                  <Header />
                  <main className="flex-grow container mx-auto px-4 py-8">
                    {children}
                  </main>
                  <Footer />
                </div>
              </BookmarksProvider>
            </UserProvider>
          </LanguageProvider>
        </ThemeProvider>

        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '智流 Smart Flow',
              alternateName: 'Smart Flow',
              url: process.env.PRODUCTION_URL || 'https://smart-flow.rd.coach',
            }),
          }}
        />
      </body>
    </html>
  );
}
