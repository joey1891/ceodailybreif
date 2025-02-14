import { supabase } from "@/lib/supabase";
import { ArticleContent } from "./article-content";

export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('posts')
    .select('id');

  return (posts || []).map((post) => ({
    id: post.id,
  }));
}

export default function ArticlePage({ params }: { params: { id: string } }) {
  return <ArticleContent params={params} />;
}