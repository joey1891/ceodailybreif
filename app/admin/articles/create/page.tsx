import ArticleForm from "@/components/article-form";
import { redirect } from "next/navigation";

export default function NewArticlePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  // URL 쿼리 파라미터에서 카테고리 ID 가져오기
  const { category } = searchParams;
  
  // 선택된 카테고리 ID가 있으면 ArticleForm에 전달
  return <ArticleForm defaultCategory={category} />;
}
