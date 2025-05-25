"use client";

import { useState } from "react";
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
import { getAllCategories } from "@/lib/category-loader"; // Category type { id: string, slug: string, ... }
import { Post } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import PopupDisplay from "@/components/popup-display";
import useSWR from 'swr';
import { useQuery } from '@supabase-cache-helpers/postgrest-swr';

// Helper function to fetch category posts for useSWR
// This function is defined outside the component to maintain a stable reference
const fetchCategoryPostsSWR = async (
  categories: { id: string; slug: string }[],
  supabaseClient: typeof supabase
): Promise<Record<string, Post[]>> => {
  if (!categories || categories.length === 0) {
    return {};
  }
  const postsBySlug: Record<string, Post[]> = {};
  const fetchPromises = categories.map(category =>
    supabaseClient
      .from("posts")
      .select("*") // Fetches all columns to match the Post type
      .eq("category", category.id)
      .eq("is_deleted", false)
      .eq("status", "published") // <--- 'status'가 'published'인 게시물만 선택
      .order("updated_at", { ascending: false })
      .limit(7)
      .then(({ data, error }) => {
        if (error) {
          console.error(`Error fetching posts for category ${category.slug}:`, error);
          throw error; // Propagate error to Promise.all
        }
        postsBySlug[category.slug] = (data as Post[]) || [];
      })
  );
  
  await Promise.all(fetchPromises);
  return postsBySlug;
};

export default function Home() {
  const [mainCategories] = useState(() => Array.from(getAllCategories()));

  // Fetch slides using useQuery from supabase-cache-helpers
  const {
    data: slidesData,
    isLoading: isLoadingSlides,
    error: errorSlides,
  } = useQuery(
    supabase
      .from('posts')
      .select('*') // Select all fields to match Post type
      .eq('is_slide', true)
      .eq('is_deleted', false)
      .eq('status', 'published') // <--- 'status'가 'published'인 게시물만 선택
      .order('slide_order', { ascending: true }),
    { revalidateOnFocus: false } // SWR options
  );
  const slides: Post[] = slidesData || [];

  // Fetch recent posts using useQuery
  const {
    data: recentPostsData,
    isLoading: isLoadingRecent,
    error: errorRecent,
  } = useQuery(
    supabase
      .from("posts")
      .select("*")
      .eq("is_deleted", false)
      .eq("status", "published") // <--- 'status'가 'published'인 게시물만 선택
      .order("created_at", { ascending: false })
      .limit(5),
    { revalidateOnFocus: false }
  );
  const recentPosts: Post[] = recentPostsData || [];

  // Fetch popular posts using useQuery
  const {
    data: popularPostsData,
    isLoading: isLoadingPopular,
    error: errorPopular,
  } = useQuery(
    supabase
      .from("posts")
      .select("*")
      .eq("is_deleted", false)
      .eq("status", "published") // <--- 'status'가 'published'인 게시물만 선택
      .order("viewcnt", { ascending: false })
      .limit(5),
    { revalidateOnFocus: false }
  );
  const popularPosts: Post[] = popularPostsData || [];

  // Fetch category posts using useSWR with the custom fetcher
  // Create a stable key based on category IDs
  const categoryIdsKey = mainCategories.length > 0 
    ? mainCategories.map(c => c.id).sort().join('-') 
    : null;

  const {
    data: categoryPostsData,
    isLoading: isLoadingCategoryPosts,
    error: errorCategoryPosts,
  } = useSWR(
    // The key for SWR. If null, SWR will not fetch.
    categoryIdsKey ? ['category_posts', categoryIdsKey] : null,
    // Fetcher function
    () => fetchCategoryPostsSWR(mainCategories, supabase),
    { revalidateOnFocus: false }
  );
  const categoryPosts: Record<string, Post[]> = categoryPostsData || {};
  
  // Combined loading state
  const isLoading = isLoadingSlides || 
                    isLoadingRecent || 
                    isLoadingPopular || 
                    (mainCategories.length > 0 && isLoadingCategoryPosts);

  // Combined error state
  const combinedError = errorSlides || errorRecent || errorPopular || (mainCategories.length > 0 && errorCategoryPosts);

  // Early return for error state
  if (combinedError) {
    console.error("Data fetching error:", combinedError);
    // You might want to render a more user-friendly error message here
    return (
      <div className="flex justify-center items-center h-screen">
        <p>데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <>
      <PopupDisplay />
      <main className="min-h-screen bg-white overflow-x-hidden max-w-full overflow-guard">
        {isLoading ? (
          <div className="flex justify-center items-center h-screen">
            <p>로딩 중...</p>
          </div>
        ) : (
          <>
            <section className="mb-12 w-full max-w-full overflow-x-hidden">
              <HeroSlider slides={slides} />
            </section>

            <section className="mb-12 container-mobile max-w-full">
              <div className="flex flex-col lg:flex-row gap-6 md:gap-8 max-w-full">
                <ArticlesSection
                  mainCategories={mainCategories}
                  categoryPosts={categoryPosts}
                />
                <div className="w-full lg:w-1/3">
                  <Sidebar
                    recentPosts={recentPosts}
                    popularPosts={popularPosts}
                  />
                </div>
              </div>
            </section>

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
