import { notFound } from "next/navigation";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import Link from "next/link";
import { ShareButtons } from "@/components/share-buttons";
import { isAdmin } from "@/lib/admin-auth-server";
import AdminStatusClient from "./admin-status-client";
import ArticleContent from "./article-content-client";
import RelatedArticles from "@/components/related-articles";

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

// YouTube 비디오 임베드 컴포넌트 추가
const YouTubeEmbed = ({ videoId }: { videoId: string }) => {
  return (
    <div className="aspect-video w-full my-4">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-md"
      ></iframe>
    </div>
  );
};

// YouTube 비디오 ID 추출 함수
const extractYouTubeVideoId = (content: string) => {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const matches = [];
  let match;
  
  while ((match = youtubeRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
};

// 콘텐츠 처리 간소화 - 최소한의 정리만 수행
const processArticleContent = (content: string) => {
  if (!content) return '';
  
  // 기본 정리만 수행
  return content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
};

export default async function ArticlePage({ params }: Props) {
  console.log("Loading article with ID:", params.id);

  // 관리자 여부 확인
  const isAdminUser = await isAdmin();
  console.log("Is admin user:", isAdminUser);

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

  // 오류 처리 추가
  if (!post || !post.content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 rounded-md">
          <h2 className="text-xl font-bold text-red-800">게시글을 찾을 수 없습니다</h2>
          <p className="text-red-700 mt-2">요청하신 게시글이 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
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
    .eq("is_draft", false)
    .neq("id", params.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // 최소한으로 처리된 콘텐츠
  const processedContent = processArticleContent(post.content);
  console.log("서버에서 처리된 콘텐츠:", processedContent.substring(0, 100)); // 디버깅용 (처음 100자만)

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminStatusClient serverAdminStatus={isAdminUser} />
      
      <Link href={`/${post?.category}`} className="mb-4 inline-block">
        &larr; 뒤로 가기
      </Link>
      <ArticleHeader post={post as Post} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <ArticleContent content={processedContent} />
          <ShareButtons post={post as Post} />
        </div>
        <div className="space-y-8 relative">
          {/* 바로 여기에 수정 버튼을 추가 - 관련 기사 박스 위에 오른쪽 정렬로 배치 */}
          {isAdminUser && (
            <div className="flex justify-end mb-4">
              <Link
                href={`/admin/articles/edit/${params.id}`}
                className="inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                수정
              </Link>
            </div>
          )}
          <RelatedArticles articles={related as Post[] || []} />
        </div>
      </div>
    </div>
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
