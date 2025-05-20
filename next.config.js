/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Strict Mode 활성화
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.yoonsupchoi.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'fvkrstymtqhvrnclugcp.supabase.co',
        pathname: '/storage/v1/object/public/images/articles/**',
      },
    ],
  },
  async redirects() {
    return [
      // 한글 카테고리에서 영문 카테고리로 리다이렉트
      {
        source: '/리포트/:path*',
        destination: '/report/:path*',
        permanent: true,
      },
      {
        source: '/경제-동향/:path*',
        destination: '/economic-trends/:path*',
        permanent: true,
      },
      {
        source: '/금융-동향/:path*',
        destination: '/financial-trends/:path*',
        permanent: true,
      },
      {
        source: '/산업-동향/:path*',
        destination: '/industry/:path*',
        permanent: true,
      },
      {
        source: '/기업-동향/:path*',
        destination: '/company/:path*',
        permanent: true,
      },
      {
        source: '/정책-동향/:path*',
        destination: '/policy/:path*',
        permanent: true,
      },
      {
        source: '/언론-동향/:path*',
        destination: '/media/:path*',
        permanent: true,
      },
      {
        source: '/마케팅-동향/:path*',
        destination: '/marketing/:path*',
        permanent: true,
      },
      {
        source: '/인물과-동향/:path*',
        destination: '/people/:path*',
        permanent: true,
      },
      {
        source: '/미디어-리뷰/:path*',
        destination: '/media-review/:path*',
        permanent: true,
      },
    ];
  },
  swcMinify: true,
};

module.exports = nextConfig;
