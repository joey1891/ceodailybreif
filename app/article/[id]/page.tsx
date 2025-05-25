import { notFound } from "next/navigation";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import Link from "next/link";
import { ShareButtons } from "@/components/share-buttons";
import { isAdmin } from "@/lib/admin-auth-server";
import AdminStatusClient from "./admin-status-client";
import ArticleContent from "./article-content-client";

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

// YouTube 비디오 ID 추출 함수 (기존 것 활용 또는 개선)
const extractYouTubeVideoIdsInContent = (content: string): string[] => {
  if (!content) return [];
  // 이 정규식은 일반 텍스트 내의 유튜브 URL에서 ID를 추출합니다.
  // 만약 HTML 내의 <a> 태그 href 에서만 찾아야 한다면, article-content-client.tsx의 findYouTubeUrls 와 유사한 접근이 필요합니다.
  // 여기서는 일반 텍스트 내 URL을 가정합니다.
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const matches: string[] = [];
  let match;
  while ((match = youtubeRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

// 콘텐츠 처리: HTML 엔티티 디코딩 및 YouTube 첫번째 비디오 상단 임베드
const processAndEmbedYouTubeContent = (content: string): string => {
  if (!content) return '';

  let processed = content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");

  const videoIds = extractYouTubeVideoIdsInContent(processed); // 본문 전체에서 ID 추출
  
  if (videoIds.length > 0) {
    const firstVideoId = videoIds[0];
    const embedHtml = `
      <div class="aspect-video w-full my-6">
        <iframe
          src="https://www.youtube.com/embed/${firstVideoId}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          class="w-full h-full rounded-md"
          style="border:0;"
        ></iframe>
      </div>
    `;
    // 첫 번째 비디오를 콘텐츠 상단에 추가
    processed = embedHtml + processed;
  }
  
  return processed;
};

export default async function ArticlePage({ params }: Props) {
  console.log("Loading article with ID:", params.id);

  // 병렬 데이터 로딩
  const [isAdminUser, postData, relatedData] = await Promise.all([
    isAdmin(),
    supabase
      .from("posts")
      .select("*")
      .eq("id", params.id)
      .single(),
    supabase // 관련 기사 로딩
      .from("posts")
      .select("*")
      // .eq("category", post?.category) // post.category를 사용하려면 post를 먼저 가져와야 하므로, 이 부분은 조정 필요
      .eq("is_deleted", false)
      .neq("id", params.id)
      .order("created_at", { ascending: false })
      .limit(3)
  ]);

  console.log("Is admin user:", isAdminUser);

  const { data: post, error: postError } = postData;

  if (postError) {
    console.error("Error fetching article:", postError);
  }

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

  // 조회수 증가는 페이지 렌더링을 차단하지 않도록 처리 (예: 응답 후 비동기 처리 또는 에러만 로깅)
  // 이 작업은 페이지 로딩 속도에 민감하므로, 가능하다면 API 엔드포인트를 만들어 클라이언트에서 호출하거나,
  // Next.js의 revalidate 또는 다른 백그라운드 작업으로 처리하는 것을 고려할 수 있습니다.
  // 여기서는 일단 에러만 로깅하고 넘어갑니다.
  supabase
    .from("posts")
    .update({ viewcnt: (post.viewcnt || 0) + 1 })
    .eq("id", params.id)
    .then(({ error: viewCntError }) => {
      if (viewCntError) {
        console.error("Error updating view count:", viewCntError);
      }
    });

  // post.category가 필요하므로, related 기사 로딩은 post를 가져온 후 실행하거나,
  // 카테고리 없이 가져오거나, 별도의 로직으로 처리해야 합니다.
  // 여기서는 post.category를 사용하기 위해 postData 이후에 related를 가져오도록 수정합니다.
  // 또는, Promise.all 외부에서 post.category를 사용하여 다시 호출합니다.
  // 더 나은 방법은 category ID를 알고 있다면 Promise.all에 포함시키는 것입니다.
  // 여기서는 간단하게 post.category를 사용합니다.
  const { data: related } = await supabase
    .from("posts")
    .select("*")
    .eq("category", post.category) // post.category 사용
    .eq("is_deleted", false)
    .neq("id", params.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // 서버에서 콘텐츠 처리 (YouTube 임베드 포함)
  const processedContent = processAndEmbedYouTubeContent(post.content);
  console.log("서버에서 처리된 콘텐츠 (첫 100자):", processedContent.substring(0, 100));

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminStatusClient serverAdminStatus={isAdminUser} />
      
      <Link href={`/${post?.category}`} className="mb-4 inline-block">
        &larr; 뒤로 가기
      </Link>
      <ArticleHeader post={post as Post} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <ArticleContent content={processedContent} /> {/* 서버에서 처리된 콘텐츠 전달 */}
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
