"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { categoryOptions } from "@/lib/category-options";
import { categoryMappings, contextualCategoryMappings, reverseCategoryMappings } from "@/lib/category-mappings";

// 포스트 타입 정의
interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  subsubcategory?: string;
  date: string;
  author?: string;
  displayMainCategory?: string;
  displaySubCategory?: string;
  displaySubSubCategory?: string;
  [key: string]: any;
}

// 슬러그 포맷팅 함수
const formatSlug = (slug: string): string => {
  if (!slug) return "";
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function AdminArticlesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 10;
  const router = useRouter();

  // 필터 상태: 기본값은 "all"
  const [filterMainCategory, setFilterMainCategory] = useState("all");
  const [filterSubCategory, setFilterSubCategory] = useState("all");

  // 정렬 상태 추가
  const [sortField, setSortField] = useState<string | null>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 영문 슬러그를 한글 카테고리명으로 변환하는 함수
  const getMainCategoryTitle = (categorySlug: string): string => {
    if (!categorySlug) return "";
    
    // 이미 한글인 경우 그대로 반환
    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(categorySlug)) {
      return categorySlug;
    }
    
    // 1. reverseCategoryMappings 사용
    if (reverseCategoryMappings[categorySlug]) {
      return reverseCategoryMappings[categorySlug];
    }
    
    // 2. categoryOptions에서 찾기
    for (const [koreanTitle, option] of categoryOptions.entries()) {
      const slug = option.href?.replace(/^\//, '') || '';
      if (slug === categorySlug) {
        return koreanTitle;
      }
    }
    
    // 3. 매핑에 없는 경우 기본 포맷
    return formatSlug(categorySlug);
  };

  // 서브카테고리 변환 함수
  const getSubCategoryTitle = (mainCategorySlug: string, subCategorySlug: string): string => {
    if (!subCategorySlug) return "";
    
    // 이미 한글인 경우 그대로 반환
    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(subCategorySlug)) {
      return subCategorySlug;
    }
    
    // 1. 메인 카테고리의 한글명 찾기
    let mainCategoryKorean = "";
    for (const [koreanTitle, option] of categoryOptions.entries()) {
      const slug = option.href?.replace(/^\//, '') || '';
      if (slug === mainCategorySlug) {
        mainCategoryKorean = koreanTitle;
        break;
      }
    }
    
    // 2. 한글 메인 카테고리를 찾았다면 해당 카테고리의 items에서 서브카테고리 찾기
    if (mainCategoryKorean) {
      const mainCategory = categoryOptions.get(mainCategoryKorean);
      if (mainCategory && mainCategory.items) {
        // 직접 매칭
        for (const item of mainCategory.items) {
          if (item.slug === subCategorySlug) {
            return item.title;
          }
          
          // 중첩된 서브카테고리 확인
          if (item.items) {
            for (const subItem of item.items) {
              if (subItem.slug === subCategorySlug) {
                return subItem.title;
              }
            }
          }
        }
      }
    }
    
    // 3. 역매핑에서 찾기 시도
    if (reverseCategoryMappings[subCategorySlug]) {
      return reverseCategoryMappings[subCategorySlug];
    }
    
    // 4. 매핑에 없는 경우 기본 포맷
    return formatSlug(subCategorySlug);
  };

  // 한글 카테고리명을 영문 슬러그로 변환하는 함수
  const getCategorySlug = (categoryTitle: string): string => {
    // 이미 영문인 경우 그대로 반환
    if (!categoryTitle || !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(categoryTitle)) {
      return categoryTitle;
    }
    
    // 1. 카테고리 매핑에서 찾기
    if (categoryMappings[categoryTitle]) {
      return categoryMappings[categoryTitle];
    }
    
    // 2. categoryOptions에서 찾기
    if (categoryOptions.has(categoryTitle)) {
      const option = categoryOptions.get(categoryTitle);
      return option?.href?.replace(/^\//, '') || 
             categoryTitle.toLowerCase().replace(/\s+/g, "-");
    }
    
    // 3. 매핑에 없는 경우 기본 변환
    return categoryTitle.toLowerCase().replace(/\s+/g, "-");
  };

  // 데이터 전처리 함수
  const preprocessData = (data: Post[]): Post[] => {
    return data.map(post => {
      const displayMainCategory = getMainCategoryTitle(post.category);
      const displaySubCategory = post.subcategory ? getSubCategoryTitle(post.category, post.subcategory) : "";
      const displaySubSubCategory = post.subsubcategory ? getSubCategoryTitle(post.category, post.subsubcategory) : "";
      
      return {
        ...post,
        displayMainCategory,
        displaySubCategory,
        displaySubSubCategory
      };
    });
  };

  // 정렬 함수
  const sortData = (data: Post[], field: string | null, direction: 'asc' | 'desc'): Post[] => {
    if (!field) return data;
    
    // 데이터 전처리로 표시값 미리 계산
    const enhancedData = preprocessData(data);
    
    return [...enhancedData].sort((a, b) => {
      let valueA, valueB;
      
      // 카테고리 열 정렬 시 한글 카테고리명으로 정렬
      if (field === "category") {
        valueA = a.displayMainCategory || "";
        valueB = b.displayMainCategory || "";
      }
      // 서브카테고리 열 정렬 시 한글 서브카테고리명으로 정렬
      else if (field === "subcategory") {
        valueA = a.displaySubCategory || "";
        valueB = b.displaySubCategory || "";
      }
      // 기타 열은 기존대로 정렬
      else {
        valueA = a[field as keyof Post] || "";
        valueB = b[field as keyof Post] || "";
      }
      
      // 문자열 정렬은 localeCompare로, 날짜는 직접 비교
      if (typeof valueA === "string" && typeof valueB === "string") {
        return direction === "asc" 
          ? valueA.localeCompare(valueB, "ko") 
          : valueB.localeCompare(valueA, "ko");
      } else {
        return direction === "asc" 
          ? (valueA > valueB ? 1 : -1) 
          : (valueA < valueB ? 1 : -1);
      }
    });
  };

  // 메인 카테고리 옵션 가져오는 함수
  const getMainCategoryOptions = (): { value: string; label: string }[] => {
    const options: { value: string; label: string }[] = [];
    
    for (const [koreanTitle, option] of categoryOptions.entries()) {
      // 특수 카테고리(주요일정 등) 제외
      if (koreanTitle === "주요일정") continue;
      
      const slug = option.href?.replace(/^\//, '') || 
                   option.base?.replace(/^\//, '') || 
                   koreanTitle.toLowerCase().replace(/\s+/g, "-");
                   
      options.push({ value: slug, label: koreanTitle });
    }
    
    return options;
  };

  // 서브카테고리 옵션 가져오는 함수
  const getSubCategoryOptions = (): { value: string; label: string }[] => {
    if (filterMainCategory === "all") return [];
    
    const options: { value: string; label: string }[] = [];
    
    // 1. 선택된 메인 카테고리의 한글명 찾기
    let mainCategoryKorean = "";
    for (const [koreanTitle, option] of categoryOptions.entries()) {
      const slug = option.href?.replace(/^\//, '') || '';
      if (slug === filterMainCategory) {
        mainCategoryKorean = koreanTitle;
        break;
      }
    }
    
    // 2. 해당 카테고리의 서브카테고리 목록 가져오기
    if (mainCategoryKorean) {
      const mainCategory = categoryOptions.get(mainCategoryKorean);
      if (mainCategory && mainCategory.items) {
        for (const item of mainCategory.items) {
          if (item.slug) {
            options.push({ value: item.slug, label: item.title });
          }
          
          // 중첩된 서브카테고리 추가
          if (item.items) {
            for (const subItem of item.items) {
              if (subItem.slug) {
                options.push({ value: subItem.slug, label: subItem.title });
              }
            }
          }
        }
      }
    }
    
    return options;
  };

  // 필터 조건이나 페이지 변경 시 게시글 다시 조회
  useEffect(() => {
    fetchPosts();
  }, [currentPage, filterMainCategory, filterSubCategory, sortField, sortDirection]);

  // DB 쿼리 함수
  const fetchPosts = async () => {
    setLoading(true);
    const start = (currentPage - 1) * postsPerPage;
    const end = currentPage * postsPerPage - 1;

    // 필터링을 위한 카테고리 변환
    const categoryFilter = filterMainCategory === "all" 
      ? "all" 
      : filterMainCategory; // 이미 영문 슬러그로 받음
    
    const subCategoryFilter = filterSubCategory === "all"
      ? "all"
      : filterSubCategory; // 이미 영문 슬러그로 받음

    console.log("필터 정보:", {
      메인카테고리: filterMainCategory,
      서브카테고리: filterSubCategory
    });

    let query = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .range(start, end);

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }
    if (subCategoryFilter !== "all") {
      query = query.eq("subcategory", subCategoryFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch articles: " + error.message);
    } else if (data) {
      console.log("원본 데이터:", data);
      
      // 정렬 적용
      const sortedData = sortData(data, sortField, sortDirection);
      
      console.log("정렬된 데이터:", sortedData);
      setPosts(sortedData);
      
      if (count !== null) {
        setTotalPosts(count);
      }
    }
    setLoading(false);
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/articles/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Are you sure to delete this article?");
    if (confirmDelete) {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete article");
      } else {
        toast.success("Article deleted successfully");
        fetchPosts();
      }
    }
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // 메인 카테고리 필터 변경 핸들러
  const handleFilterMainCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFilterMainCategory(value);
    
    // 디버깅 로그
    console.log("선택된 메인 카테고리:", value);
    
    // 메인 카테고리 변경 시 서브 카테고리 초기화
    setFilterSubCategory("all");
    setCurrentPage(1);
  };

  // 서브 카테고리 필터 변경 핸들러
  const handleFilterSubCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilterSubCategory(e.target.value);
    setCurrentPage(1);
  };

  // 정렬 토글 함수
  const toggleSort = (field: string) => {
    if (sortField === field) {
      // 같은 필드면 방향만 전환
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드면 필드 변경하고 오름차순으로 시작
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Articles</h1>
        <button
          onClick={() => router.push("/admin/articles/create")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create New Article
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Main Category</label>
          <select
            className="w-full p-2 border rounded"
            value={filterMainCategory}
            onChange={handleFilterMainCategoryChange}
          >
            <option value="all">All Categories</option>
            {getMainCategoryOptions().map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Sub Category</label>
          <select
            className="w-full p-2 border rounded"
            value={filterSubCategory}
            onChange={handleFilterSubCategoryChange}
            disabled={filterMainCategory === "all"}
          >
            <option value="all">All Sub Categories</option>
            {getSubCategoryOptions().map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 게시글 테이블 */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort("title")}
              >
                Title {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort("category")}
              >
                Category {sortField === "category" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort("subcategory")}
              >
                SubCategory {sortField === "subcategory" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort("date")}
              >
                Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{getMainCategoryTitle(post.category)}</TableCell>
                <TableCell>
                  {post.subcategory ? getSubCategoryTitle(post.category, post.subcategory) : "-"}
                </TableCell>
                <TableCell>{post.date}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(post.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* 페이지네이션 */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-1">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
