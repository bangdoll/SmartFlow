import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-context";

import { BookmarksProvider } from "@/hooks/use-bookmarks";

export const metadata: Metadata = {
  // ... existing metadata ...
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
            <BookmarksProvider>
              <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                  {children}
                </main>
                <Footer />
              </div>
            </BookmarksProvider>
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
