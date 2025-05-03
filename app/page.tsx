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

    // 각 카테고리별 게시물 가져오기
    const fetchPromises = mainCategories.map(category => {
      return supabase
        .from("posts")
        .select("*")
        .eq("category", category.id)
        .eq("is_deleted", false) // 삭제된 게시물 제외
        .order("updated_at", { ascending: false })
        .limit(7)
        .then(({ data }) => {
          if (data) {
            posts[category.slug] = data;
            allPosts = [...allPosts, ...data];
          }
        })
        .then(undefined, error => {
          console.error(`Error fetching posts for category ${category.id}:`, error);
        });
    });
    
    // 모든 프로미스가 완료될 때까지 기다림
    return Promise.all(fetchPromises).then(() => {
      return { posts, allPosts };
    });
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
      } catch (error) {
        console.error('슬라이더 데이터를 가져오는 중 오류 발생:', error);
        setSlides([]);
      }
    };
    
    // 기사 데이터 가져오기 - Promise 체이닝 사용
    const fetchPosts = () => {
      fetchCategoryPosts().then(({ posts, allPosts }) => {
        setCategoryPosts(posts);
        
        // 모든 카테고리 게시물에서 최신글 5개 추출
        const recent = [...allPosts]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentPosts(recent);
        
        // 모든 카테고리 게시물에서 조회수 높은 글 5개 추출
        const popular = [...allPosts]
          .sort((a, b) => (b.viewcnt || 0) - (a.viewcnt || 0))
          .slice(0, 5);
        setPopularPosts(popular);
      }).catch(error => {
        console.error('기사 데이터를 가져오는 중 오류 발생:', error);
      });
    };
    
    const fetchData = async () => {
      setIsLoading(true); // 데이터 로딩 시작 시 로딩 상태 true 설정
      try {
        await Promise.all([
          fetchSlides(),
          fetchPosts()
        ]);
      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
      } finally {
        setIsLoading(false); // 데이터 로딩 완료 시 로딩 상태 false 설정
      }
    };

    fetchData();
  }, [mainCategories]);

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
