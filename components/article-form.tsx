"use client";

import { useEffect, useState, useCallback } from "react";
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

// 이미지 추출 함수 개선 (파일 상단에 추가)
const extractFirstImage = (htmlContent: string): string | null => {
  // 더 유연한 정규식으로 변경 (속성 순서와 공백에 상관없이 작동)
  const imgRegex = /<img[\s\S]*?src=["']([^"']+)["'][\s\S]*?>/i;
  const match = htmlContent.match(imgRegex);
  
  if (match && match[1]) {
    // 이미지 URL이 확실히 추출되었는지 확인
    console.log("추출된 이미지 URL:", match[1]);
    return match[1];
  }
  
  return null;
};

// 모든 이미지 추출 함수 추가 (파일 상단에 추가)
const extractAllImages = (htmlContent: string): string[] => {
  const imgRegex = /<img[\s\S]*?src=["']([^"']+)["'][\s\S]*?>/gi;
  const matches = [];
  let match;
  
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    if (match[1]) {
      matches.push(match[1]);
    }
  }
  
  return matches;
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

  // 게시글 편집 시 기존 데이터 로드 부분 수정
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
      setIsSlide(data.is_slide || false);
      setSlideOrder(data.slide_order || null);
      
      // 이미지 URL 설정
      if (data.image_url) {
        setThumbnailUrl(data.image_url);
      }
      
      // 컨텐츠에서 모든 이미지 추출하여 업로드된 이미지 목록에 추가 (중복 제거 로직은 handleEditorContentChange에서 처리)
      // 이 부분은 handleEditorContentChange가 content 상태 변경 시 처리하므로,
      // 초기 content 설정 후 handleEditorContentChange가 호출되도록 유도하거나,
      // 여기서 직접 uploadedImages를 설정한다면 중복 제거 로직을 적용해야 합니다.
      // 현재는 content가 설정되면 handleEditorContentChange가 호출되어 uploadedImages를 동기화합니다.
      
      if (data.category === "Report" || data.category === "report") {
        setDescription(data.description || "");
      }
    }
    fetchArticle();
  }, [id, router, useToastToast]); // setContent는 의존성 배열에 포함하지 않아도 됨 (useState setter는 안정적)

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

  // Initialize content, uploadedImages, and thumbnail from post data on load or when post changes
  useEffect(() => {
    const initialContent = post?.content || "";
    setContent(initialContent); // Set initial content for the editor state

    // 초기 콘텐츠를 기반으로 uploadedImages 및 thumbnailUrl 설정
    // handleEditorContentChange가 초기 content에 대해 호출되도록 하여 uploadedImages를 동기화
    // 이 useEffect는 post가 변경될 때 실행되므로, 초기 로드 및 post 데이터 변경 시 모두 처리
    handleEditorContentChange(initialContent); // 초기 콘텐츠로 이미지 목록 동기화

    if (post?.image_url) {
      setThumbnailUrl(post.image_url);
    } else {
      // 초기 콘텐츠에 이미지가 있고, 명시적 썸네일이 없다면 첫 번째 이미지를 썸네일로 설정
      const imagesFromInitialContent = extractAllImages(initialContent);
      if (imagesFromInitialContent.length > 0) {
        setThumbnailUrl(imagesFromInitialContent[0]);
      } else {
        setThumbnailUrl("");
      }
    }
  }, [post]); // handleEditorContentChange를 의존성 배열에 추가할 필요는 없음 (useCallback으로 안정화)

  // Callback for when editor content changes (typing, undo, redo, paste, image add/delete etc.)
  const handleEditorContentChange = useCallback((newEditorContent: string) => {
    setContent(newEditorContent); // Update our local content state

    // Synchronize uploadedImages based on the new editor content, ensuring uniqueness
    const currentImageUrlsInEditor = extractAllImages(newEditorContent);
    
    setUploadedImages(prevUploadedImages => {
      const newUploadedImages: UploadedImage[] = [];
      const processedUrls = new Set<string>(); // 중복 URL 처리를 위한 Set

      // 에디터 내 현재 이미지 URL 순서대로 처리
      for (const url of currentImageUrlsInEditor) {
        if (!processedUrls.has(url)) { // 아직 처리되지 않은 URL인 경우에만 추가
          const existingImage = prevUploadedImages.find(img => img.url === url);
          if (existingImage) {
            newUploadedImages.push(existingImage); // 기존 객체 재사용 (타임스탬프 유지)
          } else {
            newUploadedImages.push({ url, timestamp: Date.now() - Math.random() * 1000 }); // 새 객체
          }
          processedUrls.add(url);
        }
      }
      return newUploadedImages;
    });
  }, [extractAllImages]); // setContent는 안정적이므로 의존성 배열에서 제외 가능

  // Effect to manage the thumbnail URL whenever the editor's content changes
  useEffect(() => {
    // uploadedImages가 업데이트된 후 이 useEffect가 실행되어 썸네일 로직을 처리
    const currentImageUrlsInEditor = uploadedImages.map(img => img.url); // uploadedImages에서 URL 목록 가져오기

    if (thumbnailUrl && !currentImageUrlsInEditor.includes(thumbnailUrl)) {
      // Current thumbnail is no longer in the editor
      if (currentImageUrlsInEditor.length > 0) {
        // Pick the last image (or first, by convention) in the current content as the new thumbnail
        setThumbnailUrl(currentImageUrlsInEditor[0]); // 첫 번째 이미지로 설정
        toast("썸네일이 편집기에서 삭제되어 다른 이미지로 자동 변경되었습니다.");
      } else {
        setThumbnailUrl(""); // No images left
        toast("썸네일이 편집기에서 삭제되었고 다른 이미지가 없어 해제되었습니다.");
      }
    } else if (!thumbnailUrl && currentImageUrlsInEditor.length > 0) {
      // No thumbnail is set, but editor has images
      setThumbnailUrl(currentImageUrlsInEditor[0]);
      // toast.success("편집기에 이미지가 있어 첫 번째 이미지를 썸네일로 자동 설정했습니다.");
    }
  }, [uploadedImages, thumbnailUrl]); // Rerun when uploadedImages or current thumbnail changes

  // Callback for when a new image is explicitly uploaded via the button
  const handleImageUpload = useCallback((imageUrl: string) => {
    // 에디터에 이미지가 삽입되면, 에디터의 onChange 콜백 (handleEditorContentChange)이 호출되어
    // content 상태와 uploadedImages 상태를 동기화합니다.
    // 따라서 여기서 uploadedImages를 직접 조작할 필요는 줄어듭니다.
    // handleEditorContentChange가 이미 중복을 처리하고 타임스탬프를 관리합니다.

    // 만약 업로드된 이미지가 현재 썸네일이 없는 경우, 이 이미지를 썸네일로 설정할 수 있습니다.
    setUploadedImages(prev => { // 혹시 모를 동기화 지연을 위해, 여기서도 추가는 하되 중복은 방지
        if (prev.find(img => img.url === imageUrl)) return prev;
        return [...prev, { url: imageUrl, timestamp: Date.now() }].sort((a,b) => a.timestamp - b.timestamp);
    });

    if (!thumbnailUrl) { 
      setThumbnailUrl(imageUrl);
    }
  }, [thumbnailUrl]); // setUploadedImages, setThumbnailUrl은 안정적

  // Callback for when EditorWithUploader signals an image was deleted from the editor
  const handleImageDeleteFromEditorSignal = useCallback((deletedImageUrl: string) => {
    // The actual synchronization of uploadedImages and thumbnailUrl will be handled
    // by handleEditorContentChange and the subsequent useEffect when the editor's content updates.
    // 이 함수는 즉각적인 피드백(예: toast 메시지)을 위해 유지할 수 있습니다.
    if (thumbnailUrl === deletedImageUrl) {
      toast("선택된 썸네일이 편집기에서 삭제되었습니다. 잠시 후 썸네일 목록이 업데이트됩니다.");
    }
    // uploadedImages는 handleEditorContentChange에 의해 동기화되므로 여기서 직접 필터링할 필요는 없음
  }, [thumbnailUrl]); // useToastToast 제거 (toast 직접 사용)

  // 임시 저장 상태 추가
  const [isDraft, setIsDraft] = useState(post?.is_draft || false);

  // 임시 저장 함수 추가
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      if (!adminUser) {
        useToastToast({
          title: "Error",
          description: "You must be logged in as admin to save drafts.",
          variant: "destructive",
        });
        return;
      }

      // 현재 컨텐츠에서 첫 번째 이미지 추출
      let finalThumbnailUrl = thumbnailUrl;
      if (!finalThumbnailUrl || finalThumbnailUrl.trim() === "") {
        const extractedImage = extractFirstImage(content);
        if (extractedImage) {
          finalThumbnailUrl = extractedImage;
        }
      }

      let draftData: any = {
        title: title || "제목 없음 (임시)",
        category: mainCategory || "draft",
        subcategory: subCategory || "",
        subsubcategory: subSubCategory,
        content: content || "",
        date: new Date().toISOString().split("T")[0],
        is_slide: false, // 임시저장은 슬라이드에 표시하지 않음
        description: description,
        image_url: finalThumbnailUrl && finalThumbnailUrl.trim() !== "" ? finalThumbnailUrl.trim() : null,
        is_draft: true, // 임시저장 표시
        status: "draft" // status 필드도 draft로 설정
      };
      
      let error;
      let draftId = id;
      
      if (id) {
        const { error: updateError, count } = await supabase
          .from("posts")
          .update(draftData)
          .eq("id", id);
        if (updateError) error = updateError;
      } else {
        const { error: insertError, data: newDraft } = await supabase
          .from("posts")
          .insert([{ ...draftData, user_id: adminUser.id }])
          .select();
        if (insertError) error = insertError;
        if (newDraft && Array.isArray(newDraft) && newDraft.length > 0) {
          draftId = (newDraft as Post[])[0].id;
        }
      }
      
      if (error) {
        useToastToast({
          title: "Error",
          description: `Failed to save draft`,
          variant: "destructive",
        });
      } else {
        useToastToast({
          title: "Success",
          description: `Draft saved successfully`,
        });
        
        // 임시저장 목록으로 리다이렉트
        router.push("/admin/articles");
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

      // 썸네일 URL이 없는 경우 컨텐츠에서 자동으로 추출
      let finalThumbnailUrl = thumbnailUrl;
      if (!finalThumbnailUrl || finalThumbnailUrl.trim() === "") {
        const extractedImage = extractFirstImage(content);
        if (extractedImage) {
          finalThumbnailUrl = extractedImage;
          console.log("컨텐츠에서 추출한 썸네일:", finalThumbnailUrl);
        }
      }

      // 데이터베이스에 저장할 데이터
      let articleData: any = {
        title,
        category: mainCategory,
        subcategory: subCategory || "",
        subsubcategory: subSubCategory,
        content: sanitizedContent,
        date: new Date().toISOString().split("T")[0],
        is_slide: isSlide,
        ...(isSlide && slideOrder !== null ? { slide_order: slideOrder } : {}),
        description: description,
        image_url: finalThumbnailUrl && finalThumbnailUrl.trim() !== "" ? finalThumbnailUrl.trim() : null,
        is_draft: false, // 게시 시 임시저장 상태 해제
        status: "published" // status 필드도 published로 설정
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
        image_url: finalThumbnailUrl && finalThumbnailUrl.trim() !== "" ? finalThumbnailUrl.trim() : null,
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
        console.log(`[Supabase Update] Starting update for ID: ${id}`); // Added detailed log
        supabaseResponse = await supabase
          .from("posts")
          .update(dataToSave)
          .eq("id", id)
          //.eq("user_id", adminUser.id); // Consider if user_id check is needed here

        // Supabase 업데이트 호출 후 로그
        console.log(`[Supabase Update] Update call finished. Response:`, supabaseResponse); // Added detailed log

        if (supabaseResponse.error) {
          error = supabaseResponse.error;
          console.error(`[Supabase Update] Error during update:`, error); // Added detailed log
        } else if (supabaseResponse.count === 0) {
          // This case might indicate the article wasn't found or user_id didn't match if uncommented
          console.warn(`[Supabase Update] Update affected 0 rows. Article ID: ${id}`); // Added detailed log
          alert("You are not the author of this article or article not found.");
          useToastToast({
            title: "Warning",
            description: "You are not the logged in user or article not found.",
            variant: "destructive",
          });
          // Instead of returning, throw an error to be caught by the catch block
          throw new Error("You are not the logged in user or article not found.");
        } else {
          console.log(`[Supabase Update] Update successful. Count: ${supabaseResponse.count}`); // Added detailed log
        }
      } else {
        console.log("[Supabase Insert] Starting insert for new article."); // Added detailed log
       supabaseResponse = await supabase
          .from("posts")
          .insert([{ ...dataToSave, user_id: adminUser.id }])
          .select();

        // Supabase 삽입 호출 후 로그
        console.log("[Supabase Insert] Insert call finished. Response:", supabaseResponse); // Added detailed log

        if (supabaseResponse.error) {
          error = supabaseResponse.error;
          console.error("[Supabase Insert] Error during insert:", supabaseResponse.error); // Added detailed log
        } else if (supabaseResponse.data && Array.isArray(supabaseResponse.data) && supabaseResponse.data.length > 0) {
          articleId = (supabaseResponse.data as Post[])[0].id;
          console.log(`[Supabase Insert] Insert successful. New article ID: ${articleId}`); // Added detailed log
        } else {
           console.warn("[Supabase Insert] Insert returned no data."); // Added detailed log
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
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:bg-white dark:text-gray-900 dark:border-gray-400"
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
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:bg-white dark:text-gray-900 dark:border-gray-400"
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
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:bg-white dark:text-gray-900 dark:border-gray-400"
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
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:bg-white dark:text-gray-900 dark:border-gray-400"
          />
        </div>
        {/* Content */}
        <div>
          <EditorWithUploader
            value={content}
            onChangeAction={handleEditorContentChange}
            onImageUpload={handleImageUpload}
            onImageDelete={handleImageDeleteFromEditorSignal}
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
            <h3 className="text-xl font-semibold mb-3">업로드된 이미지</h3>
            <p className="text-sm text-gray-500 mb-3">썸네일로 사용할 이미지를 선택하세요</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedImages.map((image, index) => (
                <div 
                  key={image.timestamp} 
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    thumbnailUrl === image.url 
                      ? 'border-blue-500 ring-2 ring-blue-300 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setThumbnailUrl(image.url)}
                >
                  <img 
                    src={image.url} 
                    alt={`업로드 이미지 ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                  {thumbnailUrl === image.url && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      썸네일 이미지
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                    <button 
                      type="button"
                      className={`text-xs w-full py-1 rounded ${
                        thumbnailUrl === image.url 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnailUrl(image.url);
                      }}
                    >
                      {thumbnailUrl === image.url ? '선택됨' : '썸네일 이미지로 선택'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex space-x-4 mt-6">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded flex-1"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                처리 중...
              </>
            ) : (
              "임시 저장"
            )}
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded flex-1"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                처리 중...
              </>
            ) : (
              id ? "게시글 업데이트" : "게시글 발행"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
