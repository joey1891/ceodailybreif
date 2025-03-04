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
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import { FinanceInfo } from "@/components/finance-info";
import { CalendarSection } from "@/components/calendar-section";
import { Sidebar } from "@/components/Sidebar";
import { categoryOptions } from "@/lib/category-options";
import { ArticlesSection } from "@/components/ArticlesSection";

export default function Home() {
  // mainCategories를 컴포넌트가 마운트될 때 한 번만 생성
  const [mainCategories] = useState(() => Array.from(categoryOptions.values()));
  const [categoryPosts, setCategoryPosts] = useState<Record<string, Post[]>>({});
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);

  useEffect(() => {
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
      const popular = [...allPosts];
      // 랜덤으로 섞기
      for (let i = popular.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [popular[i], popular[j]] = [popular[j], popular[i]];
      }
      setPopularPosts(popular.slice(0, 5));
    };

    fetchCategoryPosts();
  }, [mainCategories]);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Slider */}
      <section className="mb-12 -mx-4 lg:-mx-8">
        <HeroSlider />
      </section>

      {/* Articles Section with Sidebar */}
      <section className="mb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <ArticlesSection
            mainCategories={mainCategories}
            categoryPosts={categoryPosts}
          />

          {/* Sidebar - 최신글 및 인기글 전달 */}
          <div className="w-full lg:w-1/3">
            <Sidebar 
              recentPosts={recentPosts} 
              popularPosts={popularPosts}
            />
          </div>
        </div>
      </section>

      {/* Finance Info Section */}
      <section className="mb-12">
        <FinanceInfo />
      </section>

      {/* Calendar Section */}
      <section>
        <CalendarSection />
      </section>
    </main>
  );
}
