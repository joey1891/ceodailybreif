"use client";

import { useState } from "react"; // useEffect 제거
import useSWR from 'swr'; // SWR 훅 임포트
import { createBrowserClient } from '@supabase/ssr'; // Supabase 클라이언트 임포트
import { Post } from "@/types/supabase"; // Post 타입 임포트
import { getAllCategories } from "@/lib/category-loader"; // getAllCategories 임포트

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
import PopupDisplay from "@/components/popup-display";


// Supabase 클라이언트 인스턴스 생성 (lib/supabase.ts와 동일하게)
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export default function Home() {
  const [mainCategories] = useState(() => Array.from(getAllCategories()));

  // SWR 훅을 사용하여 슬라이드 데이터 가져오기
  const { data: slides, error: slidesError, isLoading: isLoadingSlides } = useSWR(
    'slides', // 캐시 키
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, image_url, description, slide_order')
        .eq('is_slide', true)
        .eq('is_deleted', false)
        .order('slide_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  );

  // SWR 훅을 사용하여 최근 게시물 데이터 가져오기
  const { data: recentPosts, error: recentPostsError, isLoading: isLoadingRecentPosts } = useSWR(
    'recentPosts', // 캐시 키
    async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  );

  // SWR 훅을 사용하여 인기 게시물 데이터 가져오기
  const { data: popularPosts, error: popularPostsError, isLoading: isLoadingPopularPosts } = useSWR(
    'popularPosts', // 캐시 키
    async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_deleted", false)
        .order("viewcnt", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  );

  // 각 카테고리별 게시물을 가져오기 위한 SWR 훅 (동적으로 생성)
  const categoryPostsResults = mainCategories.map(category => {
    const { data, error, isLoading } = useSWR(
      `categoryPosts-${category.slug}`, // 카테고리 slug를 포함한 캐시 키
      async () => {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("category", category.id)
          .eq("is_deleted", false)
          .order("updated_at", { ascending: false })
          .limit(7);
        
        if (error) throw error;
        return data || [];
      }
    );
    return { category, data, error, isLoading };
  });

  // 모든 데이터 로딩 상태 확인
  const isLoading = isLoadingSlides || isLoadingRecentPosts || isLoadingPopularPosts || categoryPostsResults.some(res => res.isLoading);

  // 카테고리별 게시물 데이터를 객체 형태로 변환
  const categoryPosts: Record<string, Post[]> = {};
  categoryPostsResults.forEach(res => {
    if (res.data) {
      categoryPosts[res.category.slug] = res.data;
    }
  });

  // 에러 처리 (필요에 따라 더 상세하게 처리 가능)
  if (slidesError || recentPostsError || popularPostsError || categoryPostsResults.some(res => res.error)) {
    console.error("Error fetching data:", slidesError || recentPostsError || popularPostsError || categoryPostsResults.find(res => res.error)?.error);
    // 에러 메시지를 표시하거나 다른 에러 처리 UI를 렌더링할 수 있습니다.
    return <div>데이터 로딩 중 오류가 발생했습니다.</div>;
  }


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
              <HeroSlider slides={slides || []} /> {/* slides가 undefined일 경우 빈 배열 전달 */}
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
                    recentPosts={recentPosts || []} // recentPosts가 undefined일 경우 빈 배열 전달
                    popularPosts={popularPosts || []} // popularPosts가 undefined일 경우 빈 배열 전달
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
