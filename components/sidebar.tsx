"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, BookOpen, Youtube } from 'lucide-react';
import { Post } from "@/types/supabase";

interface SidebarProps {
  recentPosts: Post[];
  popularPosts: Post[];
}

export function Sidebar({ recentPosts, popularPosts }: SidebarProps) {
  return (
    <div className="w-full space-y-6">
      {/* Author Profile */}
      <Card className="bg-white border-0 relative before:absolute before:inset-0 before:border-2 before:border-dashed before:border-gray-200 before:rounded-lg">
        <CardHeader className="flex flex-col items-center space-y-1.5 p-6">
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
        <CardContent className="p-6 pt-0 text-center">
          <p className="text-muted-foreground">
            보건의료산업 관련 전반에 영향을 미치는 주요 변수들의 동향들을 살펴보고, 관련 의사결정자들이 더 나은 판단을 할 수 있게 도움주고자 개설된 정보 플랫폼입니다.
          </p>
        </CardContent>
      </Card>

      {/* YouTube Connection */}
      <Card className="bg-white border-0 relative before:absolute before:inset-0 before:border-2 before:border-dashed before:border-gray-200 before:rounded-lg">
        <CardContent className="p-6 flex justify-center">
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
      <Card className="bg-white border-0 relative before:absolute before:inset-0 before:border-2 before:border-dashed before:border-gray-200 before:rounded-lg">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold">이메일로 새 글 받아보기</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form className="flex items-start gap-2">
            <Input
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
      <Card className="bg-white border-0 relative before:absolute before:inset-0 before:border-2 before:border-dashed before:border-gray-200 before:rounded-lg">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold">Search</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form className="flex items-start gap-2">
            <Input
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
      <Card className="bg-white border-0 relative before:absolute before:inset-0 before:border-2 before:border-dashed before:border-gray-200 before:rounded-lg">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recent Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {recentPosts.map((post, index) => (
            <div key={index} className="flex gap-3">
              <div className="shrink-0">
                <Link href={`/article/${post.id}`} className="hover:underline">
                  {post.title}
                </Link>
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-medium">
                  <Link href={`/article/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h3>
                <div className="text-xs text-muted-foreground mt-1">{new Date(post.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Most Viewed Posts */}
      <Card className="bg-white border-0 relative before:absolute before:inset-0 before:border-2 before:border-dashed before:border-gray-200 before:rounded-lg">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold">조회수 순위</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
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
                    ? (post.content.length > 100 
                        ? post.content.substring(0, 100) + '...' 
                        : post.content)
                    : '내용 없음'}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {post.view_count !== undefined 
                    ? `조회수: ${post.view_count}` 
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
      <Card className="bg-white border-0 relative before:absolute before:inset-0 before:border-2 before:border-dashed before:border-gray-200 before:rounded-lg">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold">Partners</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex justify-center">
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
