"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, BookOpen, Youtube } from 'lucide-react';
import { Post } from "@/types/supabase";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCategoryUrl } from '@/lib/routes';
import { useRecoilState } from 'recoil';
import { aboutMeDataState } from '@/lib/recoil/atoms';
import { addSubscriber } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

interface SidebarProps {
  recentPosts: Post[];
  popularPosts: Post[];
}

interface SidebarSettings {
  profile_description: string;
  youtube_link: string;
  youtube_thumbnail_url: string;
}

export function Sidebar({ recentPosts, popularPosts: propPopularPosts }: SidebarProps) {
  const [popularPosts, setPopularPosts] = useState<Post[]>(propPopularPosts || []);
  const [aboutMeData, setAboutMeData] = useRecoilState(aboutMeDataState);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarSettings, setSidebarSettings] = useState<SidebarSettings>({
    profile_description: "보건의료산업 관련 전반에 영향을 미치는 주요 변수들의 동향들을 살펴보고, 관련 의사결정자들이 더 나은 판단을 할 수 있게 도움주고자 개설된 정보 플랫폼입니다.",
    youtube_link: "https://www.youtube.com/channel/UCpj6ePqOi9YbOWdQoLAX3fw",
    youtube_thumbnail_url: "https://i.ytimg.com/vi/DaVoKFI25eM/maxresdefault.jpg"
  });
  
  // HTML 태그와 엔티티를 제거하는 개선된 함수
  const stripHtml = (html: string): string => {
    if (!html) return '';
    
    // 임시 div 요소 생성
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // 텍스트 콘텐츠만 추출 (모든 태그와 엔티티가 해석됨)
    let text = doc.body.textContent || '';
    
    // 연속된 공백을 하나로 줄이기
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 사이드바 설정 가져오기
        const { data: settingsData, error: settingsError } = await supabase
          .from("sidebar_settings")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();
          
        if (!settingsError && settingsData) {
          setSidebarSettings({
            profile_description: settingsData.profile_description,
            youtube_link: settingsData.youtube_link,
            youtube_thumbnail_url: settingsData.youtube_thumbnail_url
          });
        }

        // 피처드(조회수 순위) 게시물 가져오기
        const { data: featuredData, error: featuredError } = await supabase
          .from("featured_posts")
          .select("*, post:posts(*)")
          .order("display_order", { ascending: true });
          
        if (!featuredError && featuredData && featuredData.length > 0) {
          // 피처드 게시물이 있으면 이를 사용
          const transformedPosts = featuredData.map(item => item.post) as Post[];
          setPopularPosts(transformedPosts);
        } else {
          // 피처드 게시물이 없으면 실제 조회수 순으로 가져오기
          const { data: popularData, error: popularError } = await supabase
            .from('posts')
            .select('*')
            .order('viewcnt', { ascending: false })
            .limit(5);
            
          if (!popularError && popularData) {
            setPopularPosts(popularData);
          }
        }

        // 추천 도서 불러오기
        const { data: books, error: booksError } = await supabase
          .from('recommended_books')
          .select('*')
          .order('display_order', { ascending: true })
          .limit(5);

        if (!booksError && books) {
          setRecommendedBooks(books);
        }
        
        // 프로필 정보 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from("about_me")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (!profileError && profileData) {
          setAboutMeData(profileData);
        }
      } catch (err) {
        console.error('데이터 처리 중 오류:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 이메일 구독 처리 함수
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubscribeStatus("loading");
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          alert("이미 구독 중인 이메일입니다.");
        } else {
          alert(result.error || "구독 처리 중 오류가 발생했습니다.");
        }
        setSubscribeStatus("error");
        return;
      }
      
      setSubscribeStatus("success");
      setEmail("");
      setTimeout(() => setSubscribeStatus("idle"), 3000);
    } catch (err) {
      console.error("구독 처리 중 오류:", err);
      setSubscribeStatus("error");
    }
  };

  return (
    <div className="w-full space-y-6 select-none">
      {/* Author Profile */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="flex flex-col items-center space-y-1.5 p-6 relative z-10">
          <Link href="/about">
            <Image
              src={aboutMeData?.profile_image_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
              alt="신원종"
              width={250}
              height={250}
              className="rounded-full"
            />
          </Link>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-center relative z-10">
          <p className="text-muted-foreground text-left break-keep">
            {sidebarSettings.profile_description}
          </p>
        </CardContent>
      </Card>

      {/* YouTube Connection */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardContent className="p-6 flex justify-center relative z-10">
          <Link href={sidebarSettings.youtube_link} target="_blank" rel="noopener noreferrer">
            <Image
              src={sidebarSettings.youtube_thumbnail_url}
              alt="유튜브"
              width={250}
              height={250}
            />
          </Link>
        </CardContent>
      </Card>

      {/* Email Subscription */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="space-y-1.5 p-6 relative z-10">
          <CardTitle className="text-xl font-semibold">이메일로 새 글 받아보기</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 relative z-10">
          <form className="flex items-start gap-2" onSubmit={handleSubscribe}>
            <Input
              id="email-subscription"
              type="email"
              placeholder="이메일 주소"
              className="text-sm border-gray-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={subscribeStatus === "loading"}
            />
            <Button 
              type="submit" 
              className="text-sm flex items-center"
              disabled={subscribeStatus === "loading"}
            >
              {subscribeStatus === "loading" ? "처리 중..." : "Subscribe"}
            </Button>
          </form>
          {subscribeStatus === "success" && (
            <div className="mt-3 text-sm text-green-600">
              구독 신청이 완료되었습니다! 관리자 승인 후 구독 완료됩니다.
            </div>
          )}
          {subscribeStatus === "error" && (
            <div className="mt-3 text-sm text-red-600">
              오류가 발생했습니다. 다시 시도해주세요.
            </div>
          )}
          <div className="mt-3 text-sm text-muted-foreground">
            게시물 업데이트 소식을 이메일로 받아보세요.
          </div>
        </CardContent>
      </Card>

      {/* Search Widget */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="space-y-1.5 p-6 relative z-10">
          <CardTitle className="text-xl font-semibold">Search</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 relative z-10">
          <form className="flex items-start gap-2">
            <Input
              id="search-input"
              type="search"
              placeholder="검색어를 입력하세요"
              className="text-sm border-gray-300"
              required
            />
            <Button type="submit" className="text-sm flex items-center">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="space-y-1.5 p-6 relative z-10">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            최신 게시글
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4 relative z-10">
          {recentPosts && recentPosts.length > 0 ? (
            recentPosts.map((post, index) => (
              <div key={post.id || index} className="flex flex-col">
                <h3 className="text-sm font-medium">
                  <Link href={`/article/${post.id}`} className="hover:underline">
                    {post.title || `최신 게시물 ${index + 1}`}
                  </Link>
                </h3>
                <div className="text-xs text-muted-foreground mt-1">
                  {post.content 
                    ? (stripHtml(post.content).length > 100 
                        ? stripHtml(post.content).substring(0, 100) + '...' 
                        : stripHtml(post.content))
                    : '내용 없음'}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {post.created_at 
                    ? `작성일: ${new Date(post.created_at).toLocaleDateString()}` 
                    : ''}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              최신 게시글이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Viewed Posts - 이미 위에서 관리자 설정에 따라 조회수 순위를 가져옴 */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="space-y-1.5 p-6 relative z-10">
          <CardTitle className="text-xl font-semibold">조회수 순위</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4 relative z-10">
          {loading ? (
            <p>로딩 중...</p>
          ) : (
            popularPosts.map((post, index) => (
              <div key={post.id || index} className="flex flex-col">
                <h3 className="text-sm font-medium">
                  <Link href={`/article/${post.id}`} className="hover:underline">
                    {post.title || `인기 게시물 ${index + 1}`}
                  </Link>
                </h3>
                <div className="text-xs text-muted-foreground mt-1">
                  {post.content 
                    ? (stripHtml(post.content).length > 100 
                        ? stripHtml(post.content).substring(0, 100) + '...' 
                        : stripHtml(post.content))
                    : '내용 없음'}
                </div>
                <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                  <span>
                    {post.created_at 
                      ? `작성일: ${new Date(post.created_at).toLocaleDateString()}` 
                      : ''}
                  </span>
                  <span>조회수: {post.viewcnt || 0}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 도서 추천 위젯 */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="space-y-1.5 p-6 relative z-10">
          <CardTitle className="text-xl font-semibold">도서 추천</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4 relative z-10">
          {loading ? (
            <p>로딩 중...</p>
          ) : (
            <div className="space-y-4">
              {recommendedBooks.map((book) => (
                <div key={book.id} className="text-center">
                  <a 
                    href={book.link_url || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Image
                      src={book.image_url}
                      alt={book.title || "추천 도서"}
                      width={300}
                      height={200}
                      className="mx-auto hover:opacity-80 transition-opacity"
                    />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}