"use client";

import { useEffect, useState } from "react";
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

        // 설명 생성 및 데이터 정제
        const articlesWithDescription = data.map(article => ({
          ...article,
          description: article.content 
            ? article.content.replace(/<[^>]+>/g, "").substring(0, 150) + "..."
            : "Read more about this article"
        }));
        
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
        <Carousel className="w-full max-w-full overflow-hidden">
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

                  {/* 슬라이드 내부 텍스트 제약 추가 */}
                  <div className="relative h-full flex flex-col justify-center px-6 md:px-12 text-white max-w-full">
                    <h2 className="text-2xl md:text-4xl font-bold mb-4 break-words">{article.title}</h2>
                    <p className="text-lg md:text-xl mb-8 text-gray-300 break-words">{article.description}</p>
                    <Button asChild className="w-fit" variant="outline">
                      <Link href={`/article/${article.id}`}>
                        자세히 보기 <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
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
      </div>
    </div>
  );
}
