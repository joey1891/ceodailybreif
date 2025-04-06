"use client";

// app/layout.tsx
import './globals.css';
import React from 'react';
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";
import { TopHeader } from "@/components/top-header";
import SearchDropdown from "@/components/search-dropdown";
import Providers from './providers';
import { useEffect } from 'react';
import { metadata } from './metadata';

export type RootLayoutProps = {
  children: React.ReactNode
};

export default function RootLayout({ children }: RootLayoutProps) {

  useEffect(() => {
    if (!window.Kakao) {
      const script = document.createElement('script');
      script.src = "https://developers.kakao.com/sdk/js/kakao.js";
      script.onload = () => {
        window.Kakao.init('0bbb8e7bb04d99385a87998c64580b1b');
      };
      document.head.appendChild(script);
    } else {
      window.Kakao.init('0bbb8e7bb04d99385a87998c64580b1b');
    }
    console.log("Kakao SDK initialized");
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-x-hidden max-w-full">
       <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen flex flex-col overflow-x-hidden max-w-full">
              <header>
                <TopHeader />
                <div className="border-b">
                  {/* 헤더 영역을 flex로 만들어 왼쪽에 타이틀+메뉴, 오른쪽에 검색 바 배치 */}
                  <div className="container max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between">
                    <div style={{ flex: 1 }}>
                      <div className="py-4" style={{ display: 'flex', justifyContent: 'center' }}>
                        <Link href="/">
                          <img
                            src="https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/Logo/Logo.png"
                            alt="CEO Daily Brief"
                            width="96"
                            height="69"
                          />
                        </Link>
                      </div>
                      <MainNav />
                    </div>
                    {/* 우측 상단 검색 바 */}
                    <SearchDropdown />
                  </div>
                </div>
              </header>
              <main className="flex-1 container max-w-[1400px] mx-auto px-4 lg:px-8">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
