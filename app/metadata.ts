import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://ceodailybrief.com'),
  title: "CEO Daily Brief",
  description: "Comprehensive coverage of healthcare industry trends and news",
  openGraph: {
    title: "CEO Daily Brief",
    description: "Comprehensive coverage of healthcare industry trends and news",
    url: "https://ceodailybrief.com",
    type: "website",
    images: ["/ceodailybrief-Thumbnail.png"],
  },
  icons: ["/ceodailybrief-Favicon.png"],
};
