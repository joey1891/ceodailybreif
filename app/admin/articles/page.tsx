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
import { Trash, Edit, Eye, Plus, Check, X, Upload, RefreshCcw } from "lucide-react";
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
  deleted_at: string | null;
  [key: string]: any;
}

// formatDate 함수 컴포넌트 내에 정의
const formatDate = (dateString: string | null): string => {
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
  const [deletedPosts, setDeletedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrash, setLoadingTrash] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTrashPage, setCurrentTrashPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalDeletedPosts, setTotalDeletedPosts] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [trashSearchTerm, setTrashSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTrashSearching, setIsTrashSearching] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const postsPerPage = 10;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const router = useRouter();

  // 필터 상태: 기본값은 "all"
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [mainCategoryOpen, setMainCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);

  // 정렬 상태 추가
  const [sortField, setSortField] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { adminUser } = useAdminSession();
  const { toast: useToastToast } = useToast();

  // 카테고리 데이터를 저장할 상태 추가
  const [categoriesData, setCategoriesData] = useState<Map<string, any>>(new Map());
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // 드롭다운 참조 추가
  const mainCategoryRef = useRef<HTMLDivElement>(null);
  const subCategoryRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지 효과 추가
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // 메인 카테고리 드롭다운
      if (mainCategoryRef.current && !mainCategoryRef.current.contains(event.target as Node)) {
        setMainCategoryOpen(false);
      }
      
      // 서브 카테고리 드롭다운
      if (subCategoryRef.current && !subCategoryRef.current.contains(event.target as Node)) {
        setSubCategoryOpen(false);
      }
    }
    
    // 이벤트 리스너 추가
    document.addEventListener("mousedown", handleClickOutside);
    
    // 클린업 함수
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    
    // Only show subcategories when exactly one main category is selected
    if (categoriesData.size === 0 || selectedMainCategories.length !== 1) {
      return options;
    }
    
    const selectedMainCategory = selectedMainCategories[0]; // Get the only selected main category
    
    // Find the selected main category data
    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const slug = categoryData.href?.replace(/^\//, '') || '';
      
      // Check if this matches the selected main category
      if (slug === selectedMainCategory && categoryData.items) {
        // Add all subcategories for this main category
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
  }, [currentPage, selectedMainCategories, selectedSubCategories, sortField, sortDirection]);

  // DB 쿼리 함수 수정
  const fetchPosts = async (page = currentPage, search = searchTerm) => {
    setLoading(true);
    const start = (page - 1) * postsPerPage;
    const end = page * postsPerPage - 1;
    setIsSearching(!!search);

    let query = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .eq("is_deleted", false)
      .range(start, end);

    // 검색어 필터 추가
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (selectedMainCategories.length > 0) {
      query = query.in("category", selectedMainCategories);
    }
    if (selectedSubCategories.length > 0 && selectedMainCategories.length === 1) {
      query = query.in("subcategory", selectedSubCategories);
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

  // 휴지통 게시글 조회 함수 추가
  const fetchDeletedPosts = async (page = currentTrashPage, search = trashSearchTerm) => {
    setLoadingTrash(true);
    const start = (page - 1) * postsPerPage;
    const end = page * postsPerPage - 1;
    setIsTrashSearching(!!search);

    let query = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false })
      .range(start, end);

    // 검색어 필터 추가
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching deleted posts:", error);
      toast.error("삭제된 게시글을 불러오는데 실패했습니다: " + error.message);
    } else if (data) {
      console.log("휴지통 검색 결과:", data.length);
      
      // 데이터 전처리 적용
      const processedData = preprocessData(data);
      setDeletedPosts(processedData);
      
      if (count !== null) {
        setTotalDeletedPosts(count);
      }
    }
    setLoadingTrash(false);
  };

  // 휴지통 페이지 변경 시 삭제된 게시글 다시 조회
  useEffect(() => {
    fetchDeletedPosts();
  }, [currentTrashPage]);

  const handleEdit = (id: string) => {
    router.push(`/admin/articles/edit/${id}`);
  };

  // 게시글 복원 함수
  const handleRestore = async (id: string) => {
    const confirmRestore = confirm("이 게시글을 복원하시겠습니까?");
    if (confirmRestore) {
      const { error } = await supabase
        .from("posts")
        .update({ 
          is_deleted: false, 
          deleted_at: null 
        })
        .eq("id", id);
        
      if (error) {
        console.error("게시글 복원 중 오류:", error);
        toast.error("게시글 복원에 실패했습니다");
      } else {
        toast.success("게시글이 복원되었습니다");
        fetchDeletedPosts();
        fetchPosts(); // 복원 후 일반 게시글 목록도 업데이트
      }
    }
  };

  // 게시글 영구 삭제 함수
  const handlePermanentDelete = async (id: string) => {
    const confirmDelete = confirm("이 게시글을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
    if (confirmDelete) {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id);
        
      if (error) {
        console.error("게시글 영구 삭제 중 오류:", error);
        toast.error("게시글 영구 삭제에 실패했습니다");
      } else {
        toast.success("게시글이 영구적으로 삭제되었습니다");
        fetchDeletedPosts();
      }
    }
  };

  // 휴지통 검색 핸들러
  const handleTrashSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentTrashPage(1); // 검색 시 첫 페이지로 이동
    fetchDeletedPosts(1, trashSearchTerm);
  };

  // 휴지통 검색 초기화
  const handleResetTrashSearch = () => {
    setTrashSearchTerm("");
    setIsTrashSearching(false);
    setCurrentTrashPage(1);
    fetchDeletedPosts(1, "");
  };

  // 메인 카테고리 필터 변경 핸들러
  const handleFilterMainCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setSelectedMainCategories([value]);
    
    // 디버깅 로그
    console.log("선택된 메인 카테고리:", value);
    
    // 메인 카테고리 변경 시 서브 카테고리 초기화
    setSelectedSubCategories([]);
    setCurrentPage(1);
  };

  // 서브 카테고리 필터 변경 핸들러
  const handleFilterSubCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedSubCategories([e.target.value]);
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

  // Add this function to handle toggling main categories
  const toggleMainCategory = (category: string) => {
    setSelectedMainCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Add this function to handle toggling sub categories
  const toggleSubCategory = (category: string) => {
    setSelectedSubCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Add this function to handle moving posts to trash
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("이 게시글을 휴지통으로 이동하시겠습니까?");
    if (confirmDelete) {
      const { error } = await supabase
        .from("posts")
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq("id", id);
        
      if (error) {
        console.error("게시글 삭제 중 오류:", error);
        toast.error("게시글을 휴지통으로 이동하는데 실패했습니다");
      } else {
        toast.success("게시글이 휴지통으로 이동되었습니다");
        fetchPosts();
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">게시글</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/admin/articles/create")}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-1"
          >
            <Plus size={16} />
            새 게시글 작성
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Main category - multiple selection */}
        <div ref={mainCategoryRef}>
          <label className="block text-sm font-medium mb-1">메인 카테고리</label>
          <div className="relative">
            <button
              onClick={() => setMainCategoryOpen(!mainCategoryOpen)}
              className="w-full p-2 border rounded text-left flex justify-between items-center bg-white"
              disabled={isLoadingCategories}
            >
              {selectedMainCategories.length === 0 
                ? "모든 카테고리" 
                : `${selectedMainCategories.length}개 카테고리 선택됨`}
              <span>▼</span>
            </button>
            
            {mainCategoryOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                <label key="all" className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMainCategories.length === 0}
                    onChange={() => {
                      setSelectedMainCategories([]);
                      setSelectedSubCategories([]);
                    }}
                    className="mr-2"
                  />
                  모든 카테고리
                </label>
                {getMainCategoryOptions().map(option => (
                  <label key={option.value} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMainCategories.includes(option.value)}
                      onChange={() => {
                        toggleMainCategory(option.value);
                        // When changing main categories, clear subcategories
                        setSelectedSubCategories([]);
                      }}
                      className="mr-2"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            )}
            
            {isLoadingCategories && (
              <p className="text-sm text-gray-500 mt-1">카테고리 로딩 중...</p>
            )}
          </div>
        </div>
        
        {/* Subcategory - multiple selection enabled when exactly one main category is selected */}
        <div ref={subCategoryRef}>
          <label className="block text-sm font-medium mb-1">서브 카테고리</label>
          <div className="relative">
            <button
              onClick={() => setSubCategoryOpen(!subCategoryOpen)}
              className="w-full p-2 border rounded text-left flex justify-between items-center bg-white"
              disabled={selectedMainCategories.length !== 1 || isLoadingCategories}
            >
              {selectedMainCategories.length !== 1 
                ? "메인 카테고리를 1개만 선택하세요" 
                : selectedSubCategories.length === 0 
                  ? "모든 서브 카테고리" 
                  : `${selectedSubCategories.length}개 서브카테고리 선택됨`}
              <span>▼</span>
            </button>
            
            {subCategoryOpen && selectedMainCategories.length === 1 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                <label key="all" className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSubCategories.length === 0}
                    onChange={() => setSelectedSubCategories([])}
                    className="mr-2"
                  />
                  모든 서브 카테고리
                </label>
                {getSubCategoryOptions().map(option => (
                  <label key={option.value} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSubCategories.includes(option.value)}
                      onChange={() => toggleSubCategory(option.value)}
                      className="mr-2"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search form moved below category selectors */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">검색</label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="게시글 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button type="submit" variant="outline" size="sm">
            검색
          </Button>
          {isSearching && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={handleResetSearch}
            >
              초기화
            </Button>
          )}
        </form>
      </div>

      {/* 게시글 테이블 */}
      <div className="bg-white rounded-lg shadow mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort("title")}
              >
                제목 {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort("category")}
              >
                카테고리 {sortField === "category" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort("subcategory")}
              >
                서브 카테고리 {sortField === "subcategory" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer" 
                onClick={() => toggleSort("date")}
              >
                날짜 {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-center">슬라이드 표시</TableHead>
              <TableHead className="text-center">슬라이드 사진</TableHead>
              <TableHead className="text-center">슬라이드 순서</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  로딩 중...
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
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
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

      {/* 휴지통 섹션 - 조건부 렌더링 제거 */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">휴지통</h2>
          <div className="text-sm text-gray-500">
            삭제된 게시글: {totalDeletedPosts}개
          </div>
        </div>

        {/* 휴지통 검색 */}
        <div className="mb-6">
          <form onSubmit={handleTrashSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="휴지통 내 게시글 검색..."
              value={trashSearchTerm}
              onChange={(e) => setTrashSearchTerm(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="outline" size="sm">
              검색
            </Button>
            {isTrashSearching && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={handleResetTrashSearch}
              >
                초기화
              </Button>
            )}
          </form>
        </div>

        {/* 휴지통 테이블 */}
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>서브 카테고리</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>삭제 일시</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTrash ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : deletedPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {isTrashSearching ? "검색 결과가 없습니다." : "휴지통이 비어있습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                deletedPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.displayMainCategory}</TableCell>
                    <TableCell>
                      {post.displaySubCategory || "-"}
                    </TableCell>
                    <TableCell>{formatDate(post.date)}</TableCell>
                    <TableCell>{formatDate(post.deleted_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRestore(post.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <RefreshCcw size={14} />
                          복원
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(post.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash size={14} />
                          영구삭제
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* 휴지통 페이지네이션 */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setCurrentTrashPage(p => Math.max(p - 1, 1))}
            disabled={currentTrashPage === 1}
            className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1">
            {currentTrashPage} / {totalPages || 1} 페이지
          </span>
          <button
            onClick={() => setCurrentTrashPage(p => Math.min(p + 1, totalPages))}
            disabled={currentTrashPage >= totalPages}
            className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
