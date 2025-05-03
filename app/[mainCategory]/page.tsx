"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import Link from "next/link";
import { getCategoryById } from "@/lib/category-loader";
import { notFound } from "next/navigation";
import { useAdminSession } from "@/lib/admin-auth";

// 서브카테고리 타입 정의 추가
interface Subcategory {
  id: string;
  title: string | { ko: string; en: string };
  slug: string;
}

export default function CategoryPage({
  params,
}: {
  params: { mainCategory: string };
}) {
  // 관리자 인증 상태를 클라이언트 훅으로 관리
  const { adminUser, loading: adminLoading } = useAdminSession();
  
  const [mainPosts, setMainPosts] = useState<Post[]>([]);
  const [subcategoryPosts, setSubcategoryPosts] = useState<Record<string, Post[]>>({});
  const [loading, setLoading] = useState(true);
  const [showMoreMain, setShowMoreMain] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Category state
  const [category, setCategory] = useState<any>(null);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [notFoundError, setNotFoundError] = useState(false);
  
  // Post display configuration
  const postsPerInitialView = 3;
  const postsPerExpandedView = 9;
  const postsPerPage = 9;
  
  // 카테고리 로딩
  useEffect(() => {
    const cat = getCategoryById(params.mainCategory);
    
    if (!cat) {
      console.error("Category not found:", params.mainCategory);
      setNotFoundError(true);
      return;
    }
    
    setCategory(cat);
    setCategoryTitle(typeof cat.title === "string" ? cat.title : cat.title.ko);
  }, [params.mainCategory]);
  
  // 카테고리가 없으면 404
  if (notFoundError) {
    return notFound();
  }
  
  // 포스트 로딩
  useEffect(() => {
    if (!category) return;
    
    const fetchPosts = async () => {
      setLoading(true);
      console.log(`Fetching posts for category: ${category.id}`);
      
      // 메인 카테고리 글 가져오기 (is_deleted 필터 추가)
      const { data: mainCategoryPosts, error: mainError } = await supabase
        .from("posts")
        .select("*")
        .eq("category", category.id)
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false });
      
      if (mainError) {
        console.error("Error fetching main category posts:", mainError);
      }
      
      console.log(`Found ${mainCategoryPosts?.length || 0} main category posts`);
      setMainPosts(mainCategoryPosts || []);
      
      // 하위 카테고리 ID 목록
      const subcategories = category.subcategories || [];
      
      // 각 하위 카테고리별 글 가져오기 (is_deleted 필터 추가)
      const subcatPostsObj: Record<string, Post[]> = {};
      
      for (const subcategory of subcategories) {
        const { data: subPosts, error: subError } = await supabase
          .from("posts")
          .select("*")
          .eq("subcategory", subcategory.id)
          .eq("is_deleted", false)
          .order("updated_at", { ascending: false });
          
        if (subError) {
          console.error(`Error fetching posts for subcategory ${subcategory.id}:`, subError);
        }
        
        console.log(`Found ${subPosts?.length || 0} posts for subcategory ${subcategory.id}`);
        subcatPostsObj[subcategory.id] = subPosts || [];
      }
      
      setSubcategoryPosts(subcatPostsObj);
      setLoading(false);
    };

    fetchPosts();
  }, [category]);

  // 페이지네이션 계산
  const totalMainPosts = mainPosts.length;
  const totalPages = Math.ceil(totalMainPosts / postsPerPage);
  
  // 현재 표시할 메인 포스트 결정
  const visibleMainPosts = showMoreMain 
    ? mainPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
    : mainPosts.slice(0, postsPerInitialView);

  // 게시글 카드 렌더링 함수
  const renderPostCards = (posts: Post[]) => {
    return posts.length > 0 ? (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
        {posts.map((post) => (
          <Link key={post.id} href={`/article/${post.id}`}>
            <Card className="cursor-pointer hover:shadow-xl transition-shadow h-full flex flex-col">
              {post.image_url ? (
                <div className="relative w-full bg-gray-100" style={{ minHeight: "150px", maxHeight: "250px" }}>
                  <div className="w-full flex justify-center items-center bg-gray-100 p-2" style={{ height: "200px" }}>
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="max-w-full max-h-[180px] object-contain"
                    />
                  </div>
                </div>
              ) : null}
              
              <div className={`flex flex-col flex-grow ${!post.image_url ? 'justify-between' : ''}`}>
                {/* 텍스트 콘텐츠 컨테이너 - 상단 영역을 세로 가운데 정렬 */}
                <div className={`flex flex-col ${!post.image_url ? 'justify-center flex-grow' : ''}`}>
                  {/* 제목 */}
                  <CardHeader className={`pb-1 pt-3 ${!post.image_url ? 'text-center' : ''}`}>
                    <CardTitle className="text-lg font-bold leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  
                  {/* 텍스트 콘텐츠 - 여백 줄임 및 높이 조정 */}
                  <CardContent className={`py-1 ${!post.image_url ? 'text-center' : ''}`}>
                    <div className="text-gray-700 text-sm">
                      {post.content ? (
                        <p className="line-clamp-3 max-h-[4.5em]">
                          {post.content.replace(/<[^>]+>/g, "").slice(0, 150)}...
                        </p>
                      ) : (
                        <p className="italic">내용 없음</p>
                      )}
                    </div>
                  </CardContent>
                </div>
                
                {/* 날짜 표시 영역 - 항상 하단에 고정 */}
                <div className="flex items-center text-sm text-muted-foreground p-4 pt-2 mt-auto border-t">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(post.updated_at || post.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 mb-10">이 카테고리에 게시물이 없습니다.</p>
    );
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 페이지네이션 컴포넌트
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-8 mb-10 gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-4 py-2 rounded ${
              currentPage === page 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    );
  };

  if (!category) {
    return <div className="container mx-auto px-4 py-8">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <p>콘텐츠를 불러오는 중...</p>
      ) : (
        <>
          {/* 메인 카테고리 섹션 - 제목과 관리자 버튼을 함께 배치 */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">{categoryTitle}</h1>
            
            {/* 관리자인 경우에만 새 게시글 작성 버튼 표시 */}
            {adminUser && (
              <Link
                href={`/admin/articles/create?category=${category.id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
                새 게시글 작성
              </Link>
            )}
          </div>
          
          {renderPostCards(visibleMainPosts)}
          
          {/* 더보기 버튼 및 페이지네이션 */}
          {mainPosts.length > postsPerInitialView && !showMoreMain && (
            <div className="flex justify-center mb-10">
              <button
                onClick={() => {
                  setShowMoreMain(true);
                  setCurrentPage(1);
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                더보기 ↓
              </button>
            </div>
          )}
          
          {/* 페이지네이션 (더보기가 활성화된 경우에만 표시) */}
          {showMoreMain && totalMainPosts > 0 && renderPagination()}
          
          {/* 하위 카테고리 섹션 - 여백 축소 적용 */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="mt-12 mx-[-1rem] sm:mx-[-1.5rem] md:mx-[-2rem] lg:mx-[-2.5rem] xl:mx-[-4rem] 2xl:mx-[-5rem]">
              <h2 className="text-2xl font-bold mb-4 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">하위 카테고리</h2>
              
              {/* 모바일에서만 세로로 표시 */}
              <div className="md:hidden flex flex-col space-y-8 mb-6 px-4 sm:px-6">
                {category.subcategories.map((subcategory: Subcategory) => {
                  const subTitle = typeof subcategory.title === "string" 
                    ? subcategory.title 
                    : subcategory.title.ko;
                    
                  const subPosts = subcategoryPosts[subcategory.id] || [];
                  
                  return (
                    <div key={subcategory.id} className="w-full">
                      {/* 하위 카테고리 버튼 */}
                      {/* <Link 
                        href={`/${category.slug}/${subcategory.slug}`}
                        className="w-full px-4 py-2 bg-gray-100 text-center rounded-full hover:bg-gray-200 transition font-medium block mb-3"
                      >
                        {subTitle}
                      </Link> */}
                      
                      {/* 하위 카테고리 제목 */}
                      <div className="flex justify-between items-center mb-3 pb-1 border-b">
                        <h3 className="text-sm font-semibold">{subTitle}</h3>
                        <Link 
                          href={`/${category.slug}/${subcategory.slug}`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          더보기
                        </Link>
                      </div>
                      
                      {/* 게시글 목록 - 세로 배치 */}
                      {subPosts.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {subPosts.slice(0, 3).map((post) => (
                            <Link key={post.id} href={`/article/${post.id}`}>
                              <div className="border rounded hover:shadow-md transition-shadow cursor-pointer">
                                {/* 이미지 표시 영역 - 높이 증가 */}
                                {post.image_url ? (
                                  <div className="w-full flex justify-center items-center bg-gray-100 p-2" style={{ height: "150px" }}>
                                    <img
                                      src={post.image_url}
                                      alt={post.title}
                                      className="max-w-full max-h-[130px] object-contain"
                                    />
                                  </div>
                                ) : null}
                                
                                {/* 텍스트 콘텐츠 - 높이 증가 및 여백 조정 */}
                                <div className="p-3">
                                  <h4 className="font-medium line-clamp-2 text-sm mb-2">{post.title}</h4>
                                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                    {post.content ? post.content.replace(/<[^>]+>/g, "").slice(0, 100) : "내용 없음"}
                                  </p>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {new Date(post.updated_at || post.created_at).toLocaleDateString('ko-KR', {
                                      month: 'numeric',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs min-h-[15rem] flex items-center justify-center">게시물이 없습니다</p>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* PC에서만 표시 - 고정 너비 1400px 유지하고 가로 스크롤 */}
              <div className="hidden md:block overflow-hidden">
                <div className="overflow-x-scroll pb-4 w-full" style={{ scrollbarWidth: 'thin' }}>
                  <div className="min-w-[1400px] md:pl-8 lg:pl-10 xl:pl-12">
                    {/* 하위 카테고리 버튼들 - 한 줄에 모두 배치 */}
                    {/* <div className="flex mb-6 space-x-4">
                      {category.subcategories.map((subcategory) => {
                        const subTitle = typeof subcategory.title === "string" 
                          ? subcategory.title 
                          : subcategory.title.ko;
                          
                        return (
                          <Link 
                            key={subcategory.id}
                            href={`/${category.slug}/${subcategory.slug}`}
                            className="w-[140px] flex-shrink-0 px-4 py-2 bg-gray-100 text-center rounded-full hover:bg-gray-200 transition font-medium"
                          >
                            {subTitle}
                          </Link>
                        );
                      })}
                    </div> */}
                    
                    {/* 게시글들 - 각 카테고리 버튼 아래 열에 맞춰 배치 */}
                    <div className="flex space-x-4">
                      {category.subcategories.map((subcategory: Subcategory, index: number) => {
                        const subTitle = typeof subcategory.title === "string" 
                          ? subcategory.title 
                          : subcategory.title.ko;
                          
                        const subPosts = subcategoryPosts[subcategory.id] || [];
                        
                        // Add separator classes
                        const separatorClass = "relative";
                        const afterClass = "after:content-[''] after:absolute after:top-0 after:right-[-12px] after:w-[1px] after:h-full after:bg-gray-200";
                        
                        const columnClass = `w-[140px] ${separatorClass} ${index !== (category.subcategories?.length || 0) - 1 ? afterClass : ''}`;
                        
                        return (
                          <div key={subcategory.id} className={columnClass}>
                            {/* 하위 카테고리 제목 */}
                            <div className="flex justify-between items-end mb-3 pb-1 ">
                              <h3 className="text-sm font-semibold">{subTitle}</h3>
                              <Link 
                                href={`/${category.slug}/${subcategory.slug}`}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                더보기
                              </Link>
                            </div>
                            
                            {/* 게시글 목록 - 세로 배치 */}
                            {subPosts.length > 0 ? (
                              <div className="flex flex-col gap-3">
                                {subPosts.slice(0, 3).map((post) => (
                                  <Link key={post.id} href={`/article/${post.id}`}>
                                    <div className="border rounded hover:shadow-md transition-shadow cursor-pointer">
                                      {/* 이미지 표시 영역 - 높이 증가 */}
                                      {post.image_url ? (
                                        <div className="w-full flex justify-center items-center bg-gray-100 p-2" style={{ height: "150px" }}>
                                          <img
                                            src={post.image_url}
                                            alt={post.title}
                                            className="max-w-full max-h-[130px] object-contain"
                                          />
                                        </div>
                                      ) : null}
                                      
                                      {/* 텍스트 콘텐츠 - 높이 증가 및 여백 조정 */}
                                      <div className="p-3">
                                        <h4 className="font-medium line-clamp-2 text-sm mb-2">{post.title}</h4>
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                          {post.content ? post.content.replace(/<[^>]+>/g, "").slice(0, 100) : "내용 없음"}
                                        </p>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                          <Calendar className="mr-1 h-3 w-3" />
                                          {new Date(post.updated_at || post.created_at).toLocaleDateString('ko-KR', {
                                            month: 'numeric',
                                            day: 'numeric'
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <p className="min-h-[15rem] text-gray-500 text-xs">게시물이 없습니다</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 모든 카테고리에 글이 없는 경우 */}
          {mainPosts.length === 0 && 
           Object.values(subcategoryPosts).every(posts => posts.length === 0) && (
            <p className="text-gray-500">게시물이 없습니다.</p>
          )}
        </>
      )}
    </div>
  );
}
