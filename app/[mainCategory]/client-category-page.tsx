"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import Link from "next/link";
import AdminNewPostButton from "./admin-new-post-button";
import Image from "next/image";

interface Subcategory {
  id: string;
  title: string | { ko: string; en: string };
  slug: string;
}

// 이미지 URL 유효성 검증 및 처리 함수
const getValidImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // 빈 문자열 체크
  if (url.trim() === '') return null;
  
  // 절대/상대 URL 처리
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  
  return url;
};

// HTML에서 이미지 URL 추출 함수
const extractImageFromContent = (content: string | null): string | null => {
  if (!content) return null;
  const match = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return match ? getValidImageUrl(match[1]) : null;
};

export default function ClientCategoryPage({ 
  category, 
  categoryTitle
}: { 
  category: any;
  categoryTitle: string;
}) {
  const [mainPosts, setMainPosts] = useState<Post[]>([]);
  const [subcategoryPosts, setSubcategoryPosts] = useState<Record<string, Post[]>>({});
  const [loading, setLoading] = useState(true);
  const [showMoreMain, setShowMoreMain] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Post display configuration
  const postsPerInitialView = 3;
  const postsPerExpandedView = 9;
  const postsPerPage = 9;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      console.log(`Fetching posts for category: ${category.id}`);
      
      // 메인 카테고리 글 가져오기 (is_deleted, is_draft 필터 추가)
      const { data: mainCategoryPosts, error: mainError } = await supabase
        .from("posts")
        .select("*")
        .eq("category", category.id)
        .eq("is_deleted", false)
        .eq("is_draft", false)
        .order("updated_at", { ascending: false });
      
      if (mainError) {
        console.error("Error fetching main posts:", mainError);
      }
      
      setMainPosts(mainCategoryPosts || []);
      
      // 서브카테고리가 있는 경우 서브카테고리별 글 가져오기
      if (category.subcategories && category.subcategories.length > 0) {
        const subcatData: Record<string, Post[]> = {};
        
        for (const subcat of category.subcategories) {
          const { data: subcatPosts, error: subcatError } = await supabase
            .from("posts")
            .select("*")
            .eq("subcategory", subcat.id)
            .eq("is_deleted", false)
            .eq("is_draft", false)
            .order("updated_at", { ascending: false })
            .limit(3);
          
          if (subcatError) {
            console.error(`Error fetching posts for subcategory ${subcat.id}:`, subcatError);
          }
          
          subcatData[subcat.id] = subcatPosts || [];
        }
        
        setSubcategoryPosts(subcatData);
      }
      
      setLoading(false);
    };

    fetchPosts();
  }, [category.id, category.subcategories]);

  // 페이지네이션 계산
  const totalMainPosts = mainPosts.length;
  const totalPages = Math.ceil(totalMainPosts / postsPerPage);
  
  // 현재 표시할 메인 포스트 결정
  const visibleMainPosts = showMoreMain 
    ? mainPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
    : mainPosts.slice(0, postsPerInitialView);

  // 포스트 카드 렌더링 함수
  const renderPostCard = (post: Post) => {
    // 이미지 URL 가져오기 (우선순위: post.image_url -> 본문에서 첫 이미지 추출)
    const imageUrl = getValidImageUrl(post.image_url) || extractImageFromContent(post.content);
    
    return (
      <Card key={post.id} className="h-full flex flex-col">
        {/* 이미지 섹션 추가 */}
        {imageUrl && (
          <div className="relative w-full pt-[56.25%] bg-gray-100">
            <Image
              src={imageUrl}
              alt={post.title || "게시글 이미지"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover"
              onError={(e) => {
                console.error(`이미지 로드 오류: ${imageUrl}`);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <CardHeader className="pb-2">
          <Link href={`/article/${post.id}`} className="hover:underline">
            <CardTitle className="text-lg">{post.title}</CardTitle>
          </Link>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="text-sm text-gray-500 mb-2 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(post.date || post.updated_at || post.created_at || Date.now()).toLocaleDateString('ko-KR')}
            
            <span className="mx-2">•</span>
            
            <FileText className="h-3 w-3 mr-1" />
            {post.viewcnt || 0} 조회
          </div>
          
          <p className="line-clamp-2 text-sm">
            {/* 글 내용 미리보기 로직 - HTML 태그 제거 */}
            {post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 100) : ''}...
          </p>
        </CardContent>
      </Card>
    );
  };

  // 포스트 카드 그리드 렌더링 함수
  const renderPostCards = (posts: Post[]) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {posts.map(post => renderPostCard(post))}
    </div>
  );

  // 서브카테고리 섹션 렌더링 함수
  const renderSubcategorySection = (subcategory: any) => {
    const posts = subcategoryPosts[subcategory.id] || [];
    if (posts.length === 0) return null;
    
    const subcatTitle = typeof subcategory.title === 'string' 
      ? subcategory.title 
      : subcategory.title.ko;
    
    return (
      <div key={subcategory.id} className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">{subcatTitle}</h2>
          <Link href={`/${category.id}/${subcategory.id}`} className="text-blue-500 hover:underline text-sm">
            더 보기 &rarr;
          </Link>
        </div>
        {renderPostCards(posts)}
      </div>
    );
  };

  const handleToggleShowMore = () => {
    setShowMoreMain(!showMoreMain);
    setCurrentPage(1); // 더보기 토글 시 페이지 리셋
  };

  return (
    <>
      {loading ? (
        <p>콘텐츠를 불러오는 중...</p>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">{categoryTitle}</h1>
            <AdminNewPostButton categoryId={category.id} />
          </div>
          
          {/* 메인 카테고리 포스트 */}
          {mainPosts.length > 0 ? (
            <>
              {renderPostCards(visibleMainPosts)}
              
              {/* 더보기/접기 버튼 (메인 포스트가 초기 표시 갯수보다 많을 때만) */}
              {mainPosts.length > postsPerInitialView && (
                <div className="mt-6 flex flex-col items-center">
                  <button
                    onClick={handleToggleShowMore}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    {showMoreMain ? '접기' : '더 보기'}
                  </button>
                  
                  {/* 페이지네이션 (확장 모드일 때만 표시) */}
                  {showMoreMain && totalPages > 1 && (
                    <div className="flex mt-4 gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center border rounded-md disabled:opacity-50"
                      >
                        &larr;
                      </button>
                      
                      <span className="px-3 py-1 text-sm">
                        {currentPage} / {totalPages}
                      </span>
                      
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage >= totalPages}
                        className="w-8 h-8 flex items-center justify-center border rounded-md disabled:opacity-50"
                      >
                        &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-8 text-gray-500">이 카테고리에 게시물이 없습니다.</p>
          )}
          
          {/* 서브카테고리 포스트 */}
          {category.subcategories && category.subcategories.map((subcategory: Subcategory) => 
            renderSubcategorySection(subcategory)
          )}
        </>
      )}
    </>
  );
}
