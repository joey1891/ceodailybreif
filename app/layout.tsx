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
    } else if (!window.Kakao.isInitialized()) {
      window.Kakao.init('0bbb8e7bb04d99385a87998c64580b1b');
      console.log("Kakao SDK initialized");
    }
  }, []);

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
            <div className="min-h-screen flex flex-col overflow-x-hidden max-w-full">
              <header>
                <TopHeader />
                <div className="border-b">
                  {/* 헤더 영역을 flex로 만들어 왼쪽에 타이틀+메뉴, 오른쪽에 검색 바 배치 */}
                  <div className="container max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between">
                    <div style={{ flex: 1 }}>
                      <div className="" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--logo-padding-top)', paddingBottom: 'var(--logo-padding-bottom)' }}>
                        <Link href="/">
                          {/* 로고 텍스트 박스 */}
                          <div
                            style={{
                              width: '190px', // 로고 너비 (조정 가능)
                              textAlign: 'center', // 텍스트 가운데 정렬
                              paddingLeft: '10px', // 좌측 간격 (조정 가능)
                              paddingRight: '10px', // 우측 간격 (조정 가능)
                            }}
                            className="flex flex-col items-center" // Flexbox로 내부 요소 정렬
                          >
                            {/* 첫 번째 줄: CEO */}
                            <span
                              style={{
                                fontSize: '3rem', // 첫 줄 폰트 크기 (조정 가능) - 대략 100px 높이에 맞춤
                                lineHeight: '1', // 줄 간격 최소화
                                fontWeight: 'bold', // 굵은 글씨
                                display: 'block', // 블록 요소로 만들어 너비 차지
                                color: 'black', // 텍스트 색상
                                verticalAlign: 'bottom', // 텍스트 하단 정렬
                                fontFamily: 'GangwonEdu', // 강원교육튼튼 폰트 적용
                                letterSpacing: 'var(--logo-letter-spacing-ceo)' // 글자 간격 변수 적용
                              }}
                            >
                              CEO
                            </span>
                            {/* 두 번째 줄: DAILY BRIEF */}
                            <span
                              style={{
                                fontSize: '1rem', // 두 번째 줄 폰트 크기 (조정 가능) - 대략 37px 높이에 맞춤
                                lineHeight: '1', // 줄 간격 최소화
                                fontWeight: 'normal', // 일반 굵기
                                display: 'block', // 블록 요소로 만들어 너비 차지
                                color: 'black', // 텍스트 색상
                                marginTop: '1', // 줄 간격 미세 조정
                                verticalAlign: 'top', // 텍스트 상단 정렬
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
