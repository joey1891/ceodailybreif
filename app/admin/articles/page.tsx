"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { categoryOptions, loadCategoryData } from "@/lib/category-options";
import { categoryMappings, contextualCategoryMappings, reverseCategoryMappings } from "@/lib/category-mappings";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash, Edit, Eye, Plus, Check, X, Upload } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef } from "react";

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
  viewcnt: number;
  is_slide: boolean;
  image_url: string | null;
  slide_order?: number;
  [key: string]: any;
}

// formatDate 함수 컴포넌트 내에 정의
const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ko-KR");
};

// 슬러그 포맷팅 함수
const formatSlug = (slug: string): string => {
  if (!slug) return "";
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// 카테고리 제목 표시 도우미 함수 추가
const getTitleString = (title: string | { ko: string; en: string }): string => {
  return typeof title === 'object' ? title.ko : title;
};

export default function AdminArticlesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const postsPerPage = 10;
  const router = useRouter();

  // 필터 상태: 기본값은 "all"
  const [filterMainCategory, setFilterMainCategory] = useState("all");
  const [filterSubCategory, setFilterSubCategory] = useState("all");

  // 정렬 상태 추가
  const [sortField, setSortField] = useState<string | null>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { adminUser } = useAdminSession();
  const { toast: useToastToast } = useToast();

  // 카테고리 데이터를 저장할 상태 추가
  const [categoriesData, setCategoriesData] = useState<Map<string, any>>(new Map());
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // 컴포넌트 마운트 시 카테고리 데이터 로드
  useEffect(() => {
    async function fetchCategories() {
      setIsLoadingCategories(true);
      try {
        const data = await loadCategoryData();
        setCategoriesData(data);
      } catch (error) {
        console.error("카테고리 로드 실패:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    
    fetchCategories();
  }, []);

  // 메인 카테고리 옵션 가져오기
  const getMainCategoryOptions = () => {
    const options: { value: string; label: string }[] = [];
    
    // 카테고리 데이터가 로드되지 않았으면 빈 배열 반환
    if (categoriesData.size === 0) return options;
    
    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const slug = categoryData.href?.replace(/^\//, '') || '';
      options.push({
        value: slug,
        label: categoryName
      });
    }
    
    return options;
  };

  // 서브 카테고리 옵션 가져오기
  const getSubCategoryOptions = () => {
    const options: { value: string; label: string }[] = [];
    
    // 카테고리 데이터가 로드되지 않았거나 메인 카테고리가 선택되지 않았으면 빈 배열 반환
    if (categoriesData.size === 0 || filterMainCategory === 'all') {
      return options;
    }
    
    // 선택된 메인 카테고리 찾기
    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const slug = categoryData.href?.replace(/^\//, '') || '';
      
      // 현재 선택된 메인 카테고리와 일치하는지 확인
      if (slug === filterMainCategory && categoryData.items) {
        // 서브카테고리 추가
        for (const subCategory of categoryData.items) {
          const title = typeof subCategory.title === 'object' 
            ? subCategory.title.ko 
            : subCategory.title;
            
          options.push({
            value: subCategory.slug,
            label: title
          });
        }
        break;
      }
    }
    
    return options;
  };

  // 메인 카테고리 제목 가져오기
  const getMainCategoryTitle = (slug: string): string => {
    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const categorySlug = categoryData.href?.replace(/^\//, '') || '';
      if (categorySlug === slug) {
        return categoryName;
      }
    }
    return slug;
  };

  // 서브 카테고리 제목 가져오기
  const getSubCategoryTitle = (mainSlug: string, subSlug: string): string => {
    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const categorySlug = categoryData.href?.replace(/^\//, '') || '';
      
      if (categorySlug === mainSlug && categoryData.items) {
        for (const subCategory of categoryData.items) {
          if (subCategory.slug === subSlug) {
            return typeof subCategory.title === 'object'
              ? subCategory.title.ko
              : subCategory.title;
          }
        }
      }
    }
    return subSlug;
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
      
      // 날짜 필드 특별 처리
      if (field === "date") {
        const dateA = valueA ? new Date(valueA as string).getTime() : 0;
        const dateB = valueB ? new Date(valueB as string).getTime() : 0;
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      } 
      // 다른 문자열 필드는 localeCompare 사용
      else if (typeof valueA === "string" && typeof valueB === "string") {
        return direction === "asc" 
          ? valueA.localeCompare(valueB, "ko") 
          : valueB.localeCompare(valueA, "ko");
      } 
      // 숫자 등 기타 타입 비교 (viewcnt 등)
      else {
        const numA = Number(valueA) || 0;
        const numB = Number(valueB) || 0;
        return direction === "asc" 
          ? numA - numB
          : numB - numA;
      }
    });
  };

  // 필터 조건이나 페이지 변경 시 게시글 다시 조회
  useEffect(() => {
    fetchPosts();
  }, [currentPage, filterMainCategory, filterSubCategory, sortField, sortDirection]);

  // DB 쿼리 함수 수정
  const fetchPosts = async (page = currentPage, search = searchTerm) => {
    setLoading(true);
    const start = (page - 1) * postsPerPage;
    const end = page * postsPerPage - 1;
    setIsSearching(!!search);

    // 필터링을 위한 카테고리 변환
    const categoryFilter = filterMainCategory === "all" 
      ? "all" 
      : filterMainCategory;
    
    const subCategoryFilter = filterSubCategory === "all"
      ? "all"
      : filterSubCategory;

    console.log("필터 정보:", {
      메인카테고리: filterMainCategory,
      서브카테고리: filterSubCategory,
      검색어: search
    });

    let query = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .range(start, end);

    // 검색어 필터 추가
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

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
      console.log("검색 결과:", data.length);
      
      // 정렬 적용
      const sortedData = sortData(data, sortField, sortDirection);
      
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

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    fetchPosts(1, searchTerm);
  };

  // 검색 초기화
  const handleResetSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
    fetchPosts(1, "");
  };

  // 슬라이드 표시 상태 토글
  const toggleSlideStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_slide: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      // 로컬 상태 업데이트
      setPosts(prev => prev.map(post => 
        post.id === id ? { ...post, is_slide: !currentStatus } : post
      ));
      
      toast.success(`슬라이드 표시가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error("Error updating slide status:", error);
      toast.error("슬라이드 상태 변경에 실패했습니다.");
    }
  };

  // 이미지 업로드 함수 수정
  const handleImageUpload = async (postId: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        setUpdating(postId);
        
        // 파일 이름 생성
        const fileName = `${Date.now()}-${file.name}`;
        
        // 기존 코드와 동일한 경로 사용
        const { data, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`articles/${fileName}`, file);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // 이미지 URL 가져오기
        const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/articles/${fileName}`;
        
        // 게시물 정보 업데이트
        const { error: updateError } = await supabase
          .from('posts')
          .update({ image_url: imageUrl })
          .eq('id', postId);
          
        if (updateError) {
          throw updateError;
        }
        
        // 로컬 상태 업데이트
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, image_url: imageUrl } 
              : post
          )
        );
        
        toast.success("슬라이드 이미지가 업로드되었습니다.");
      } catch (error) {
        console.error('이미지 업로드 중 오류 발생:', error);
        toast.error("이미지 업로드에 실패했습니다");
      } finally {
        setUpdating(null);
      }
    };
    
    // 파일 선택 다이얼로그 열기
    fileInput.click();
  };

  // 슬라이드 순서 변경 함수 추가
  const updateSlideOrder = async (postId: string, order: number) => {
    try {
      setUpdating(postId);
      
      const { error } = await supabase
        .from("posts")
        .update({ slide_order: order })
        .eq("id", postId);
        
      if (error) {
        throw error;
      }
      
      // 로컬 상태 업데이트
      setPosts(prev => 
        prev.map(post => 
          post.id === postId ? { ...post, slide_order: order } : post
        )
      );
      
      toast.success(`슬라이드 순서가 ${order}번으로 변경되었습니다.`);
    } catch (error) {
      console.error("슬라이드 순서 변경 중 오류:", error);
      toast.error("슬라이드 순서 변경에 실패했습니다.");
    } finally {
      setUpdating(null);
    }
  };

  // Add this function to toggle sort order
  const toggleSortOrder = () => {
    const newOrder = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newOrder);
    
    // Sort the posts based on date
    const sortedPosts = [...posts].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return newOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setPosts(sortedPosts);
  };

  // Modify your useEffect or fetch function to apply the initial sort
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*');
          
        if (error) throw error;
        
        // Sort posts by date based on current sortOrder
        const sortedPosts = data.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        });
        
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    
    fetchPosts();
  }, [sortDirection]);

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
            disabled={isLoadingCategories}
          >
            <option value="all">All Categories</option>
            {getMainCategoryOptions().map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {isLoadingCategories && (
            <p className="text-sm text-gray-500 mt-1">카테고리 로딩 중...</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Sub Category</label>
          <select
            className="w-full p-2 border rounded"
            value={filterSubCategory}
            onChange={handleFilterSubCategoryChange}
            disabled={filterMainCategory === "all" || isLoadingCategories}
          >
            <option value="all">All Sub Categories</option>
            {getSubCategoryOptions().map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 검색 폼 추가 */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="제목 또는 내용으로 검색..."
            className="border rounded-l px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
          >
            검색
          </button>
          {isSearching && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="ml-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              초기화
            </button>
          )}
        </form>
        {isSearching && (
          <p className="mt-2 text-sm text-gray-600">
            "{searchTerm}"에 대한 검색 결과: {totalPosts}개
          </p>
        )}
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
              <TableHead className="text-center">슬라이드 표시</TableHead>
              <TableHead className="text-center">슬라이드 사진</TableHead>
              <TableHead className="text-center">슬라이드 순서</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  {isSearching ? "검색 결과가 없습니다." : "등록된 기사가 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{getMainCategoryTitle(post.category)}</TableCell>
                  <TableCell>
                    {post.subcategory ? getSubCategoryTitle(post.category, post.subcategory) : "-"}
                  </TableCell>
                  <TableCell>{formatDate(post.date)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center">
                      <Checkbox 
                        checked={post.is_slide}
                        onCheckedChange={() => toggleSlideStatus(post.id, post.is_slide)}
                        className={post.is_slide ? "data-[state=checked]:bg-blue-500" : ""}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center">
                      {updating === post.id ? (
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {post.image_url && (
                            <div className="w-10 h-10 overflow-hidden rounded">
                              <img 
                                src={post.image_url} 
                                alt="슬라이드 이미지" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleImageUpload(post.id)}
                            className="flex items-center gap-1"
                          >
                            <Upload size={14} />
                            <span>업로드</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center">
                      {updating === post.id ? (
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      ) : (
                        <Select
                          disabled={!post.is_slide}
                          value={post.slide_order?.toString() || ""}
                          onValueChange={(value) => updateSlideOrder(post.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue placeholder="순서" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
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
              ))
            )}
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

      {/* Add this to your UI */}
      <div className="flex justify-center mt-6">
        <button 
          onClick={toggleSortOrder}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm flex items-center"
        >
          날짜 정렬: {sortDirection === 'asc' ? '오래된순' : '최신순'} 
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sortDirection === 'asc' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
