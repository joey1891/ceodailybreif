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
  hideEmptyImageContainer?: boolean;
}

export default function SubCategoryList({ category, subcategories, subcategory, hideEmptyImageContainer }: SubCategoryListProps) {
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
        <div className="col-span-full py-8 text-center">
          이 카테고리에 게시물이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Link href={`/article/${post.id}`} key={post.id}>
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                {post.image_url ? (
                  <div className="w-full flex justify-center items-center bg-gray-100 p-2" style={{height: "200px"}}>
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
          ))}
        </div>
      )}
    </div>
  );
}