"use client";

import { useState, useEffect, useRef } from "react"; // useEffect, useRef 임포트 유지
import { useRouter } from "next/navigation";
import useSWR from 'swr'; // SWR 훅 임포트 (유지)
import { createBrowserClient } from '@supabase/ssr'; // Supabase 클라이언트 임포트
import { useQuery } from '@supabase-cache-helpers/postgrest-swr'; // Supabase Cache Helpers useQuery 훅 임포트
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { categoryOptions, loadCategoryData } from "@/lib/category-options";
import { categoryMappings, contextualCategoryMappings, reverseCategoryMappings } from "@/lib/category-mappings";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession, authenticateAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash, Edit, Eye, Plus, Check, X, Upload, RefreshCcw, FileText, CheckCircle } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";


// Add this constant at the top of the file
const PAGE_SIZE = 10; // or whatever number of items you want per page

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
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  has_links?: boolean;
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

// Supabase 클라이언트 인스턴스 생성 (lib/supabase.ts와 동일하게)
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export default function AdminArticlesPage() {
  const router = useRouter();
  const { adminUser, loading: isLoadingAuth } = useAdminSession();
  const { toast: useToastToast } = useToast();

  // 필터 및 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTrashPage, setCurrentTrashPage] = useState(1);
  const [currentDraftPage, setCurrentDraftPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [trashSearchTerm, setTrashSearchTerm] = useState("");
  const [draftSearchTerm, setDraftSearchTerm] = useState("");
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [mainCategoryOpen, setMainCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);

  // 정렬 상태
  const [sortField, setSortField] = useState("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // UI 상태
  const [updating, setUpdating] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isTrashSearching, setIsTrashSearching] = useState(false);
  const [isDraftSearching, setIsDraftSearching] = useState(false);

  // 카테고리 데이터 로딩
  const { data: categoriesDataMap, isLoading: isLoadingCategories, error: categoriesError } = useSWR(
    'categoriesData',
    loadCategoryData // loadCategoryData 함수를 fetcher로 사용
  );
  const categoriesData = categoriesDataMap || new Map(); // 로딩 중일 때 기본값 설정

  // 드롭다운 참조
  const mainCategoryRef = useRef<HTMLDivElement>(null);
  const subCategoryRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지 효과
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mainCategoryRef.current && !mainCategoryRef.current.contains(event.target as Node)) {
        setMainCategoryOpen(false);
      }
      if (subCategoryRef.current && !subCategoryRef.current.contains(event.target as Node)) {
        setSubCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 메인 카테고리 옵션 가져오기
  const getMainCategoryOptions = () => {
    const options: { value: string; label: string }[] = [];
    if (categoriesData.size === 0) return options;
    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const slug = categoryData.href?.replace(/^\//, '') || '';
      options.push({ value: slug, label: categoryName });
    }
    return options;
  };

  // 서브 카테고리 옵션 가져오기
  const getSubCategoryOptions = () => {
    const options: { value: string; label: string }[] = [];
    if (categoriesData.size === 0 || selectedMainCategories.length !== 1) {
      return options;
    }
    const selectedMainCategory = selectedMainCategories[0];
    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const slug = categoryData.href?.replace(/^\//, '') || '';
      if (slug === selectedMainCategory && categoryData.items) {
        for (const subCategory of categoryData.items) {
          const title = typeof subCategory.title === 'object' ? subCategory.title.ko : subCategory.title;
          options.push({ value: subCategory.slug, label: title });
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
            return typeof subCategory.title === 'object' ? subCategory.title.ko : subCategory.title;
          }
        }
      }
    }
    return subSlug;
  };

  // 데이터 전처리 함수 (SWR 데이터에 적용)
  const preprocessPosts = (data: Post[] | null | undefined): Post[] => {
    if (!data) return [];
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

  // SWR 훅을 사용하여 게시글 데이터 가져오기
  const postsQuery = adminUser ? (() => {
    let query = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .eq("is_deleted", false)
      .eq("is_draft", false);

    // 메인 카테고리 필터
    // 선택된 메인 카테고리가 있으면 해당 카테고리들로 필터링
    // 없으면 모든 메인 카테고리 (getMainCategoryOptions()가 빈 배열을 반환하면 .in("category", [])가 되어 정상적으로 0건 조회)
    query = query.in("category", selectedMainCategories.length > 0 ? selectedMainCategories : getMainCategoryOptions().map(opt => opt.value));

    // 서브 카테고리 필터
    // 정확히 하나의 메인 카테고리가 선택된 경우에만 서브 카테고리 필터 적용
    if (selectedMainCategories.length === 1) {
      const subCategorySlugsForSelectedMain = getSubCategoryOptions().map(opt => opt.value);
      // 선택된 서브 카테고리가 있으면 해당 서브 카테고리들로 필터링
      // 없으면 (즉, "모든 서브 카테고리" 선택 시) 해당 메인 카테고리에 속하는 모든 서브 카테고리로 필터링
      // (subCategorySlugsForSelectedMain이 빈 배열이면 .in("subcategory", [])가 되어 정상적으로 0건 조회)
      query = query.in("subcategory", selectedSubCategories.length > 0 ? selectedSubCategories : subCategorySlugsForSelectedMain);
    }
    // 메인 카테고리가 선택되지 않았거나 여러 개 선택된 경우에는 서브 카테고리 필터를 적용하지 않음

    query = query
      .ilike("title", `%${searchTerm}%`)
      .order(sortField, { ascending: sortDirection === 'asc' })
      .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);
    
    return query;
  })() : null;

  const { 
    data: rawPosts, 
    error: postsError, 
    isLoading: isLoadingPosts, 
    count: postsCount, 
    mutate: mutatePosts 
  } = useQuery(
    postsQuery
    // SWR 옵션이 필요하다면 여기에 추가합니다. 예: { revalidateOnFocus: false }
  );
  const posts = preprocessPosts(rawPosts);
  const totalPosts = postsCount || 0;
  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

  // SWR 훅을 사용하여 임시저장 게시글 데이터 가져오기
  const draftsQuery = adminUser ?
    supabase
      .from("posts")
      .select("*", { count: "exact" })
      .eq("is_draft", true)
      .eq("is_deleted", false)
      .ilike("title", `%${draftSearchTerm}%`)
      .order("created_at", { ascending: false })
      .range((currentDraftPage - 1) * PAGE_SIZE, currentDraftPage * PAGE_SIZE - 1)
    : null;

  const { 
    data: rawDrafts, 
    error: draftsError, 
    isLoading: isLoadingDrafts, 
    count: draftsCount, 
    mutate: mutateDrafts 
  } = useQuery(
    draftsQuery
  );
  const drafts = preprocessPosts(rawDrafts);
  const totalDrafts = draftsCount || 0;
  const totalDraftPages = Math.ceil(totalDrafts / PAGE_SIZE);

  // SWR 훅을 사용하여 휴지통 게시글 데이터 가져오기
  const deletedPostsQuery = adminUser ?
    supabase
      .from("posts")
      .select("*", { count: "exact" })
      .eq("is_deleted", true)
      .ilike("title", `%${trashSearchTerm}%`)
      .order("deleted_at", { ascending: false })
      .range((currentTrashPage - 1) * PAGE_SIZE, currentTrashPage * PAGE_SIZE - 1)
    : null;

  const { 
    data: rawDeletedPosts, 
    error: deletedPostsError, 
    isLoading: isLoadingDeletedPosts, 
    count: deletedPostsCount, 
    mutate: mutateDeletedPosts 
  } = useQuery(
    deletedPostsQuery
  );
  const deletedPosts = preprocessPosts(rawDeletedPosts);
  const totalDeletedPosts = deletedPostsCount || 0;
  const totalTrashPages = Math.ceil(totalDeletedPosts / PAGE_SIZE);


  // 모든 데이터 로딩 상태 확인
  const isLoading = isLoadingAuth || isLoadingCategories || isLoadingPosts || isLoadingDrafts || isLoadingDeletedPosts;

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoadingAuth && !adminUser) {
      router.replace("/admin/login");
    }
  }, [adminUser, isLoadingAuth, router]);

  // 로딩 중 또는 에러 발생 시 UI
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">로딩 중...</div>;
  }

  if (postsError || draftsError || deletedPostsError || categoriesError) {
    console.error("Error fetching data:", postsError || draftsError || deletedPostsError || categoriesError);
    return <div className="container mx-auto px-4 py-8 text-red-500">데이터 로딩 중 오류가 발생했습니다.</div>;
  }

  // 검색 핸들러 (SWR은 캐시 키 변경 시 자동 재검증)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    setIsSearching(!!searchTerm);
    // searchTerm 상태가 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 검색 초기화
  const handleResetSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
    // searchTerm 상태가 빈 문자열로 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 휴지통 검색 핸들러
  const handleTrashSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentTrashPage(1); // 검색 시 첫 페이지로 이동
    setIsTrashSearching(!!trashSearchTerm);
    // trashSearchTerm 상태가 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 휴지통 검색 초기화
  const handleResetTrashSearch = () => {
    setTrashSearchTerm("");
    setIsTrashSearching(false);
    setCurrentTrashPage(1);
    // trashSearchTerm 상태가 빈 문자열로 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 임시저장 검색 핸들러
  const handleDraftSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentDraftPage(1); // 검색 시 첫 페이지로 이동
    setIsDraftSearching(!!draftSearchTerm);
    // draftSearchTerm 상태가 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 임시저장 검색 초기화
  const handleResetDraftSearch = () => {
    setDraftSearchTerm("");
    setIsDraftSearching(false);
    setCurrentDraftPage(1);
    // draftSearchTerm 상태가 빈 문자열로 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 메인 카테고리 필터 변경 핸들러
  const handleFilterMainCategoryChange = (value: string) => {
    const newSelected = selectedMainCategories.includes(value)
      ? selectedMainCategories.filter(c => c !== value)
      : [...selectedMainCategories, value];
    setSelectedMainCategories(newSelected);
    setSelectedSubCategories([]); // 메인 카테고리 변경 시 서브 카테고리 초기화
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    setMainCategoryOpen(false); // 드롭다운 닫기
    // selectedMainCategories 상태가 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 서브 카테고리 필터 변경 핸들러
  const handleFilterSubCategoryChange = (value: string) => {
    const newSelected = selectedSubCategories.includes(value)
      ? selectedSubCategories.filter(c => c !== value)
      : [...selectedSubCategories, value];
    setSelectedSubCategories(newSelected);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    setSubCategoryOpen(false); // 드롭다운 닫기
    // selectedSubCategories 상태가 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 정렬 토글 함수
  const toggleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
    // sortField 또는 sortDirection 상태가 변경되면 SWR 훅이 자동으로 데이터를 다시 가져옵니다.
  };

  // 슬라이드 표시 상태 토글
  const toggleSlideStatus = async (id: string, currentStatus: boolean) => {
    try {
      setUpdating(id);
      const { error } = await supabase
        .from("posts")
        .update({ is_slide: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success(`슬라이드 표시가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
      mutatePosts(); // 데이터 변경 후 SWR 캐시 갱신
    } catch (error) {
      console.error("Error updating slide status:", error);
      toast.error("슬라이드 상태 변경에 실패했습니다.");
    } finally {
      setUpdating(null);
    }
  };

  // 이미지 업로드 함수
  const handleImageUpload = async (postId: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        setUpdating(postId);
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`articles/${fileName}`, file);
        
        if (uploadError) throw uploadError;
        
        const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/articles/${fileName}`;
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({ image_url: imageUrl })
          .eq('id', postId);
          
        if (updateError) throw updateError;
        
        toast.success("슬라이드 이미지가 업로드되었습니다.");
        mutatePosts(); // 데이터 변경 후 SWR 캐시 갱신
      } catch (error) {
        console.error('이미지 업로드 중 오류 발생:', error);
        toast.error("이미지 업로드에 실패했습니다");
      } finally {
        setUpdating(null);
      }
    };
    fileInput.click();
  };

  // 슬라이드 순서 변경 함수
  const updateSlideOrder = async (postId: string, order: number) => {
    try {
      setUpdating(postId);
      const { error } = await supabase
        .from("posts")
        .update({ slide_order: order })
        .eq("id", postId);
        
      if (error) throw error;
      
      toast.success(`슬라이드 순서가 ${order}번으로 변경되었습니다.`);
      mutatePosts(); // 데이터 변경 후 SWR 캐시 갱신
    } catch (error) {
      console.error("슬라이드 순서 변경 중 오류:", error);
      toast.error("슬라이드 순서 변경에 실패했습니다.");
    } finally {
      setUpdating(null);
    }
  };

  // 게시글 휴지통 이동 함수
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("이 게시글을 휴지통으로 이동하시겠습니까?");
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from("posts")
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq("id", id);
        
        if (error) throw error;
        
        toast.success("게시글이 휴지통으로 이동되었습니다");
        mutatePosts(); // 게시글 목록 갱신
        mutateDeletedPosts(); // 휴지통 목록 갱신
      } catch (error) {
        console.error("게시글 삭제 중 오류:", error);
        toast.error("게시글을 휴지통으로 이동하는데 실패했습니다");
      }
    }
  };

  // 게시글 복원 함수
  const handleRestore = async (id: string) => {
    const confirmRestore = confirm("이 게시글을 복원하시겠습니까?");
    if (confirmRestore) {
      try {
        const { error } = await supabase
          .from("posts")
          .update({ 
            is_deleted: false, 
            deleted_at: null 
          })
          .eq("id", id);
        
        if (error) throw error;
        
        toast.success("게시글이 복원되었습니다");
        mutateDeletedPosts(); // 휴지통 목록 갱신
        mutatePosts(); // 게시글 목록 갱신
      } catch (error) {
        console.error("게시글 복원 중 오류:", error);
        toast.error("게시글 복원에 실패했습니다");
      }
    }
  };

  // 게시글 영구 삭제 함수
  const handlePermanentDelete = async (id: string) => {
    const confirmDelete = confirm("이 게시글을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from("posts")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
        
        toast.success("게시글이 영구적으로 삭제되었습니다");
        mutateDeletedPosts(); // 휴지통 목록 갱신
      } catch (error) {
        console.error("게시글 영구 삭제 중 오류:", error);
        toast.error("게시글 영구 삭제에 실패했습니다");
      }
    }
  };

  // 임시저장 게시글 발행 함수
  const handlePublishDraft = async (id: string) => {
    const confirmPublish = confirm("이 임시저장 게시글을 발행하시겠습니까?");
    if (confirmPublish) {
      try {
        const { error } = await supabase
          .from("posts")
          .update({ 
            is_draft: false,
            status: "published",
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
          
        if (error) throw error;
        
        toast.success("게시글이 성공적으로 발행되었습니다");
        mutateDrafts(); // 임시저장 목록 갱신
        mutatePosts(); // 게시글 목록 갱신
      } catch (error) {
        console.error("게시글 발행 중 오류:", error);
        toast.error("게시글 발행에 실패했습니다");
      }
    }
  };
  
  // 임시저장 게시글 삭제 함수
  const handleDeleteDraft = async (id: string) => {
    const confirmDelete = confirm("이 임시저장 게시글을 삭제하시겠습니까?");
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from("posts")
          .update({ 
            is_deleted: true,
            deleted_at: new Date().toISOString()
          })
          .eq("id", id);
          
        if (error) throw error;
        
        toast.success("임시저장 게시글이 삭제되었습니다");
        mutateDrafts(); // 임시저장 목록 갱신
        mutateDeletedPosts(); // 휴지통 목록 갱신
      } catch (error) {
        console.error("임시저장 게시글 삭제 중 오류:", error);
        toast.error("임시저장 게시글 삭제에 실패했습니다");
      }
    }
  };


  return (
    <div className="container mx-auto py-8">
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
                        handleFilterMainCategoryChange(option.value); // 핸들러 사용
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
                    onChange={() => handleFilterSubCategoryChange("")} // 모든 서브 카테고리 선택 시 빈 문자열 전달
                    className="mr-2"
                  />
                  모든 서브 카테고리
                </label>
                {getSubCategoryOptions().map(option => (
                  <label key={option.value} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSubCategories.includes(option.value)}
                      onChange={() => handleFilterSubCategoryChange(option.value)} // 핸들러 사용
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
              {isLoadingPosts ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {isSearching ? "검색 결과가 없습니다." : "등록된 기사가 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              posts
                .map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium flex items-center">
                      {post.is_deleted && <Trash size={14} className="mr-2 text-red-500" />} {/* 휴지통 아이콘 조건부 추가 */}
                      {post.title}
                    </TableCell>
                    <TableCell>{post.displayMainCategory}</TableCell>
                    <TableCell>
                      {post.displaySubCategory || "-"}
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
                                  alt="이미지" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {post.video_thumbnail_url && !post.image_url && (
                              <div className="w-10 h-10 overflow-hidden rounded relative">
                                <img 
                                  src={post.video_thumbnail_url} 
                                  alt="비디오 썸네일" 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
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
                            onClick={() => router.push(`/admin/articles/edit/${post.id}`)} // Link 대신 router.push 사용
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
          disabled={currentPage === 1 || isLoadingPosts}
          className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-1">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage >= totalPages || isLoadingPosts}
          className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* 임시저장 섹션 - 게시글과 휴지통 사이에 추가 */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">임시저장 게시글</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              임시저장 게시글: {totalDrafts}개
            </div>
            <button // Link 대신 button과 router.push 사용
              onClick={() => router.push("/admin/articles/create")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              새 게시글 작성
            </button>
          </div>
        </div>
        
        {/* 임시저장 검색 */}
        <div className="mb-6">
          <form onSubmit={handleDraftSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="임시저장 게시글 검색..."
              value={draftSearchTerm}
              onChange={(e) => setDraftSearchTerm(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="outline" size="sm">
              검색
            </Button>
            {isDraftSearching && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={handleResetDraftSearch}
              >
                초기화
              </Button>
            )}
          </form>
        </div>
        
        {/* 임시저장 테이블 */}
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>서브 카테고리</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDrafts ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : drafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {isDraftSearching ? "검색 결과가 없습니다." : "임시저장된 게시글이 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="font-medium flex items-center">
                      <FileText size={14} className="mr-2 text-gray-500" /> {/* 문서 아이콘 추가 */}
                      {draft.title || "(제목 없음)"}
                    </TableCell>
                    <TableCell>{draft.displayMainCategory || "-"}</TableCell>
                    <TableCell>
                      {draft.displaySubCategory || "-"}
                    </TableCell>
                    <TableCell>{formatDate(draft.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/articles/edit/${draft.id}`)} // Link 대신 router.push 사용
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="수정"
                        >
                          <Edit size={14} />
                          수정
                        </button>
                        <button
                          onClick={() => handlePublishDraft(draft.id)}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          title="발행"
                        >
                          <CheckCircle size={14} />
                          발행
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          title="삭제"
                        >
                          <Trash size={14} />
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
        
        {/* 임시저장 페이지네이션 */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setCurrentDraftPage(p => Math.max(p - 1, 1))}
            disabled={currentDraftPage === 1 || isLoadingDrafts}
            className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1">
            {currentDraftPage} / {totalDraftPages || 1} 페이지
          </span>
          <button
            onClick={() => setCurrentDraftPage(p => Math.min(p + 1, totalDraftPages))}
            disabled={currentDraftPage >= totalDraftPages || isLoadingDrafts}
            className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
          >
            다음
          </button>
        </div>
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
              {isLoadingDeletedPosts ? (
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
                    <TableCell className="font-medium flex items-center">
                      <Trash size={14} className="mr-2 text-gray-500" /> {/* 휴지통 아이콘 추가 */}
                      {post.title}
                    </TableCell>
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
            disabled={currentTrashPage === 1 || isLoadingDeletedPosts}
            className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1">
            {currentTrashPage} / {totalTrashPages || 1} 페이지
          </span>
          <button
            onClick={() => setCurrentTrashPage(p => Math.min(p + 1, totalTrashPages))}
            disabled={currentTrashPage >= totalTrashPages || isLoadingDeletedPosts}
            className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
