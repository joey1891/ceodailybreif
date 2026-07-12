import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 메인 페이지(CEO Daily Brief) 공유 시 나타나는 기본 메타데이터 설정
export const metadata: Metadata = {
  title: "CEO Daily Brief",
  description: "The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence",
  openGraph: {
    title: "CEO Daily Brief",
    description: "The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence",
    url: "https://www.ceodailybrief.com",
    siteName: "CEO Daily Brief",
    type: "website",
    /* 
      별도의 대표 이미지 없이 텍스트만 나가게 하려면 이대로 두시면 됩니다. 
      만약 '흰색 바탕에 글씨가 적힌 썸네일 이미지 파일'을 직접 만들어 public 폴더에 넣으셨다면, 
      아래 주석(//)을 지우고 연결해 주시면 됩니다.
    */
    // images: [
    //   {
    //     url: '/main-thumbnail.jpg', 
    //     width: 1200,
    //     height: 630,
    //   },
    // ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
