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
import EditorWithUploader from "./editorWith-uploader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface ArticleFormProps {
  id?: string;
  post?: Post;
  defaultCategory?: string;
}

// 한글 카테고리를 영문으로 변환하는 매핑 추가
// const categoryMappings = { ... }; 부분 삭제

// Helper function to handle title objects
const getTitleString = (title: string | { ko: string; en: string }): string => {
  return typeof title === 'object' ? title.ko : title;
};

// 이미지 추출 함수 추가 (파일 상단에 추가)
const extractFirstImage = (htmlContent: string): string | null => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = htmlContent.match(imgRegex);
  return match ? match[1] : null;
};

// 이미지 타입 정의
interface UploadedImage {
  url: string;
  timestamp: number;
}

// 유튜브 링크 감지 함수
const detectYouTubeLink = (content: string) => {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = content.match(youtubeRegex);
  return match ? match[1] : null; // 유튜브 비디오 ID 반환
};

// 비메오 링크 감지 함수
const detectVimeoLink = (content: string) => {
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/;
  const match = content.match(vimeoRegex);
  return match ? match[1] : null; // 비메오 비디오 ID 반환
};

// 썸네일 URL 생성 함수
const getVideoThumbnail = (videoType: 'youtube' | 'vimeo', videoId: string) => {
  if (videoType === 'youtube') {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } else if (videoType === 'vimeo') {
    // 비메오는 API 호출이 필요하지만 여기서는 간단한 예시로 대체
    return `https://vumbnail.com/${videoId}.jpg`;
  }
  return null;
};

// 링크 sanitize 함수 - 특수 문자 등을 적절히 처리
const sanitizeContent = (content: string) => {
  // 에디터에서 이미 HTML을 생성한다고 가정하고, 여기서는 기본적인 HTML 이스케이프를 제거합니다.
  // 필요한 경우 XSS 방지를 위해 DOMPurify와 같은 라이브러리를 사용하는 것을 고려할 수 있습니다.
  let sanitized = content;
  
  // 에디터에서 이미 링크를 처리한다고 가정하고, 여기서는 URL을 clickable 링크로 변환하는 로직 제거
  // const urlRegex = /(https?:\/\/[^\s]+)/g;
  // sanitized = sanitized.replace(urlRegex, (url) => {
  //   return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  // });
  
  return sanitized;
};

