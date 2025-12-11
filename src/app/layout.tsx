import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-context";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PRODUCTION_URL || "https://ai-smart-flow.vercel.app"),
  title: {
    default: "智流 Smart Flow - 全球科技快報",
    template: "%s | 智流 Smart Flow"
  },
  description: "每日自動擷取全球 AI 新聞，提供中英文摘要與電子報服務。",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: "智流 Smart Flow",
    title: "智流 Smart Flow - 全球科技快報",
    description: "每日自動擷取全球 AI 新聞，提供中英文摘要與電子報服務。",
  },
  twitter: {
    card: "summary_large_image",
    title: "智流 Smart Flow",
    description: "全球 AI 趨勢，一站掌握。",
  }
};

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
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer />
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
