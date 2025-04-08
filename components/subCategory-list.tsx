"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar } from "lucide-react";
import { Post } from "@/types/supabase";
import Link from "next/link";
import { getCategoryUrl } from '@/lib/routes';
import { getPostsByCategory } from '@/lib/supabase/categories';
import { getCategoryById, CategoryItem } from '@/lib/category-loader';

interface SubCategoryListProps {
  category: string;
  subcategories: string[] | { id: string; title: { ko: string; en: string; }; slug: string; }[];
  subcategory?: string;
}

export default function SubCategoryList({ category, subcategories, subcategory }: SubCategoryListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 카테고리 정보 가져오기
  const categoryData = getCategoryById(category);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!category || !subcategories) return;
      
      setLoading(true);
      
      // 서브카테고리 슬러그 배열로 변환
      const subcategorySlugs = Array.isArray(subcategories) 
        ? subcategories.map(sub => typeof sub === 'string' ? sub : sub.slug)
        : [];
      
      const data = await getPostsByCategory({
        mainCategory: category,
        subCategory: subcategorySlugs,
        orderBy: "updated_at",
        ascending: false
      });
      
      setPosts(data);
      setLoading(false);
    };

    fetchPosts();
  }, [category, subcategories]);

  // 서브카테고리 제목 가져오기
  const getSubcategoryTitles = () => {
    if (!Array.isArray(subcategories)) {
      return category;
    }
    
    return subcategories.map(sub => {
      if (typeof sub === 'string') {
        // 문자열인 경우 카테고리 ID에서 찾기
        const categoryItem = getCategoryById(sub);
        return categoryItem?.title.ko || sub;
      }
      return sub.title.ko;
    }).join(" in ");
  };

  if (!subcategories || !Array.isArray(subcategories) || subcategories.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          {categoryData?.title.ko || category || "카테고리"}
        </h1>
        <p>서브 카테고리를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">
        {getSubcategoryTitles()}
      </h1>
      {loading ? (
        <p>Loading reports...</p>
      ) : posts.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
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
      )}
    </div>
  );
}
