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

export const metadata: Metadata = {
  title: "CEO Daily Brief",
  description: "The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence",
  icons: {
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
      /* 💡 h-full을 제거하고, 최상위 html 태그에 직접 bg-[#fcfcfc]를 적용하여 끊김 방지 */
      className={`${geistSans.variable} ${geistMono.variable} bg-[#fcfcfc] antialiased`}
    >
      <body className="min-h-screen flex flex-col text-[#111111]">
        {children}
      </body>
    </html>
  );
}
