import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // GTM 스크립트 삽입을 위해 추가
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
      className={`${geistSans.variable} ${geistMono.variable} bg-[#fcfcfc] antialiased`}
    >
      <head>
        {/* Google Tag Manager (Head) */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PTCS5PBM');
          `}
        </Script>

        {/* 💡 에디터에서 설정한 텍스트 포맷이 사이트 전체에서 유지되도록 글로벌 스타일 주입 */}
        <style dangerouslySetInnerHTML={{__html: `
          .ql-align-center { text-align: center; }
          .ql-align-right { text-align: right; }
          .ql-align-justify { text-align: justify; }
          .ql-size-small { font-size: 0.75em; }
          .ql-size-large { font-size: 1.5em; }
          .ql-size-huge { font-size: 2.5em; }
        `}} />
      </head>
      
      <body className="min-h-screen flex flex-col text-[#111111]">
        {/* Google Tag Manager (noscript) - Body */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-PTCS5PBM"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}
