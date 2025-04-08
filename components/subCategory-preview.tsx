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
    <div>
      {/* 게시물이 1개 이상 있을 때만, 그리고 shouldShowViewAll가 true일 때만 버튼 표시 */}
      {shouldShowViewAll && showViewAll && (
        <div className="mb-2 text-right">
          <Link
            href={getCategoryUrl(mainCategory, subCategory)}
            className="text-blue-500 hover:underline"
          >
            View All
          </Link>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/article/${post.id}`}>
            <Card className="cursor-pointer hover:shadow-xl transition-shadow">
              {post.image_url && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg md:text-xl">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {post.content.replace(/<[^>]+>/g, "").slice(0, 100)}...
                </p>
              </CardContent>
              <div className="flex items-center text-sm text-muted-foreground p-4 pt-0">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date(post.updated_at || post.created_at).toLocaleDateString()}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
