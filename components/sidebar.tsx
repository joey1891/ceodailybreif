"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, BookOpen, Youtube, BookOpenText, Play } from 'lucide-react';
import { Post } from "@/types/supabase";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCategoryUrl } from '@/lib/routes';
import { useRecoilState } from 'recoil';
import { aboutMeDataState } from '@/lib/recoil/atoms';
import { addSubscriber } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import React from 'react';

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
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [showAllYoutube, setShowAllYoutube] = useState(false);
  const [sidebarSettings, setSidebarSettings] = useState<SidebarSettings>({
    profile_description: "보건의료산업 관련 전반에 영향을 미치는 주요 변수들의 동향들을 살펴보고, 관련 의사결정자들이 더 나은 판단을 할 수 있게 도움주고자 개설된 정보 플랫폼입니다.",
    youtube_link: "https://www.youtube.com/channel/UCpj6ePqOi9YbOWdQoLAX3fw",
    youtube_thumbnail_url: "https://i.ytimg.com/vi/DaVoKFI25eM/maxresdefault.jpg"
  });
  
  const [youtubeEntries, setYoutubeEntries] = useState<any[]>([]);
  const [blogEntries, setBlogEntries] = useState<any[]>([]);
  const [showAllBlogs, setShowAllBlogs] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 전체 게시물 데이터를 가져옵니다.
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  
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

  // Add to the existing useEffect or create a new one for YouTube entries
  useEffect(() => {
    const fetchYoutubeEntries = async () => {
      try {
        const { data, error } = await supabase
          .from("youtube_recommendations")
          .select("*")
          .order("display_order", { ascending: true });
          
        if (error) {
          console.error("Error fetching YouTube entries:", error);
        } else {
          setYoutubeEntries(data || []);
        }
      } catch (error) {
        console.error("Error in fetchYoutubeEntries:", error);
      }
    };
    
    fetchYoutubeEntries();
  }, []);

  // Add to the existing useEffect or create a new one for blog entries
  useEffect(() => {
    const fetchBlogEntries = async () => {
      try {
        const { data, error } = await supabase
          .from("blog_recommendations")
          .select("*")
          .order("display_order", { ascending: true });
          
        if (error) {
          console.error("Error fetching blog entries:", error);
        } else {
          setBlogEntries(data || []);
        }
      } catch (error) {
        console.error("Error in fetchBlogEntries:", error);
      }
    };
    
    fetchBlogEntries();
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

  useEffect(() => {
    // 모든 게시물 데이터를 가져옵니다.
    const fetchAllPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching posts:", error);
          return;
        }
        
        if (data) {
          setAllPosts(data);
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };
    
    fetchAllPosts();
  }, []);
  
  // 검색 함수
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    
    // 제목에 검색어가 포함된 게시물 필터링
    const results = allPosts.filter(post => 
      post.title.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
  };
  
  // 검색 입력 변경 핸들러
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    // 검색어가 없으면 검색 결과 초기화
    if (!e.target.value.trim()) {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full space-y-6 select-none border-l-2 border-gray-200 pl-4">
      {/* Author Profile - Always visible */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="flex flex-col items-center space-y-1.5 p-6">
          <Link href="/about">
            <Image
              src={aboutMeData?.profile_image_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
              alt="신원종"
              width={300}
              height={300}
              // 모서리 둥글기 조절: rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-3xl 등 사용 가능
              className="rounded-xl shadow-3xl mb-5 cursor-pointer" 
            />
          </Link>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-center">
          {/* <h3 className="text-lg font-medium mb-2">{aboutMeData?.name || "신원종"}</h3> */}
          {/* <p className="text-sm text-gray-600 mb-3">{aboutMeData?.title || "블로그 운영자"}</p> */}
          {/* <p className="text-sm text-gray-500 leading-relaxed">
            {aboutMeData?.introduction ? 
              (aboutMeData.introduction.length > 100 ? 
                `${aboutMeData.introduction.substring(0, 100)}...` : 
                aboutMeData.introduction) : 
              "프로필을 방문하여 더 자세한 정보를 확인하세요."}
          </p> */}
        </CardContent>
      </Card>

      {/* YouTube Links - Shows multiple entries */}
      {youtubeEntries.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="space-y-1.5 p-6">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              유튜브 영상
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {/* Display either all YouTube entries or just the first one based on showAllYoutube */}
            {(showAllYoutube ? youtubeEntries : youtubeEntries.slice(0, 1)).map((entry, index) => (
              <div key={entry.id || index} className="flex flex-col">
                <div className="aspect-video relative w-full overflow-hidden rounded-lg mb-3">
                  <Link href={entry.youtube_link} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={entry.thumbnail_url || '/images/youtube-placeholder.png'}
                      alt={entry.title || '유튜브 영상'}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-600 rounded-full p-3 opacity-80">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </Link>
                </div>
                {entry.title && (
                  <h3 className="text-sm font-medium">
                    <Link href={entry.youtube_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {entry.title}
                    </Link>
                  </h3>
                )}
              </div>
            ))}
            
            {/* Only show toggle button if there are more than 1 YouTube entry */}
            {youtubeEntries.length > 1 && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => setShowAllYoutube(!showAllYoutube)}
                >
                  {showAllYoutube ? "간략히 보기" : "전체 보기"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Blog Recommendations - Shows multiple entries */}
      {blogEntries.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="space-y-1.5 p-6">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              블로그
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {/* Display either all blog entries or just the first one based on showAllBlogs */}
            {(showAllBlogs ? blogEntries : blogEntries.slice(0, 1)).map((entry, index) => (
              <div key={entry.id || index} className="flex flex-col">
                <div className="aspect-video relative w-full overflow-hidden rounded-lg mb-3">
                  <Link href={entry.blog_link} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={entry.thumbnail_url || '/images/blog-placeholder.png'}
                      alt={entry.title || '블로그'}
                      fill
                      className="object-cover"
                    />
                  </Link>
                </div>
                {entry.title && (
                  <h3 className="text-sm font-medium">
                    <Link href={entry.blog_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {entry.title}
                    </Link>
                  </h3>
                )}
              </div>
            ))}
            
            {/* Only show toggle button if there are more than 1 blog entry */}
            {blogEntries.length > 1 && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => setShowAllBlogs(!showAllBlogs)}
                >
                  {showAllBlogs ? "간략히 보기" : "전체 보기"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Subscription - Always visible */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold">이메일로 새 글 받아보기</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
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

      {/* Search Section - Now positioned after email subscription */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Search className="h-5 w-5" />
            기사 검색
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSearch} className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="flex-grow"
              />
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
          
          {/* 검색 결과 표시 */}
          {isSearching && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">검색 결과 ({searchResults.length})</h3>
              {searchResults.length > 0 ? (
                <ul className="space-y-2">
                  {searchResults.map(post => (
                    <li key={post.id} className="text-sm">
                      <Link 
                        href={`/article/${post.id}`}
                        className="block p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                      >
                        <span className="line-clamp-2">{post.title}</span>
                        <span className="text-xs text-gray-500 block mt-1">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Posts - Always visible */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            최신 게시글
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {recentPosts && recentPosts.length > 0 ? (
            recentPosts.map((post, index) => (
              <div key={post.id || index} className="flex flex-col">
                <h3 className="text-sm font-medium">
                  <Link href={`/article/${post.id}`} className="hover:underline">
                    {post.title || `최신 게시물 ${index + 1}`}
                  </Link>
                </h3>
                {/* Content preview commented out */}
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

      {/* Most Viewed Posts - Always visible */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="space-y-1.5 p-6">
          <CardTitle className="text-xl font-semibold">조회수 순위</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
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
                {/* Content preview commented out */}
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

      {/* Recommended Books - 맨 아래에 배치 */}
      {recommendedBooks.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="space-y-1.5 p-6">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <BookOpenText className="h-5 w-5" />
              도서 추천
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {!recommendedBooks || recommendedBooks.length === 0 ? (
              <div className="text-sm text-muted-foreground">추천 도서가 없습니다.</div>
            ) : (
              <>
                {/* Display either all books or just the first one based on showAllBooks */}
                {(showAllBooks ? recommendedBooks : recommendedBooks.slice(0, 1)).map((book, index) => (
                  <div key={book.id || index} className="flex flex-col">
                    <div className="aspect-[2/3] relative w-full overflow-hidden rounded-lg mb-3">
                      <Image
                        src={book.image_url || '/images/book-placeholder.png'}
                        alt={book.title || '책 표지'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-sm font-medium">
                      <Link href={`/book/${book.id}`} className="hover:underline">
                        {book.title || `추천 도서 ${index + 1}`}
                      </Link>
                    </h3>
                    <div className="text-xs text-muted-foreground mt-1">
                      저자: {book.author || '작자미상'}
                    </div>
                  </div>
                ))}
                
                {/* Only show toggle button if there are more than 1 book */}
                {recommendedBooks.length > 1 && (
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline"
                      className="w-full text-sm"
                      onClick={() => setShowAllBooks(!showAllBooks)}
                    >
                      {showAllBooks ? "간략히 보기" : "전체 보기"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
