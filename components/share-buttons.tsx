"use client"; // 클라이언트 컴포넌트 표시

import { Post } from "@/types/supabase";
import { useEffect, useState, useCallback } from "react";

export function ShareButtons({ post }: { post: Post }) {
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  
  useEffect(() => {
    // Kakao SDK 초기화 확인
    const checkKakaoInit = setInterval(() => {
      if (window.Kakao && window.Kakao.isInitialized()) {
        setIsKakaoReady(true);
        clearInterval(checkKakaoInit);
      }
    }, 500);
    
    return () => clearInterval(checkKakaoInit);
  }, []);

  // 공유 데이터 준비 - 일관된 정보 제공
  const shareData = {
    url: typeof window !== 'undefined' ? window.location.href : '',
    title: post?.title || '기사 제목',
    description: post?.description || post?.title || '기사 내용',
    imageUrl: post?.image_url || 'https://ceobrief.co.kr/images/logo.png', // 사이트 로고로 변경
    siteName: 'CEO Daily Brief' // 사이트 이름 추가
  };

  // 개선된 소셜 공유 기능
  const handleShare = useCallback((platform: string) => {
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title)}&url=${encodeURIComponent(shareData.url)}&via=${encodeURIComponent(shareData.siteName)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&summary=${encodeURIComponent(shareData.description)}`,
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  }, [shareData]);
  
  return (
    <div className="mt-8 pt-8 border-t select-none">
      <div className="flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span className="font-medium">이 기사 공유하기</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* 링크 복사 */}
        <button
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={() => {
            navigator.clipboard.writeText(shareData.url);
            alert("링크가 복사되었습니다.");
          }}
        >
          링크 복사
        </button>
        
        {/* 트위터 */}
        <button
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={() => handleShare('twitter')}
        >
          트위터
        </button>
        
        {/* 페이스북 */}
        <button
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={() => handleShare('facebook')}
        >
          페이스북
        </button>
        
        {/* 링크드인 */}
        <button
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={() => handleShare('linkedin')}
        >
          링크드인
        </button>
        
        {/* 카카오톡 */}
        {isKakaoReady && (
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => {
              if (window.Kakao?.Share) {
                window.Kakao.Share.sendDefault({
                  objectType: 'feed',
                  content: {
                    title: shareData.title,
                    description: shareData.description,
                    imageUrl: shareData.imageUrl,
                    link: {
                      mobileWebUrl: shareData.url,
                      webUrl: shareData.url,
                    },
                  },
                  social: {
                    likeCount: post.viewcnt || 0,
                    commentCount: 0,
                    sharedCount: 0,
                  },
                  buttons: [
                    {
                      title: '웹으로 보기',
                      link: {
                        mobileWebUrl: shareData.url,
                        webUrl: shareData.url,
                      },
                    },
                  ],
                });
              } else {
                console.error("Kakao SDK not initialized");
                alert("카카오 SDK가 초기화되지 않았습니다.");
              }
            }}
          >
            카카오톡
          </button>
        )}
      </div>
    </div>
  );
} 