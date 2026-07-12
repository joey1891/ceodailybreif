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

// 파비콘과 메인 썸네일(OG 이미지)이 모두 적용된 메타데이터 설정
export const metadata: Metadata = {
  title: "CEO Daily Brief",
  description: "The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence",
  icons: {
    // 웹 브라우저 탭에 표시되는 파비콘 적용
    icon: "https://inpfhtkdghdidkbgtrzj.supabase.co/storage/v1/object/public/article_images/fabicon.jpg",
  },
  openGraph: {
    title: "CEO Daily Brief",
    description: "The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence",
    url: "https://www.ceodailybrief.com",
    siteName: "CEO Daily Brief",
    type: "website",
    images: [
      {
        // 메인 홈페이지 공유 시 나타나는 썸네일 적용
        url: "https://inpfhtkdghdidkbgtrzj.supabase.co/storage/v1/object/public/article_images/thumb.jpg", 
        width: 1200,
        height: 630,
      },
    ],
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
