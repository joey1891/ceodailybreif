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
import { metadata as appMetadata } from './metadata';
import { KakaoScriptInitializer } from '@/components/KakaoScriptInitializer';

export const metadata = appMetadata;

export type RootLayoutProps = {
  children: React.ReactNode
};

export default function RootLayout({ children }: RootLayoutProps) {

  return (
    <html lang="en">
      <body className="overflow-x-hidden max-w-full">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <KakaoScriptInitializer />
            <div className="min-h-screen flex flex-col overflow-x-hidden max-w-full">
              <header>
                <TopHeader />
                <div>
                  {/* 헤더 영역을 flex로 만들어 왼쪽에 타이틀+메뉴, 오른쪽에 검색 바 배치 */}
                  <div className="container max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-center logo-padding">
                        <Link href="/">
                          {/* 로고 텍스트 박스 */}
                          <div
                            className="flex flex-col items-center w-[250px] text-center px-[10px]" // Flexbox로 내부 요소 정렬 및 Tailwind 클래스 적용
                          >
                            {/* 첫 번째 줄: CEO */}
                            <span
                              className="text-[5rem] leading-none font-bold block text-black align-bottom" // Tailwind 클래스 적용
                              style={{
                                fontFamily: 'GangwonEduTteunTteun', // 폰트 파일 이름 변경에 맞춰 수정
                                letterSpacing: 'var(--logo-letter-spacing-ceo)' // 글자 간격 변수 적용
                              }}
                            >
                              CEO
                            </span>
                            {/* 두 번째 줄: DAILY BRIEF */}
                            <span
                              className="text-[1.7rem] leading-none font-normal block text-black mt-px align-top" // Tailwind 클래스 적용
                              style={{
                                fontFamily: 'Pretendard Variable', // Pretendard 폰트 적용
                                letterSpacing: 'var(--logo-letter-spacing-daily)' // 글자 간격 변수 적용
                              }}
                            >
                              DAILY BRIEF
                            </span>
                          </div>
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
