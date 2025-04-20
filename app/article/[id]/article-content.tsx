"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { format } from "date-fns";
import { editorGlobalStyles } from '@/components/editorWith-uploader';

function extractImageUrl(html: string | undefined): string | null {
  if (!html) return null;
  const imgTag = html.match(/<img[^>]+src="?([^">]+)"?/);
  return imgTag ? imgTag[1] : null;
}

export { extractImageUrl };

export function ArticleContent({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isKakaoInitialized, setIsKakaoInitialized] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*, categories(*)")
          .eq("id", params.id)
          .eq("is_deleted", false)
          .single();

        if (error) {
          console.error("Error fetching post:", error);
          alert("기사를 불러오는 중 오류가 발생했습니다.");
        } else {
          console.log("Post data loaded:", data);
          setPost(data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching post:", error);
        alert("기사를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  useEffect(() => {
    const 게시글조회수증가 = async () => {
      if (!post || !post.id) return;
      
      try {
        const { error } = await supabase
          .from('posts')
          .update({ viewcnt: (post.viewcnt || 0) + 1 })
          .eq('id', post.id);
          
        if (error) {
          console.error('게시글 조회수 증가 실패:', error);
        }
      } catch (err) {
        console.error('게시글 조회수 증가 처리 중 오류:', err);
      }
    };
    
    if (post && !loading) {
      게시글조회수증가();
    }
  }, [post, loading]);

  useEffect(() => {
    // Poll to check if Kakao SDK is initialized
    const intervalId = setInterval(() => {
      if (window.Kakao && window.Kakao.isInitialized()) {
        setIsKakaoInitialized(true);
        clearInterval(intervalId); // Clear interval once initialized
      }
    }, 100); // Check every 100ms

    // Cleanup function to clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (post) {
      console.log("포스트 데이터:", {
        title: !!post.title,
        content: !!post.content,
        image_url: !!post.image_url,
        all_conditions_met: !!(post.title && post.content && post.image_url)
      });
    }
  }, [post]);

  useEffect(() => {
    console.log("Post data:", post);
    console.log("Kakao initialized:", isKakaoInitialized);
    
    // DOM에 버튼이 추가되었는지 확인
    setTimeout(() => {
      const shareButtons = document.querySelectorAll('.share-buttons-container button');
      console.log("Share buttons found:", shareButtons.length);
    }, 1000);
  }, [post, isKakaoInitialized]);

  const handleShare = useCallback((platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  }, [post]);

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-[400px] bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/3">
          <Sidebar recentPosts={[]} popularPosts={[]} />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">기사를 찾을 수 없습니다</h1>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* 가장 직접적인 셀렉터 사용 */
        .prose p:empty {
          display: block !important;
          min-height: 1em !important;
          margin: 1em 0 !important;
        }

        /* 중첩 목록 스타일 */
        .prose ul ul,
        .prose ol ol,
        .prose ul ol,
        .prose ol ul {
          list-style-type: inherit !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }

        /* 기본 목록 스타일 강제 적용 */
        .prose ul {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }
        
        .prose ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }
        
        /* 목록 항목 내 단락 여백 조정 */
        .prose li > p {
          margin: 0.25em 0 !important;
          padding: 0 !important;
        }
        
        /* 빈 단락 강제 표시 */
        .prose li > p:empty {
          height: 1em !important;
          min-height: 1em !important;
          display: block !important;
          margin: 0.5em 0 !important;
        }
        
        /* Tailwind의 prose 오버라이드 */
        .prose {
          max-width: none;
        }
        
        /* 이미지 스타일 */
        .prose img {
          max-width: 100% !important;
          height: auto !important;
          margin: 1em auto !important;
        }
      `}</style>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3">
            {/* Back Button */}
            <Button variant="ghost" asChild className="mb-8">
              <Link href="/" className="text-primary hover:text-primary/80">
                <ArrowLeft className="mr-2 h-4 w-4" />
                홈으로
              </Link>
            </Button>

            {/* Article Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4 select-none">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 select-none">
                <time>{format(new Date(post.created_at), 'yyyy년 MM월 dd일')}</time>
                <div>조회수: {post.viewcnt || 0}</div>
              </div>
            </div>

            {/* Featured Image */}
            {post.image_url && (
              <div className="w-full flex justify-center items-center bg-gray-100 p-2 rounded-lg" style={{ minHeight: "250px", maxHeight: "400px" }}>
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="max-w-full max-h-[380px] object-contain"
                />
              </div>
            )}

            {/* Article Content - 스타일 방식 수정 */}
            <div className="prose prose-lg max-w-none mb-8">
              {post?.content && (
                <div 
                  className="mt-6 select-none" 
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              )}
            </div>

            {/* Share Buttons */}
            <div className="mt-8 pt-8 border-t select-none share-buttons-container">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-4 w-4" />
                <span className="font-medium">이 기사 공유하기</span>
              </div>
              
              {/* 단순화된 조건으로 변경 & 인라인 스타일 추가 */}
              <div className="flex flex-wrap gap-2" style={{display: 'flex !important'}}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("링크가 복사되었습니다.");
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ccc',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    color: '#333',
                    fontWeight: '500',
                    display: 'block'
                  }}
                >
                  링크 복사
                </button>
                
                <button 
                  onClick={() => {
                    if (window.Kakao?.Share) {
                      window.Kakao.Share.sendDefault({
                        objectType: 'feed',
                        content: {
                          title: post?.title || '기사 제목',
                          description: post?.description || '',
                          imageUrl: post?.image_url || 'https://your-default-image.jpg',
                          link: {
                            mobileWebUrl: window.location.href,
                            webUrl: window.location.href,
                          },
                        },
                        buttons: [
                          {
                            title: '웹으로 보기',
                            link: {
                              mobileWebUrl: window.location.href,
                              webUrl: window.location.href,
                            },
                          },
                        ],
                      });
                    } else {
                      console.error("Kakao SDK not initialized");
                      alert("카카오 SDK가 초기화되지 않았습니다.");
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ccc',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    color: '#333',
                    fontWeight: '500',
                    display: 'block'
                  }}
                >
                  카카오톡
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-1/3">
            <Sidebar recentPosts={[]} popularPosts={[]} />
          </div>
        </div>
      </div>
    </>
  );
}
