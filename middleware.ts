import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { categoryMappings } from './lib/category-mappings';
import { subCategoryUrls } from './lib/category-urls';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // 특정 패턴은 제외
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next') || 
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // URL 디코딩
  const decodedPath = decodeURIComponent(pathname);
  
  // 마지막 세그먼트 확인 (예: policy-pharmaceutical)
  const segments = decodedPath.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return NextResponse.next();
  }
  
  // 이미 올바른 URL인지 확인
  const lastSegment = segments[segments.length - 1];
  
  // 최종 세그먼트가 subCategoryUrls에 있고, URL이 4개 이상의 세그먼트를 가지고 있으면
  // 중복된 카테고리 구조로 판단하고 올바른 URL로 리다이렉트
  if (segments.length >= 3 && subCategoryUrls[lastSegment]) {
    const correctUrl = subCategoryUrls[lastSegment];
    if (decodedPath !== correctUrl) {
      url.pathname = correctUrl;
      return NextResponse.redirect(url);
    }
  }
  
  // 한글 카테고리가 있는지 확인
  let modified = false;
  const newSegments = segments.map(segment => {
    if (categoryMappings[segment]) {
      modified = true;
      return categoryMappings[segment];
    }
    return segment;
  });
  
  if (modified) {
    url.pathname = '/' + newSegments.join('/');
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// 미들웨어가 적용될 경로 제한
export const config = {
  matcher: [
    // 홈페이지와 동적 경로에만 적용
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ],
}; 