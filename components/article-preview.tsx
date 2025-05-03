import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Post } from "@/types/supabase";
import Image from "next/image";

// HTML 엔티티 디코딩 헬퍼 함수
const decodeHtmlEntities = (text: string) => {
  if (!text) return '';
  
  // 간소화된 버전으로 변경 - 주요 HTML 엔티티만 처리
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
};

// 콘텐츠 정리 함수
export const cleanPostContent = (content: string) => {
  try {
    if (!content) return '내용 없음';
    
    // HTML 태그 먼저 제거
    const noHtml = content.replace(/<[^>]+>/g, ' ');
    
    // 엔티티 디코딩
    const decodedContent = decodeHtmlEntities(noHtml);
    
    // 앞뒤 공백 제거 및 길이 제한
    return decodedContent.trim().substring(0, 150) + 
      (decodedContent.length > 150 ? '...' : '');
  } catch (err) {
    console.error('콘텐츠 처리 오류:', err);
    return '콘텐츠 처리 중 오류 발생';
  }
};

// 이미지 URL 검증 및 처리 함수 추가
const getValidImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  
  // URL이 http:// 또는 https://로 시작하는지 확인
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // 상대 경로인 경우 절대 경로로 변환
    return url.startsWith('/') ? url : `/${url}`;
  }
  
  return url;
};

interface ArticlePreviewProps {
  post: Post;
}

const ArticlePreview = React.memo(({ post }: ArticlePreviewProps) => {
  const imageUrl = getValidImageUrl(post.image_url);
  
  return (
    <Link href={`/article/${post.id}`} className="block h-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
        {imageUrl && (
          <div className="relative w-full pt-[56.25%]">
            <Image
              src={imageUrl}
              alt={post.title || "게시글 이미지"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={false}
              onError={(e) => {
                console.error(`이미지 로드 오류: ${imageUrl}`);
                // 이미지 오류 시 기본 이미지로 대체 또는 이미지 요소 숨김
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className={`flex flex-col flex-grow ${!imageUrl ? 'justify-between' : ''}`}>
          <div className={`flex flex-col ${!imageUrl ? 'justify-center flex-grow' : ''}`}>
            <CardHeader className={`pb-1 pt-3 ${!imageUrl ? 'text-center' : ''}`}>
              <CardTitle className="text-lg font-bold leading-tight">
                {post.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className={`py-1 ${!imageUrl ? 'text-center' : ''}`}>
              <div className="text-gray-700 text-sm">
                {post.content ? (
                  <p className="line-clamp-3 max-h-[4.5em]">
                    {cleanPostContent(post.content)}
                  </p>
                ) : (
                  <p className="italic">내용 없음</p>
                )}
              </div>
            </CardContent>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground p-4 pt-2 mt-auto border-t">
            <Calendar className="mr-2 h-4 w-4" />
            {new Date(post.updated_at || post.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </Card>
    </Link>
  );
});

ArticlePreview.displayName = 'ArticlePreview';

export default ArticlePreview; 