"use client";

import { useEffect, useState } from "react";
import { Post } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { getPostsByCategory } from '@/lib/supabase/categories';
import { getCategoryById, CategoryItem } from '@/lib/category-loader';
import { getCategoryUrl } from '@/lib/routes';

interface SubCategoryPreviewProps {
  mainCategory: string; // 예: "economic-trends"
  subCategory: string;  // 예: "medical"
  limit?: number;       // 기본 3
  /** 기본적으로 부모에서 showViewAll 옵션을 넘기더라도,  
      여기서 fetch한 결과에 따라 3개 이상일 때만 버튼을 보이게 처리 */
  showViewAll?: boolean;
}

export default function SubCategoryPreview({
  mainCategory,
  subCategory,
  limit = 3,
  showViewAll = false,
}: SubCategoryPreviewProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldShowViewAll, setShouldShowViewAll] = useState<boolean>(false);

  // 카테고리 정보 가져오기
  const mainCategoryData = getCategoryById(mainCategory);
  const subcategoryData = mainCategoryData?.subcategories?.find(sub => sub.slug === subCategory);

  useEffect(() => {
    const fetchSubPosts = async () => {
      setLoading(true);
      // limit+1 개를 가져와서 실제 게시물 수가 limit 이상인지 판단
      const data = await getPostsByCategory({
        mainCategory,
        subCategory,
        limit: limit + 1,
        orderBy: "updated_at",
        ascending: false
      });

      if (data) {
        // 만약 data.length가 limit+1 이상이면 게시물이 limit개 이상 존재하는 것으로 판단
        if (data.length > limit) {
          setShouldShowViewAll(true);
          // 화면에는 limit 개만 보여줌
          setPosts(data.slice(0, limit));
        } else {
          setShouldShowViewAll(false);
          setPosts(data);
        }
      }
      setLoading(false);
    };

    fetchSubPosts();
  }, [mainCategory, subCategory, limit]);

  if (loading) {
    return <p>Loading subcategory posts...</p>;
  }

  if (posts.length === 0) {
    // 게시물이 없을 때: 가운데 정렬 + 흐린 텍스트
    return (
      <div className="text-center text-muted-foreground mt-4">
        No articles in this subcategory.
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {typeof subcategoryData?.title === 'string' 
            ? subcategoryData.title 
            : subcategoryData?.title?.ko || subCategory}
        </h2>
        {shouldShowViewAll && showViewAll && (
          <Link
            href={getCategoryUrl(mainCategory, subCategory)}
            className="text-blue-500 text-sm font-medium hover:underline"
          >
            View All
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link href={`/article/${post.id}`} key={post.id}>
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                {post.image_url ? (
                  <div className="w-full flex justify-center items-center bg-gray-100 p-2" style={{ height: "200px" }}>
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="max-w-full max-h-[180px] object-contain"
                    />
                  </div>
                ) : null}
                <div className={`p-4 flex-grow flex flex-col ${!post.image_url ? 'justify-center py-5' : ''}`}>
                  <h3 className={`text-lg font-semibold mb-1 line-clamp-2 ${!post.image_url ? 'text-center' : ''}`}>
                    {post.title}
                  </h3>
                  <div className={`text-sm text-gray-600 line-clamp-3 ${!post.image_url ? 'text-center' : ''}`}>
                    {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </div>
                  <div className={`text-xs text-gray-500 mt-2 ${!post.image_url ? 'text-center' : ''}`}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-8 text-center">
            이 카테고리에 게시물이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
