"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { categoryOptions } from "@/lib/category-options";

/**
 * DB에 저장된 메인 카테고리 slug 값을 받아서,
 * categoryOptions에서 한글 title을 찾아 반환.
 */
function getMainCategoryTitle(mainSlug: string): string {
  for (const option of categoryOptions.values()) {
    const optionMainSlug = option.base
      ? option.base.replace(/^\//, "")
      : option.title.toLowerCase().replace(/\s+/g, "-");
    if (optionMainSlug === mainSlug) {
      return option.title;
    }
  }
  return mainSlug;
}

/**
 * DB에 저장된 서브 카테고리 slug 값을 받아서,
 * 해당 메인 카테고리에 맞는 항목에서 한글 title을 찾아 반환.
 */
function getSubCategoryTitle(mainSlug: string, subSlug: string): string {
  for (const option of categoryOptions.values()) {
    const optionMainSlug = option.base
      ? option.base.replace(/^\//, "")
      : option.title.toLowerCase().replace(/\s+/g, "-");
    if (optionMainSlug === mainSlug) {
      const found = option.items.find((item) => item.slug === subSlug);
      return found ? found.title : subSlug;
    }
  }
  return subSlug;
}

export default function AdminArticlesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 10;
  const router = useRouter();
  const { toast } = useToast();

  // 필터 상태: 기본값은 "all"
  const [filterMainCategory, setFilterMainCategory] = useState("all");
  const [filterSubCategory, setFilterSubCategory] = useState("all");

  // 필터 조건이나 페이지 변경 시 게시글 다시 조회
  useEffect(() => {
    fetchPosts();
  }, [currentPage, filterMainCategory, filterSubCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    const start = (currentPage - 1) * postsPerPage;
    const end = currentPage * postsPerPage - 1;

    let query = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, end);

    if (filterMainCategory !== "all") {
      query = query.eq("category", filterMainCategory);
    }
    if (filterSubCategory !== "all") {
      query = query.eq("subcategory", filterSubCategory);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive",
      });
    } else if (data) {
      setPosts(data);
      if (count !== null) {
        setTotalPosts(count);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Article deleted successfully",
      });
      fetchPosts();
    }
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // 메인 카테고리 필터 변경 핸들러
  const handleFilterMainCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFilterMainCategory(value);
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

  // 필터용 메인 카테고리 옵션 배열 생성 ("all" 옵션 포함)
  const mainCategoryOptions = Array.from(categoryOptions.values()).map(
    (option) => {
      const slug = option.base
        ? option.base.replace(/^\//, "")
        : option.title.toLowerCase().replace(/\s+/g, "-");
      return { title: option.title, slug };
    }
  );

  // 선택된 메인 카테고리에 따른 서브 카테고리 옵션 배열 생성
  let subCategoryOptions: { title: string; slug: string }[] = [];
  if (filterMainCategory !== "all") {
    const category = Array.from(categoryOptions.values()).find((option) => {
      const slug = option.base
        ? option.base.replace(/^\//, "")
        : option.title.toLowerCase().replace(/\s+/g, "-");
      return slug === filterMainCategory;
    });
    if (category) {
      subCategoryOptions = category.items.map((item) => ({
        title: item.title,
        slug: item.slug,
      }));
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 영역: 제목과 필터 */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Article Management</h1>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <select
            value={filterMainCategory}
            onChange={handleFilterMainCategoryChange}
            className="border rounded p-2"
          >
            <option value="all">All Main Category</option>
            {mainCategoryOptions.map((opt) => (
              <option key={opt.slug} value={opt.slug}>
                {opt.title}
              </option>
            ))}
          </select>
          <select
            value={filterSubCategory}
            onChange={handleFilterSubCategoryChange}
            className="border rounded p-2"
            disabled={filterMainCategory === "all"}
          >
            <option value="all">All Sub Category</option>
            {subCategoryOptions.map((opt) => (
              <option key={opt.slug} value={opt.slug}>
                {opt.title}
              </option>
            ))}
          </select>
          <Button asChild>
            <Link href="/admin/articles/new">
              <Plus className="mr-2 h-4 w-4" />
              New Article
            </Link>
          </Button>
        </div>
      </div>

      {/* 게시글 테이블 */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Main Category</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead>Created_at</TableHead>
              {/* <TableHead>Creator</TableHead> */}
              <TableHead>Slide</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{getMainCategoryTitle(post.category)}</TableCell>
                <TableCell>
                  {post.subcategory
                    ? getSubCategoryTitle(post.category, post.subcategory)
                    : "-"}
                </TableCell>
                <TableCell>
                  {new Date(post.created_at).toLocaleDateString()}
                </TableCell>
                {/* <TableCell>{post.user_id}</TableCell> */}
                <TableCell>
                  <input
                    type="checkbox"
                    checked={post.is_slide}
                    disabled
                    className="mr-2"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        router.push(`/admin/articles/edit/${post.id}`)
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-4">
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
