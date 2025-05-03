import { supabase } from "@/lib/supabase";
import ArticleForm from "@/components/article-form";

// ✅ Next.js가 빌드 시점에 사용할 `id` 목록을 가져옴
export async function generateStaticParams() {
  const { data } = await supabase
    .from("posts")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data || []).map((post) => ({
    id: post.id.toString(),
  }));
}

// 폼 제출 전 콘텐츠 정리 함수 간소화
const sanitizeContent = (content: string) => {
  // 콘텐츠가 없으면 빈 문자열 반환
  if (!content) return '';
  
  // 기본 정리만 수행하고 원본 유지
  return content;
};

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) {
    return <div>Article not found</div>;
  }

  // id prop을 명시적으로 전달하도록 수정
  return <ArticleForm id={id} post={post} />;
}
