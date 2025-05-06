"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeroSlider } from "@/components/hero-slider";
import { ArticlesSection } from "@/components/ArticlesSection";
import { FinanceInfo } from "@/components/finance-info";
import { Sidebar } from "@/components/sidebar";
import { CalendarSection } from "@/components/calendar-section";
import { getAllCategories } from "@/lib/category-loader";
import { Post } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import PopupDisplay from "@/components/popup-display";

export default function Home() {
  // mainCategories를 컴포넌트가 마운트될 때 한 번만 생성
  const [mainCategories] = useState(() => Array.from(getAllCategories()));
  const [categoryPosts, setCategoryPosts] = useState<Record<string, Post[]>>({});
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  // 기존 카테고리 게시물 가져오는 로직
  const fetchCategoryPosts = async () => {
    const posts: Record<string, Post[]> = {};
    let allPosts: Post[] = [];

    try {
      // 각 카테고리별 게시물 가져오기
      const fetchPromises = mainCategories.map(category => {
        return supabase
          .from("posts")
          .select("*")
          .eq("category", category.id)
          .eq("is_deleted", false)
          .order("updated_at", { ascending: false })
          .limit(7)
          .then(({ data, error }) => {
            if (error) throw error;
            if (data) {
              posts[category.slug] = data;
              allPosts = [...allPosts, ...data];
            }
            return data;
          });
      });
      
      // 모든 프로미스가 완료될 때까지 기다림
      await Promise.all(fetchPromises);
      return { posts, allPosts };
    } catch (error) {
      console.error("Error fetching category posts:", error);
      // 에러가 발생해도 빈 데이터를 반환하여 UI가 렌더링되도록 함
      return { posts: {}, allPosts: [] };
    }
  };

  useEffect(() => {
    // 슬라이드 데이터 가져오기
    const fetchSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, image_url, description, slide_order')
          .eq('is_slide', true)
          .eq('is_deleted', false) // 삭제된 슬라이드 제외
          .order('slide_order', { ascending: true });
        
        if (error) throw error;
        setSlides(data || []);
      } catch (error: any) {
        console.error('슬라이더 데이터를 가져오는 중 오류 발생:', error);
        // 에러 객체의 더 자세한 정보 로깅
        console.error('에러 세부 정보:', {
          message: error.message || 'Unknown error',
          stack: error.stack || 'No stack trace',
          name: error.name || 'Unknown error type'
        });
        setSlides([]);
      }
    };
    
    // 기사 데이터 가져오기 - Promise 체이닝 사용
    const fetchPosts = async () => {
      try {
        const { posts, allPosts } = await fetchCategoryPosts();
        setCategoryPosts(posts);
        
        // 안전한 데이터 처리를 위한 보호 코드 추가
        try {
          // 최신글 5개 추출 - 날짜 처리 강화
          const recent = [...allPosts]
            .filter(post => post && post.created_at) // 날짜가 없는 항목 필터링
            .sort((a, b) => {
              try {
                // 더 안전한 날짜 파싱 - 유효하지 않은 날짜 처리
                const dateA = parseDate(a.created_at);
                const dateB = parseDate(b.created_at);
                return dateB - dateA;
              } catch (err) {
                console.warn("날짜 파싱 오류:", err, { a: a.created_at, b: b.created_at });
                return 0; // 비교 불가능한 경우 순서 유지
              }
            })
            .slice(0, 5);
          setRecentPosts(recent);
        } catch (sortError: any) {
          console.error('최신글 정렬 중 오류:', sortError);
          setRecentPosts([]);
        }
        
        try {
          // 인기글 5개 추출
          const popular = [...allPosts]
            .sort((a, b) => ((b.viewcnt || 0) - (a.viewcnt || 0)))
            .slice(0, 5);
          setPopularPosts(popular);
        } catch (sortError: any) {
          console.error('인기글 정렬 중 오류:', sortError);
          setPopularPosts([]);
        }
      } catch (error: any) {
        console.error('기사 데이터를 가져오는 중 오류 발생:', error);
        // 에러 발생 시 빈 배열로 상태 설정
        setCategoryPosts({});
        setRecentPosts([]);
        setPopularPosts([]);
      }
    };
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 각 fetch 함수를 개별적으로 실행하고 에러 처리
        try {
          await fetchSlides();
        } catch (slideError: any) {
          console.error('슬라이드 로딩 중 오류:', slideError);
          // 에러 객체의 더 자세한 정보 로깅
          console.error('에러 세부 정보:', {
            message: slideError.message || 'Unknown error',
            stack: slideError.stack || 'No stack trace',
            name: slideError.name || 'Unknown error type'
          });
          setSlides([]);
        }
        
        try {
          await fetchPosts();
        } catch (postsError: any) {
          console.error('게시물 로딩 중 오류:', postsError);
          console.error('에러 세부 정보:', {
            message: postsError.message || 'Unknown error',
            stack: postsError.stack || 'No stack trace', 
            name: postsError.name || 'Unknown error type'
          });
        }
      } catch (error: any) {
        // 최후의 에러 처리
        console.error('데이터 로딩 중 치명적 오류:', error);
      } finally {
        // 항상 로딩 상태 해제
        setIsLoading(false);
      }
    };

    fetchData();
  }, [mainCategories]);

  // 날짜 문자열을 파싱하여 타임스탬프로 변환하는 함수
  const parseDate = (dateString: string): number => {
    try {
      // ISO 형식 날짜를 정확히 파싱
      const date = new Date(dateString);
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        console.warn(`유효하지 않은 날짜 형식: ${dateString}`);
        return 0;
      }
      
      return date.getTime();
    } catch (error) {
      // 날짜를 파싱할 수 없음 - 기본값 반환
      console.warn(`유효하지 않은 날짜 형식: ${dateString}`);
      return 0;
    }
  };

  return (
    <>
      <PopupDisplay />
      <main className="min-h-screen bg-white overflow-x-hidden max-w-full overflow-guard">
        {isLoading ? (
          // 로딩 중일 때 표시할 UI (예: 스피너 또는 로딩 메시지)
          <div className="flex justify-center items-center h-screen">
            <p>로딩 중...</p> {/* 간단한 로딩 메시지 */}
          </div>
        ) : (
          // 로딩 완료 시 실제 콘텐츠 표시
          <>
            {/* Hero Slider - 슬라이드 데이터 전달 */}
            <section className="mb-12 w-full max-w-full overflow-x-hidden">
              <HeroSlider slides={slides} />
            </section>

            {/* 나머지 섹션들에 max-width 제약 추가 */}
            <section className="mb-12 container-mobile max-w-full">
              <div className="flex flex-col lg:flex-row gap-6 md:gap-8 max-w-full">
                {/* Main Content */}
                <ArticlesSection
                  mainCategories={mainCategories}
                  categoryPosts={categoryPosts}
                />

                {/* Sidebar */}
                <div className="w-full lg:w-1/3">
                  <Sidebar
                    recentPosts={recentPosts}
                    popularPosts={popularPosts}
                  />
                </div>
              </div>
            </section>

            {/* Finance & Calendar 섹션도 동일하게 제약 추가 */}
            <section className="mb-12 container-mobile max-w-full">
              <FinanceInfo />
            </section>

            <section className="container-mobile max-w-full">
              <CalendarSection />
            </section>
          </>
        )}
      </main>
    </>
  );
}
