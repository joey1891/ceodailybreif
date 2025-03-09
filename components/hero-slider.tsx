"use client";

import { useEffect, useState, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import type { CarouselApi } from "@/components/ui/carousel";

// 타입 정의로 코드 안정성 향상
type SlideArticle = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  description?: string;
};

export function HeroSlider() {
  const [slideArticles, setSlideArticles] = useState<SlideArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    const fetchSlideArticles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 슬라이드 포스트 가져오기
        const { data, error } = await supabase
          .from("posts")
          .select("id, title, content, image_url, is_slide")
          .eq("is_slide", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching slide articles:", error.message);
          setError(error.message);
          return;
        }

        // console.log("Slides data:", data);
        
        // // 데이터가 없는 경우 처리
        // if (!data || data.length === 0) {
        //   console.log("No slide articles found");
        //   setSlideArticles([]);
        //   return;
        // }

        // 설명 생성 및 데이터 정제 - 텍스트 클리닝 개선
        const articlesWithDescription = data.map(article => {
          // 콘텐츠가 없는 경우 처리
          if (!article.content) {
            return {
              ...article,
              description: "Read more about this article"
            };
          }
          
          // HTML 태그 제거 및 텍스트 정리
          let cleanText = article.content
            .replace(/<[^>]+>/g, " ") // HTML 태그 제거
            .replace(/&nbsp;/g, " ")  // &nbsp; 처리
            .replace(/\s+/g, " ")     // 연속된 공백 제거
            .trim();                  // 앞뒤 공백 제거
          
          // 적절한 길이로 자르기
          const maxLength = 150;
          const description = cleanText.length > maxLength
            ? cleanText.substring(0, maxLength) + "..."
            : cleanText;
            
          return {
            ...article,
            description
          };
        });
        
        setSlideArticles(articlesWithDescription);
      } catch (error) {
        console.error("Unexpected error in fetchSlideArticles:", error);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlideArticles();
  }, []);

  useEffect(() => {
    if (!api) return;
    
    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };
    
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-xl text-gray-500">Loading slides...</div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-xl text-red-500">Error loading slides: {error}</div>
      </div>
    );
  }

  // 슬라이드가 없는 경우 표시
  if (slideArticles.length === 0) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-xl text-gray-500 mb-4">No featured slides available</div>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden max-w-full">
      <div className="w-full max-w-full relative overflow-hidden">
        <Carousel 
          className="w-full max-w-full overflow-hidden"
          opts={{
            loop: true,
          }}
          setApi={setApi}
        >
          <CarouselContent>
            {slideArticles.map((article) => (
              <CarouselItem key={article.id} className="max-w-full">
                <div className="relative h-[500px] w-full overflow-hidden rounded-lg max-w-full">
                  {/* 배경 이미지 영역 */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: article.image_url 
                        ? `url(${article.image_url})` 
                        : 'linear-gradient(to right, #4f46e5, #818cf8)' 
                    }}
                  >
                    <div className="absolute inset-0 bg-black/50" />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {slideArticles.length > 1 && (
            <>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </>
          )}
        </Carousel>
        {slideArticles.length > 0 && (
          <Link href={`/article/${slideArticles[currentSlide]?.id}`}>
            <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10 w-full bg-gradient-to-t from-black/80 to-transparent cursor-pointer hover:bg-black/70 transition-colors">
              <h2 className="text-xl md:text-3xl font-bold text-white mb-2">
                {slideArticles[currentSlide]?.title}
              </h2>
              <p className="text-sm md:text-base text-white/80 line-clamp-2">
                {slideArticles[currentSlide]?.description}
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
