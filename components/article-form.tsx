"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import { categoryOptions } from "@/lib/category-options";
import dynamic from "next/dynamic";
import { categoryMappings } from '@/lib/category-mappings';

const EditorWithUploader = dynamic(
  () => import("@/components/editorWith-uploader"),
  {
    ssr: false,
    loading: () => <p>Loading Editor...</p>,
  }
);

interface ArticleFormProps {
  id?: string;
}

// 한글 카테고리를 영문으로 변환하는 매핑 추가
// const categoryMappings = { ... }; 부분 삭제

export default function ArticleForm({ id }: ArticleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { adminUser, loading: adminLoading } = useAdminSession();

  // Map에서 메인 카테고리 키 배열을 추출
  const mainCategoryKeys = Array.from(categoryOptions.keys());
  const defaultMainCategory = mainCategoryKeys[0] || "";
  // 기본 서브 카테고리는 해당 메인 카테고리의 첫번째 항목의 title (없으면 빈 문자열)
  const defaultSubCategory =
    categoryOptions.get(defaultMainCategory)?.items[0]?.title || "";

  const [title, setTitle] = useState("");
  const [mainCategory, setMainCategory] = useState(defaultMainCategory);
  const [subCategory, setSubCategory] = useState(defaultSubCategory);
  const [subSubCategory, setSubSubCategory] = useState("");
  const [content, setContent] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // 관리자 로그인 확인
  useEffect(() => {
    if (!adminLoading && !adminUser) {
      router.push("/admin/login");
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
        toast({
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
  }, [id, router, toast]);

  const handleMainCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newMain = e.target.value;
    setMainCategory(newMain);
    const selectedCategory = categoryOptions.get(newMain);
    if (selectedCategory && selectedCategory.items.length > 0) {
      setSubCategory(selectedCategory.items[0].title);
    } else {
      setSubCategory("");
    }
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSub = e.target.value;
    setSubCategory(newSub);
    setSubSubCategory("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!adminUser) {
        toast({
          title: "Error",
          description:
            "You must be logged in as admin to save articles.",
          variant: "destructive",
        });
        return;
      }

      // 한글 카테고리명을 영문으로 변환
      const mainCategoryEnglish = categoryMappings[mainCategory] || mainCategory.toLowerCase().replace(/\s+/g, "-");
      
      // 메인 카테고리 객체
      const selectedMainCategory = categoryOptions.get(mainCategory);
      
      // 메인 카테고리 슬러그 결정
      const mainCategorySlug = mainCategoryEnglish;
      
      // 서브 카테고리 찾기
      const selectedSubCategory = selectedMainCategory?.items.find(
        (item) => item.title === subCategory
      );
      
      // 서브 카테고리 슬러그
      const subCategorySlug = selectedSubCategory?.slug || "";
      
      // 서브서브 카테고리 처리
      let subSubCategorySlug = "";
      if (selectedSubCategory && "items" in selectedSubCategory && selectedSubCategory.items) {
        const selectedSubSubCategory = selectedSubCategory.items.find(
          (item) => item.title === subSubCategory
        );
        subSubCategorySlug = selectedSubSubCategory?.slug || "";
      }
      
      // 계층 구조 검증: 서브서브카테고리가 있으면 반드시 서브카테고리도 있어야 함
      if (subSubCategorySlug && !subCategorySlug) {
        toast({
          title: "Warning",
          description: "Cannot select a sub-sub category without a sub category",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const articleData: any = {
        title,
        // 영문 카테고리명 사용
        category: mainCategorySlug,
        subcategory: subCategorySlug,
        subsubcategory: subSubCategorySlug,
        content,
        date: new Date().toISOString().split("T")[0],
        is_slide: mainCategorySlug === "report",
      };
      if (mainCategory === "Report" || mainCategorySlug === "report") {
        articleData.description = description;
        if (imgUrl.trim() !== "") {
          articleData.image_url = imgUrl.trim();
        }
      }
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
          toast({
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
        toast({
          title: "Error",
          description: `Failed to ${id ? "update" : "create"} article`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Article ${id ? "updated" : "created"} successfully`,
        });
        router.push("/admin");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading) {
    return <div>Loading...</div>;
  }

  // 현재 선택된 메인 카테고리의 옵션 객체
  const currentCategory = categoryOptions.get(mainCategory);
  const currentSubCategory = currentCategory?.items.find(item => item.title === subCategory);
  
  // 현재 서브 카테고리에 하위 항목이 있는지 확인
  const hasSubSubCategories = currentSubCategory && 'items' in currentSubCategory && 
    currentSubCategory.items && currentSubCategory.items.length > 0;

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
            <select
              id="mainCategory"
              value={mainCategory}
              onChange={handleMainCategoryChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              {mainCategoryKeys.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {currentCategory && currentCategory.items.length > 0 && (
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
                onChange={handleSubCategoryChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                {currentCategory.items.map((sub) => (
                  <option key={sub.title} value={sub.title}>
                    {sub.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          {hasSubSubCategories && (
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
                  <option key={subSub.title} value={subSub.title}>
                    {subSub.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {/* Slider Options: Report 카테고리일 때 바로 표시 (카테고리 선택 바로 아래) */}
        {(mainCategory === "Report" ||
          (selectedMainCategory => {
            // 만약 mainCategory가 "Report"가 아니더라도, base slug가 report라면
            const cat = categoryOptions.get(mainCategory);
            return cat?.base?.replace(/^\//, "") === "report";
          })(mainCategory)) && (
          <div className="border p-4 rounded bg-gray-50 mt-4">
            <div className="mb-4">
              <label
                htmlFor="imgUrl"
                className="block text-sm font-medium text-gray-700"
              >
                Image URL
              </label>
              <input
                type="text"
                id="imgUrl"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-24"
                placeholder="Enter description for slider"
              ></textarea>
            </div>
          </div>
        )}
        {/* Content */}
        <div>
          <h1>Test Editor Page</h1>
          <EditorWithUploader value={content} onChange={setContent} />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white p-2 rounded w-full"
          >
            {loading
              ? id
                ? "Updating..."
                : "Creating..."
              : id
              ? "Update Article"
              : "Create Article"}
          </button>
        </div>
      </form>
    </div>
  );
}
