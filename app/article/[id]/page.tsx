import { notFound } from "next/navigation";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import Link from "next/link";
import { ShareButtons } from "@/components/share-buttons"; // 클라이언트 컴포넌트 임포트

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!post) {
    return {
      title: "Article Not Found",
      description: "The requested article could not be found."
    };
  }

  return {
    title: post.title,
    description: post.description || post.title,
    openGraph: post.image_url ? {
      images: [{ url: post.image_url }]
    } : undefined
  };
}

export default async function ArticlePage({ params }: Props) {
  console.log("Loading article with ID:", params.id);

  // 기사 데이터 가져오기
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single();
  
  // 에러 로깅
  if (error) {
    console.error("Error fetching article:", error);
  }

  // 기사가 없으면 404
  if (!post) {
    return notFound();
  }

  // 조회수 증가 (에러 발생해도 페이지 표시에는 영향 없게)
  try {
    await supabase
      .from("posts")
      .update({ viewcnt: (post.viewcnt || 0) + 1 })
      .eq("id", params.id);
  } catch (e) {
    console.error("Error updating view count:", e);
  }

  // 연관 기사 가져오기 (최대 3개, 같은 카테고리)
  const { data: related } = await supabase
    .from("posts")
    .select("*")
    .eq("category", post.category)
    .eq("is_deleted", false)
    .neq("id", params.id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/${post?.category}`} className="mb-4 inline-block">
        &larr; 뒤로 가기
      </Link>
      <ArticleHeader post={post as Post} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <ArticleContent content={post.content} />
          {/* 클라이언트 컴포넌트 사용 */}
          <ShareButtons post={post as Post} />
        </div>
        <div className="space-y-8">
          <RelatedArticles articles={related as Post[] || []} />
        </div>
      </div>
    </div>
  );
}

function ArticleContent({ content }: { content: string }) {
  return (
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
  );
}

function ArticleHeader({ post }: { post: Post }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
      <div className="text-sm text-gray-500">
        {new Date(post.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}

function RelatedArticles({ articles }: { articles: Post[] }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">관련 기사</h3>
      {articles.length > 0 ? (
        <ul className="space-y-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link 
                href={`/article/${article.id}`}
                className="block hover:text-blue-600"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">관련 기사가 없습니다.</p>
      )}
    </div>
  );
}