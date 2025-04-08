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

  return <ArticleForm post={post} />;
}
