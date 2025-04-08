"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import { loadCategoryData } from "@/lib/category-options";
import dynamic from "next/dynamic";
import { categoryMappings } from '@/lib/category-mappings';
import { Post } from "@/types/supabase";
import { getCategoryById } from "@/lib/category-loader";
import { CategoryItem, CategoryOption } from "@/lib/category-options";
// import { Editor } from "@/components/editor";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";

const EditorWithUploader = dynamic(
  () => import("@/components/editorWith-uploader"),
  {
    ssr: false,
    loading: () => <p>Loading Editor...</p>,
  }
);

interface ArticleFormProps {
  id?: string;
  post?: Post;
}

// 한글 카테고리를 영문으로 변환하는 매핑 추가
// const categoryMappings = { ... }; 부분 삭제

// Helper function to handle title objects
const getTitleString = (title: string | { ko: string; en: string }): string => {
  return typeof title === 'object' ? title.ko : title;
};

// Improved image extraction function
const extractFirstImage = (htmlContent: string): string | null => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = htmlContent.match(imgRegex);
  
  if (!match) return null;
  
  const imageUrl = match[1];
  
  // Check if it's a data URL (base64 encoded image)
  if (imageUrl.startsWith('data:image/')) {
    // Here you need to actually upload this image to your Supabase storage
    // This is a placeholder; you'll want to implement proper image uploading
    console.log("Found base64 image. Consider implementing proper image upload to storage.");
    
    // If your EditorWithUploader already handles image uploads to storage,
    // you shouldn't need to extract base64 images at all
    return null;
  }
  
  return imageUrl;
};

