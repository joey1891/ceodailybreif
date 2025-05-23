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
import { PostgrestSingleResponse } from "@supabase/supabase-js";

export default function Home() {
  const [mainCategories] = useState(() => Array.from(getAllCategories()));
  const [categoryPosts, setCategoryPosts] = useState<Record<string, Post[]>>({});
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log("--- Starting fetchData ---");
      setIsLoading(true);
      try {
        console.log("Fetching data with mainCategories:", mainCategories);
        
        console.log("--- Calling fetchSlides and fetchAllPostsData ---"); // Added log
        
        console.log("--- Calling fetchSlides ---"); // Added log
        const slidesPromise = fetchSlides();
        console.log("--- Calling fetchAllPostsData ---"); // Added log
        const postsDataPromise = fetchAllPostsData();

        // Parallel data fetching with Promise.all
        const [slidesResult, postsData] = await Promise.all([
          slidesPromise,
          postsDataPromise
        ]);
        console.log("--- Promise.all completed ---"); // Added log
        
        console.log("Slides fetched:", slidesResult?.length || 0);
        console.log("Posts data fetched:", Boolean(postsData));
        
        setSlides(slidesResult || []);
        
        if (postsData) {
          setCategoryPosts(postsData.categoryPosts);
          setRecentPosts(postsData.recentPosts);
          setPopularPosts(postsData.popularPosts);
        }
      } catch (error: any) {
        console.error('[fetchData] 데이터 로딩 중 오류:', error);
      } finally {
        setIsLoading(false);
        console.log("Fetch complete, isLoading set to false");
      }
    };

    // Only fetch if we have categories to fetch for
    if (mainCategories && mainCategories.length > 0) {
      fetchData();
    } else {
      setIsLoading(false);
      console.log("No mainCategories, skipping fetch");
    }
  }, [mainCategories]);

  // Fetch slides using a dedicated function
  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, image_url, description, slide_order')
        .eq('is_slide', true)
        .eq('is_deleted', false)
        .order('slide_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching slides:', error);
      return [];
    }
  };

  // Consolidated posts data fetching
  const fetchAllPostsData = async () => {
    try {
      // Fetch category posts in parallel
      const categoryPostsData = await fetchCategoryPosts();
      
      // Get all posts by combining all category posts
      const allPosts = Object.values(categoryPostsData).flat();
      
      // Get recent posts (directly from DB instead of client-side filtering)
      const { data: recentPostsData } = await supabase
        .from("posts")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);
        
      // Get popular posts (directly from DB)
      const { data: popularPostsData } = await supabase
        .from("posts")
        .select("*")
        .eq("is_deleted", false)
        .order("viewcnt", { ascending: false })
        .limit(5);
      
      return {
        categoryPosts: categoryPostsData,
        recentPosts: recentPostsData || [],
        popularPosts: popularPostsData || []
      };
    } catch (error) {
      console.error("Error fetching posts data:", error);
      return {
        categoryPosts: {},
        recentPosts: [],
        popularPosts: []
      };
    }
  };

  // Fetch posts by category
  const fetchCategoryPosts = async () => {
    const posts: Record<string, Post[]> = {};

    try {
      console.log("--- Starting fetchCategoryPosts ---"); // Added log
      // Fetch posts for each category in parallel
      const fetchPromises = mainCategories.map(category => {
        console.log(`Fetching posts for category: ${category.slug} (${category.id})`); // Added log

        const fetchWithRetry = async (retries: number) => {
          try {
            const fetchPromise = supabase
              .from("posts")
              .select("*")
              .eq("category", category.id)
              .eq("is_deleted", false)
              .order("updated_at", { ascending: false })
              .limit(7);

            // Add a timeout to the fetch promise
            const timeoutPromise = new Promise<[]>( (_, reject) =>
              setTimeout(() => reject(new Error(`Fetch timeout for category ${category.slug}`)), 60000) // 60초 타임아웃
            );

            // Use Promise.race to race the fetch promise against the timeout promise
            const result = await Promise.race([fetchPromise, timeoutPromise]);

            // Check if the result is a Supabase response object
            if (result && typeof result === 'object' && ('data' in result || 'error' in result)) {
              const { data, error } = result as PostgrestSingleResponse<any[]>; // Cast to the expected type

              console.log(`Fetch result for category ${category.slug}:`, { data: data?.length, error }); // Added log
              if (error) {
                console.error(`Error fetching posts for category ${category.slug}:`, error); // Log specific category error
                throw error; // Throw to trigger retry
              }
              if (data) {
                posts[category.slug] = data;
              }
              return data || []; // Ensure data is returned even if empty
            } else {
              // This case should ideally not happen if timeout throws an error,
              // but as a fallback, handle unexpected results.
              console.error(`Unexpected result from Promise.race for category ${category.slug}:`, result);
              throw new Error(`Unexpected fetch result for category ${category.slug}`);
            }
          } catch (error: any) {
            if (retries > 0) {
              console.warn(`Retrying fetch for category ${category.slug}. Retries left: ${retries}`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
              return fetchWithRetry(retries - 1);
            } else {
              console.error(`Max retries reached for category ${category.slug}. Fetch failed:`, error);
              // Ensure this category's entry is an empty array if it failed after retries
              if (!posts[category.slug]) {
                posts[category.slug] = [];
              }
              throw error; // Re-throw error after max retries
            }
          }
        };

        return fetchWithRetry(3); // Retry up to 3 times
      });

      // Use Promise.allSettled to wait for all promises to settle (fulfilled or rejected)
      const results = await Promise.allSettled(fetchPromises);

      // Process results - errors are already handled within fetchWithRetry
      results.forEach((result, index) => {
        const category = mainCategories[index];
        if (result.status === 'fulfilled') {
          console.log(`Category ${category.slug} fetch fulfilled.`); // Added log
        } else {
          // This case is for errors that weren't caught and handled within fetchWithRetry,
          // or if fetchWithRetry re-threw after max retries.
          // The error is already logged within fetchWithRetry.
          console.log(`Category ${category.slug} fetch settled with rejection.`); // Added log
        }
      });

      console.log("--- fetchCategoryPosts completed ---"); // Added log
      return posts;
    } catch (error) {
      console.error("Error fetching category posts:", error);
      return {};
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
