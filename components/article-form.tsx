"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import { categoryOptions } from "@/lib/category-options";
import dynamic from "next/dynamic";

const EditorWithUploader = dynamic(
  () => import("@/components/editorWith-uploader"),
  {
    ssr: false,
    loading: () => <p>Loading Editor...</p>,
  }
);

export default function ArticleForm() {
  const { id } = useParams();
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

      // 선택된 메인 카테고리 객체
      const selectedMainCategory = categoryOptions.get(mainCategory);
      // 메인 카테고리의 slug를 결정
      // 만약 mainCategory 객체에 base가 있다면, base의 앞쪽 '/'를 제거한 값을 slug로 사용
      // 그렇지 않다면, 간단하게 소문자 및 하이픈 변환
      const mainCategorySlug = selectedMainCategory?.base
        ? selectedMainCategory.base.replace(/^\//, "")
        : mainCategory.toLowerCase().replace(/\s+/g, "-");

      // 선택된 서브 카테고리 객체에서 slug 값을 가져옴
      const selectedSubCategory = selectedMainCategory?.items.find(
        (item) => item.title === subCategory
      );
      const subCategorySlug = selectedSubCategory?.slug || "";

      const articleData: any = {
        title,
        // DB에 저장할 때는 title 대신 slug 값을 저장
        category: mainCategorySlug,      // 예: "report", "industry", etc.
        subcategory: subCategorySlug,      // 예: "news", "medical", etc.
        content,
        date: new Date().toISOString().split("T")[0],
        is_slide: mainCategory === "Report" || mainCategorySlug === "report",
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
          .update(articleData, { returning: "representation" })
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
        const { error: insertError } = await supabase
          .from("posts")
          .insert([{ ...articleData, user_id: adminUser.id }]);
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
                onChange={(e) => setSubCategory(e.target.value)}
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