export default function ArticleForm({ id, post }: ArticleFormProps) {
  const router = useRouter();
  const { toast: useToastToast } = useToast();
  const { adminUser, loading: adminLoading } = useAdminSession();

  const [title, setTitle] = useState(post?.title || "");
  const [mainCategory, setMainCategory] = useState(post?.category || "");
  const [subCategory, setSubCategory] = useState<string>("");
  const [subSubCategory, setSubSubCategory] = useState("");
  const [content, setContent] = useState(post?.content || "");
  const [imgUrl, setImgUrl] = useState(post?.image_url || "");
  const [description, setDescription] = useState(post?.description || "");
  const [loading, setLoading] = useState(false);
  const [isSlide, setIsSlide] = useState(post?.is_slide || false);
  const [slideOrder, setSlideOrder] = useState<number | null>(post?.slide_order || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 서브카테고리 옵션
  const [subcategoryOptions, setSubcategoryOptions] = useState<{value: string; label: string}[]>([]);
  
  // 1. Add a state to track if categories are loaded
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // State for categories
  const [categoriesData, setCategoriesData] = useState<Map<string, any>>(new Map());
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // Load categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      console.log("⚠️ STARTING CATEGORY FETCH");
      setIsLoadingCategories(true);
      try {
        console.log("📊 Calling loadCategoryData()");
        const data = await loadCategoryData();
        console.log("📊 LOADED CATEGORIES DATA:", data);
        console.log("📊 Categories Map Size:", data.size);
        console.log("📊 Categories Keys:", Array.from(data.keys()));
        setCategoriesData(data);
        setCategoriesLoaded(true);
      } catch (error) {
        console.error("❌ 카테고리 로드 실패:", error);
      } finally {
        setIsLoadingCategories(false);
        console.log("⚠️ CATEGORY FETCH COMPLETE, isLoading=false");
      }
    }
    
    fetchCategories();
  }, []);
  
  // Helper functions to get category options
  const getMainCategoryOptions = () => {
    const options: { value: string; label: string }[] = [];

    if (categoriesData.size === 0) return options;

    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const slug = categoryData.href?.replace(/^\//, '') || '';
      options.push({
        value: slug,
        label: categoryName,
      });
    }

    return options;
  };

  const getSubCategoryOptions = () => {
    const options: { value: string; label: string }[] = [];

    if (categoriesData.size === 0 || !mainCategory) {
      return options;
    }

    for (const [categoryName, categoryData] of categoriesData.entries()) {
      const slug = categoryData.href?.replace(/^\//, '') || '';

      if (slug === mainCategory && categoryData.items) {
        for (const subCategory of categoryData.items) {
          const title = typeof subCategory.title === 'object'
            ? subCategory.title.ko
            : subCategory.title;

          options.push({
            value: subCategory.slug,
            label: title,
          });
        }
        break;
      }
    }

    return options as { value: string; label: string }[];
  };

  useEffect(() => {
    if (!mainCategory) {
      setSubcategoryOptions([]);
      return;
    }

    const subOptions = getSubCategoryOptions();
    setSubcategoryOptions(subOptions);

    if (subCategory && !subOptions.some(opt => opt.value === subCategory)) {
      setSubCategory("");
    }
  }, [mainCategory]);

  useEffect(() => {
    if (post) {
      // 카테고리 정보 로그
      console.log("편집 중인 게시글 카테고리 정보:", {
        category: post.category,
        subcategory: post.subcategory
      });
      
      // 이미 한글로 저장된 카테고리라면 그대로 사용
      if (post.category && /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(post.category)) {
        setMainCategory(post.category);
      }
      
      // 영문 슬러그인 경우 한글 이름으로 변환하여 표시
      const categoryData = getCategoryById(post.category);
      if (categoryData) {
        console.log("카테고리 정보 찾음:", categoryData);
        setMainCategory(post.category);
      }
    }
  }, [post]);

  // 관리자 로그인 확인
  useEffect(() => {
    if (!adminLoading && !adminUser) {
      router.push("/login");
    }
  }, [adminLoading, adminUser, router]);

  // 편집 시 기존 게시글 데이터 로드
  useEffect(() => {
    if (!id) return;
    async function fetchArticle() {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        useToastToast({
          title: "Error",
          description: "Failed to load article",
          variant: "destructive",
        });
        router.push("/admin/articles");
        return;
      }
      setTitle(data.title);
      setContent(data.content);
      // Main Category는 posts.category, Sub Category는 posts.subcategory
      if (data.category) setMainCategory(data.category);
      if (data.subcategory) setSubCategory(data.subcategory);
      if (data.subsubcategory) setSubSubCategory(data.subsubcategory);
      if (data.category === "Report" || data.category === "report") {
        setImgUrl(data.image_url || "");
        setDescription(data.description || "");
      }
    }
    fetchArticle();
  }, [id, router, useToastToast]);

  // 메인 카테고리 변경 핸들러 업데이트
  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMainSlug = e.target.value;
    setMainCategory(newMainSlug);

    // 서브카테고리 초기화
    setSubCategory("");
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSub = e.target.value;
    setSubCategory(newSub);
    setSubSubCategory("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!adminUser) {
        useToastToast({
          title: "Error",
          description:
            "You must be logged in as admin to save articles.",
          variant: "destructive",
        });
        return;
      }

      // 유효성 검사 추가
      if (!title) {
        useToastToast({
          title: "Error",
          description: "Title is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      if (!mainCategory) {
        useToastToast({
          title: "Error",
          description: "Main Category is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      if (!content) {
        useToastToast({
          title: "Error",
          description: "Content is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      let articleData: any = {
        title,
        category: mainCategory,
        subcategory: subCategory || "",
        subsubcategory: subSubCategory,
        content,
        date: new Date().toISOString().split("T")[0],
        is_slide: isSlide,
        ...(isSlide && slideOrder !== null ? { slide_order: slideOrder } : {}),
        description: description,
        image_url: imgUrl.trim() !== "" ? imgUrl.trim() : null, // 이미지 URL 추가
      };
      
      let error;
      if (id) {
        const { error: updateError, count } = await supabase
          .from("posts")
          .update(articleData)
          .eq("id", id)
          
          //.eq("user_id", adminUser.id);
        if (updateError) error = updateError;
        else if (count === 0) {
          alert("You are not the author of this article.");
          useToastToast({
            title: "Warning",
            description: "You are not the logged in user.",
            variant: "destructive",
          });
          return;
        }
      } else {
       const { error: insertError, data: newArticle } = await supabase
          .from("posts")
          .insert([{ ...articleData, user_id: adminUser.id }])
          .select();
        if (insertError) error = insertError;
      }
      if (error) {
        useToastToast({
          title: "Error",
          description: `Failed to ${id ? "update" : "create"} article`,
          variant: "destructive",
        });
      } else {
        useToastToast({
          title: "Success",
          description: `Article ${id ? "updated" : "created"} successfully`,
        });
        router.push("/admin");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      useToastToast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (adminLoading) {
    return <div>Loading...</div>;
  }

  // Replace the incorrect categoryOptions references with categoriesData
  const currentCategory = mainCategory ? 
    Array.from(categoriesData.entries())
      .find(([_, data]) => data.href?.replace(/^\//, '') === mainCategory)?.[1] as CategoryOption | undefined
    : null;
    
  const currentSubCategoryData = mainCategory && subCategory && currentCategory?.items && Array.isArray(currentCategory.items) ?
    currentCategory.items.find((item: CategoryItem) => item.slug === subCategory) : null;
  
  // Check if the subcategory has items
  const hasSubSubCategories = currentSubCategoryData && 
    'items' in currentSubCategoryData && 
    currentSubCategoryData.items && 
    currentSubCategoryData.items.length > 0;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-white px-4 py-4">
      <h1 className="text-3xl font-bold mb-6">
        {id ? "Edit" : "New"} Article
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-3xl">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* Category Selection */}
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="flex-1">
            <label
              htmlFor="mainCategory"
              className="block text-sm font-medium text-gray-700"
            >
              Main Category
            </label>
            {!categoriesLoaded ? (
              <div className="text-red-500">Loading categories...</div>
            ) : (
              <select
                id="mainCategory"
                value={mainCategory}
                onChange={handleMainCategoryChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                disabled={isLoadingCategories}
              >
                <option value="">Select Category</option>
                {getMainCategoryOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          {getSubCategoryOptions().length > 0 && (
            <div className="flex-1">
              <label
                htmlFor="subCategory"
                className="block text-sm font-medium text-gray-700"
              >
                Sub Category
              </label>
              <select
                id="subCategory"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                disabled={isLoadingCategories || !mainCategory}
              >
                <option value="">Select Subcategory</option>
                {getSubCategoryOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* hasSubSubCategories && (
            <div className="flex-1">
              <label
                htmlFor="subSubCategory"
                className="block text-sm font-medium text-gray-700"
              >
                Sub-Sub Category
              </label>
              <select
                id="subSubCategory"
                value={subSubCategory}
                onChange={(e) => setSubSubCategory(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select...</option>
                {currentSubCategory?.items && currentSubCategory.items.map((subSub) => (
                  <option key={getTitleString(subSub.title)} value={getTitleString(subSub.title)}>
                    {getTitleString(subSub.title)}
                  </option>
                ))}
              </select>
            </div>
          ) */}
        </div>
        {/* Content */}
        <div>
          <EditorWithUploader 
            value={content} 
            onChangeAction={(newContent) => {
              setContent(newContent);
              
              // 콘텐츠가 변경될 때마다 첫 번째 이미지 추출하여 image_url 설정
              if (!imgUrl) {
                const firstImage = extractFirstImage(newContent);
                if (firstImage) {
                  setImgUrl(firstImage);
                  console.log("첫 번째 이미지를 대표 이미지로 설정:", firstImage);
                }
              }
            }}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={isSlide}
            onCheckedChange={setIsSlide}
            id="slide-switch"
          />
          <label htmlFor="slide-switch" className="text-sm font-medium">
            메인 슬라이드에 표시
          </label>
          
          {isSlide && (
            <div className="ml-4">
              <select
                value={slideOrder?.toString() || ""}
                onChange={(e) => setSlideOrder(e.target.value ? parseInt(e.target.value) : null)}
                className="p-1 border rounded"
              >
                <option value="">순서 선택</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          )}
        </div>
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 text-white p-2 rounded w-full"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                처리 중...
              </>
            ) : (
              id
                ? "Update Article"
                : "Create Article"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
