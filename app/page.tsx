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
import { categoryOptions } from "@/lib/category-options";
import { Post } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import PopupDisplay from "@/components/popup-display";

export default function Home() {
  // mainCategories를 컴포넌트가 마운트될 때 한 번만 생성
  const [mainCategories] = useState(() => Array.from(categoryOptions.values()));
  const [categoryPosts, setCategoryPosts] = useState<Record<string, Post[]>>({});
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {
    // 슬라이드 데이터 가져오기
    const fetchSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, image_url, description, slide_order')
          .eq('is_slide', true)
          .order('slide_order', { ascending: true });  // 슬라이드 순서로 정렬
        
        if (error) throw error;
        setSlides(data || []);
      } catch (error) {
        console.error('슬라이더 데이터를 가져오는 중 오류 발생:', error);
        setSlides([]);
      }
    };
    
    fetchSlides();
    
    // 기존 카테고리 게시물 가져오는 로직
    const fetchCategoryPosts = async () => {
      const posts: Record<string, Post[]> = {};
      let allPosts: Post[] = [];

      for (const [key, mainCat] of categoryOptions) {
        // Report 등 href가 정의되어 있다면 우선 사용
        const mainPath = mainCat.href
          ? mainCat.href.replace(/^\//, "")
          : mainCat.base
          ? mainCat.base?.replace(/^\//, "")
          : mainCat.title.toLowerCase().replace(/\s+/g, "-");

        // 하위 카테고리 slug 추출
        const subcategorySlugs = mainCat.items?.map((item) => item.slug).filter(slug => slug !== undefined) || [];
        
        const { data, error } = await supabase
          .from("posts")
          .select("*, subcategory")
          .eq("category", mainPath)
          .order("updated_at", { ascending: false })
          .limit(10); // 10개로 변경

        if (!error && data) {
          posts[mainPath] = data;
          allPosts = [...allPosts, ...data];
        }
      }

      setCategoryPosts(posts);
      
      // 모든 카테고리 게시물에서 최신글 5개 추출
      const recent = [...allPosts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentPosts(recent);
      
      // 모든 카테고리 게시물에서 조회수 높은 글 5개 추출
      const popular = [...allPosts]
        .sort((a, b) => (b.viewcnt || 0) - (a.viewcnt || 0)) // 조회수 내림차순 정렬
        .slice(0, 5);
      setPopularPosts(popular);
    };

    fetchCategoryPosts();
  }, [mainCategories]);

  return (
    <>
      <PopupDisplay />
      <main className="min-h-screen bg-white overflow-x-hidden max-w-full overflow-guard">
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
      </main>
    </>
  );
}
