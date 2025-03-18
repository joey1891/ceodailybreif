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

interface SidebarProps {
  recentPosts: Post[];
  popularPosts: Post[];
}

export function Sidebar({ recentPosts, popularPosts: propPopularPosts }: SidebarProps) {
  const [popularPosts, setPopularPosts] = useState<Post[]>(propPopularPosts || []);
  
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
    const fetchPopularPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('viewcnt', { ascending: false })
          .limit(5);
          
        if (error) {
          console.error('인기 게시물 가져오기 실패:', error);
          return;
        }
        
        if (data) {
          setPopularPosts(data);
        }
      } catch (err) {
        console.error('인기 게시물 처리 중 오류:', err);
      }
    };
    
    fetchPopularPosts();
  }, []);

  return (
    <div className="w-full space-y-6 select-none">
      {/* Author Profile */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="flex flex-col items-center space-y-1.5 p-6 relative z-10">
          <Link href="/about">
            <Image
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="신원종"
              width={250}
              height={250}
              className="rounded-full"
            />
          </Link>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-center relative z-10">
          <p className="text-muted-foreground">
            보건의료산업 관련 전반에 영향을 미치는 주요 변수들의 동향들을 살펴보고, 관련 의사결정자들이 더 나은 판단을 할 수 있게 도움주고자 개설된 정보 플랫폼입니다.
          </p>
        </CardContent>
      </Card>

      {/* YouTube Connection */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardContent className="p-6 flex justify-center relative z-10">
          <Link href="https://www.youtube.com/channel/UCpj6ePqOi9YbOWdQoLAX3fw" target="_blank" rel="noopener noreferrer">
            <Image
              src="https://i.ytimg.com/vi/DaVoKFI25eM/maxresdefault.jpg"
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
          <form className="flex items-start gap-2">
            <Input
              id="email-subscription"
              type="email"
              placeholder="이메일 주소"
              className="text-sm border-gray-300"
              required
            />
            <Button type="submit" className="text-sm flex items-center">
              <span>Subscribe</span>
            </Button>
          </form>
          <div className="mt-3 text-sm text-muted-foreground">
            Join 1,471 other subscribers
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

      {/* Most Viewed Posts */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="space-y-1.5 p-6 relative z-10">
          <CardTitle className="text-xl font-semibold">조회수 순위</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4 relative z-10">
          {popularPosts && popularPosts.length > 0 ? (
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
                <div className="text-xs text-muted-foreground mt-2">
                  {post.viewcnt !== undefined 
                    ? `조회수: ${post.viewcnt}` 
                    : ''}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              조회수 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partners */}
      <Card className="bg-white border-0 relative">
        <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-lg pointer-events-none"></div>
        <CardHeader className="space-y-1.5 p-6 relative z-10">
          <CardTitle className="text-xl font-semibold">Partners</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex justify-center relative z-10">
          <Link href="http://dhpartners.io/" target="_blank" rel="noopener noreferrer">
            <Image
              src="https://www.yoonsupchoi.com/wp-content/uploads/2016/06/DHP.png"
              alt="DHP"
              width={180}
              height={60}
            />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