export default function ArticleForm({ 
  id, 
  post,
  defaultCategory 
}: { 
  id?: string;
  post?: Post;
  defaultCategory?: string;
}) {
  const router = useRouter();
  const { toast: useToastToast } = useToast();
  const { adminUser, loading: adminLoading } = useAdminSession();

  const [formData, setFormData] = useState({
    title: post?.title || "",
    content: post?.content || "",
    category: post?.category || defaultCategory || "",
    subcategory: post?.subcategory || "",
    subsubcategory: post?.subsubcategory || "",
    description: post?.description || "",
    image_url: post?.image_url || "",
    is_slide: post?.is_slide || false,
    slide_order: post?.slide_order || null,
    date: post?.date || new Date().toISOString().split('T')[0], // Add date with default to today
  });

  const [title, setTitle] = useState(formData.title);
  const [mainCategory, setMainCategory] = useState(formData.category);
  const [subCategory, setSubCategory] = useState(formData.subcategory);
  const [subSubCategory, setSubSubCategory] = useState(formData.subsubcategory);
  const [content, setContent] = useState(formData.content);
  const [imgUrl, setImgUrl] = useState(formData.image_url);
  const [description, setDescription] = useState(formData.description);
  const [loading, setLoading] = useState(false);
  const [isSlide, setIsSlide] = useState(formData.is_slide);
  const [slideOrder, setSlideOrder] = useState<number | null>(formData.slide_order);
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
        .select("*") // Select all columns including date
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
      setFormData({
        title: data.title,
        content: data.content,
        category: data.category || "",
        subcategory: data.subcategory || "",
        subsubcategory: data.subsubcategory || "",
        description: data.description || "",
        image_url: data.image_url || "",
        is_slide: data.is_slide || false,
        slide_order: data.slide_order || null,
        date: data.date || new Date().toISOString().split('T')[0], // Include date here
      });
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

  // 업로드된 이미지 목록 상태 추가
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  // 선택된 썸네일 URL 상태 추가
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(formData.image_url || "");

  // 카테고리 옵션 (실제 데이터로 교체 필요)
  const mainCategories = ["news", "finance", "company", "market", "tech", "culture"];
  const subCategories: Record<string, string[]> = {
    news: ["breaking", "politics", "economy", "international"],
    // 다른 카테고리의 서브 카테고리 추가
  };

  // 이미지 업로드 콜백 핸들러
  const handleImageUpload = (imageUrl: string) => {
    // 새 이미지를 목록에 추가
    const newImage = {
      url: imageUrl,
      timestamp: Date.now()
    };
    
    setUploadedImages(prev => [...prev, newImage]);
    
    // 아직 썸네일이 선택되지 않았다면 첫 이미지를 자동으로 썸네일로 설정
    if (!thumbnailUrl) {
      setThumbnailUrl(imageUrl);
    }
  };

  // 썸네일 선택 핸들러
  const handleSelectThumbnail = (url: string) => {
    setThumbnailUrl(url);
    toast.success("썸네일 이미지가 선택되었습니다");
  };

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  console.log("--- Entering handleSubmit ---"); // Add this log
  e.preventDefault();
  console.log("handleSubmit 시작"); // Added log
  setIsSubmitting(true);
  try {
    console.log("Checking admin user..."); // Add log
    if (!adminUser) {
      console.log("Validation failed: adminUser not found."); // Add log
      useToastToast({
        title: "Error",
        description:
          "You must be logged in as admin to save articles.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    console.log("Validation passed: adminUser found."); // Add log

    // 유효성 검사 추가
    console.log("Checking title..."); // Add log
    if (!title) {
      console.log("Validation failed: title is empty."); // Add log
      useToastToast({
        title: "Error",
        description: "Title is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    console.log("Validation passed: title is not empty."); // Add log

    console.log("Checking main category..."); // Add log
    if (!mainCategory) {
      console.log("Validation failed: mainCategory is empty."); // Add log
      useToastToast({
        title: "Error",
        description: "Main Category is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    console.log("Validation passed: mainCategory is not empty."); // Add log

    console.log("Checking content..."); // Add log
    if (!content) {
      console.log("Validation failed: content is empty."); // Add log
      useToastToast({
        title: "Error",
        description: "Content is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    console.log("Validation passed: content is not empty."); // Add log


    // 콘텐츠 sanitize 처리
    const sanitizedContent = sanitizeContent(content);
    console.log("Content sanitized."); // Add log

    // 유튜브 링크 감지 및 처리
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = sanitizedContent.match(youtubeRegex);
    console.log("YouTube link detection result:", youtubeMatch); // Add log

    // 썸네일 설정
    let thumbnailUrl = imgUrl;  // 기존 이미지 URL 사용

    // YouTube 링크가 있고 이미지를 따로 설정하지 않은 경우 YouTube 썸네일 사용
    if (youtubeMatch && youtubeMatch[1] && !thumbnailUrl) {
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
      console.log("YouTube 썸네일 자동 설정:", thumbnailUrl);
    }
    console.log("Final thumbnail URL:", thumbnailUrl); // Add log


    // 데이터베이스에 저장할 데이터
    const finalData = {
      title,
      content: sanitizedContent,
      category: mainCategory,
      subcategory: subCategory || "",
      subsubcategory: subSubCategory || "",
      description: description || "",
      image_url: thumbnailUrl,
      is_slide: isSlide,
      ...(isSlide && slideOrder !== null ? { slide_order: slideOrder } : {}),
      // 추가된 필드들
      video_url: youtubeMatch ? `https://www.youtube.com/watch?v=${youtubeMatch[1]}` : null,
      video_thumbnail_url: youtubeMatch ? `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg` : null,
      has_links: sanitizedContent.includes('http') || sanitizedContent.includes('www.'),
    };

    let error = null; // Initialize error to null
    let articleId = id;

    // slide_order를 finalData에 조건부로 추가
    const dataToSave = {
      title,
      content: sanitizedContent,
      category: mainCategory,
      subcategory: subCategory || "",
      subsubcategory: subSubCategory || "",
      description: description || "",
      image_url: thumbnailUrl,
      is_slide: isSlide,
      video_url: youtubeMatch ? `https://www.youtube.com/watch?v=${youtubeMatch[1]}` : null,
      video_thumbnail_url: youtubeMatch ? `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg` : null,
      has_links: sanitizedContent.includes('http') || sanitizedContent.includes('www.'),
      date: formData.date, // Include the date from formData
    };

    if (isSlide && slideOrder !== null) {
      (dataToSave as any).slide_order = slideOrder;
    } else {
       // is_slide가 false이거나 slideOrder가 null이면 slide_order를 명시적으로 null로 설정
       (dataToSave as any).slide_order = null;
    }


    console.log("Attempting to save article data:", dataToSave); // Log data before saving

    // Supabase 호출 전 로그
    console.log("Calling Supabase to save article...");

    let supabaseResponse;
    if (id) {
      console.log("Updating existing article with ID:", id); // Log update attempt
      supabaseResponse = await supabase
        .from("posts")
        .update(dataToSave)
        .eq("id", id)
        //.eq("user_id", adminUser.id); // Consider if user_id check is needed here

      // Supabase 업데이트 호출 후 로그
      console.log("Supabase update call finished. Response:", supabaseResponse);

      if (supabaseResponse.error) {
        error = supabaseResponse.error;
        console.error("Supabase update error:", error); // Log update error (corrected variable name)
      } else if (supabaseResponse.count === 0) {
        // This case might indicate the article wasn't found or user_id didn't match if uncommented
        console.warn("Supabase update affected 0 rows. Article ID:", id);
        alert("You are not the author of this article or article not found.");
        useToastToast({
          title: "Warning",
          description: "You are not the logged in user or article not found.",
          variant: "destructive",
        });
        // Instead of returning, throw an error to be caught by the catch block
        throw new Error("You are not the logged in user or article not found.");
      } else {
        console.log("Supabase update successful. Count:", supabaseResponse.count); // Log update success
      }
    } else {
      console.log("Inserting new article."); // Log insert attempt
     supabaseResponse = await supabase
        .from("posts")
        .insert([{ ...dataToSave, user_id: adminUser.id }])
        .select();

      // Supabase 삽입 호출 후 로그
      console.log("Supabase insert call finished. Response:", supabaseResponse);

      if (supabaseResponse.error) {
        error = supabaseResponse.error;
        console.error("Supabase insert error:", supabaseResponse.error); // Log insert error
      } else if (supabaseResponse.data && Array.isArray(supabaseResponse.data) && supabaseResponse.data.length > 0) {
        articleId = (supabaseResponse.data as Post[])[0].id;
        console.log("Supabase insert successful. New article ID:", articleId); // Log insert success
      } else {
         console.warn("Supabase insert returned no data."); // Log if insert returns no data
         // Depending on Supabase version/config, this might be an error
         error = new Error("Supabase insert returned no data.");
      }
    }

    if (error) {
      console.error("Article save failed:", error); // Log overall failure
      useToastToast({
        title: "Error",
        description: `Failed to ${id ? "update" : "create"} article: ${error.message || error.toString()}`, // Include error message
        variant: "destructive",
      });
    } else {
      console.log("Article saved successfully. Redirecting..."); // Log overall success
      useToastToast({
        title: "Success",
        description: `Article ${id ? "updated" : "created"} successfully`,
      });

      // Generate category URL and redirect
      let categoryUrl = '/';

      if (mainCategory) {
        // 1. 메인 카테고리만 있는 경우
        categoryUrl = `/${mainCategory}`;

        // 2. 하위 카테고리까지 있는 경우
        if (subCategory) {
          categoryUrl = `/${mainCategory}/${subCategory}`;
        }
      }
      console.log("Redirecting to:", categoryUrl); // Add log
      router.push(categoryUrl);
    }
  } catch (err: any) { // Catch any type of error
    console.error("Unexpected error during article save:", err); // Log unexpected error
    // catch 블록 내부 로그
    console.log("Caught an error in handleSubmit:", err);
    useToastToast({
      title: "Error",
      description: `An unexpected error occurred: ${err.message || err.toString()}`, // Include error message
      variant: "destructive",
    });
  } finally {
    // Ensure isSubmitting is always set to false here
    // finally 블록 내부 로그
    console.log("Finally block reached. Setting isSubmitting to false.");
    setIsSubmitting(false);
  }
};

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-white px-4 py-4">
      <h1 className="text-3xl font-bold mb-6">
        {id ? "Edit" : "New"} Article
      </h1>
      <form onSubmit={(e) => { console.log("Form onSubmit event triggered."); handleSubmit(e); }} className="space-y-4 w-full max-w-3xl">
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
        {/* Date */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date ? formData.date.split('T')[0] : ""} // Format date for input type="date"
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* Content */}
        <div>
          <EditorWithUploader
            value={content}
            onChangeAction={(newContent) => {
              setContent(newContent);
              console.log('Editor new content:', newContent); // Added log

              // 콘텐츠가 변경될 때마다 첫 번째 이미지 추출하여 image_url 설정
              if (!imgUrl) {
                const firstImage = extractFirstImage(newContent);
                if (firstImage) {
                  setImgUrl(firstImage);
                  console.log("첫 번째 이미지를 대표 이미지로 설정:", firstImage);
                }
              }
            }}
            onImageUpload={handleImageUpload}
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
        {/* 업로드된 이미지 목록 표시 */}
        {uploadedImages.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">업로드된 이미지</h3>
            <p className="text-sm text-gray-500 mb-3">썸네일로 사용할 이미지를 선택하세요</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((image, index) => (
                <div
                  key={image.timestamp}
                  className={`relative border-2 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
                    thumbnailUrl === image.url ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => handleSelectThumbnail(image.url)}
                >
                  <img
                    src={image.url}
                    alt={`업로드 이미지 ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                  {thumbnailUrl === image.url && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      썸네일
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 현재 썸네일 표시 (편집 시) */}
        {id && thumbnailUrl && !uploadedImages.some(img => img.url === thumbnailUrl) && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">현재 썸네일</h3>
            <div className="w-56 h-40 border-2 border-blue-500 rounded-md overflow-hidden">
              <img
                src={thumbnailUrl}
                alt="현재 썸네일"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
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
