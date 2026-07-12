import { Metadata } from 'next';
import { supabase } from '@/utils/supabase';
import ArticleClient from './ArticleClient';

// 🚨 핵심 해결책: Next.js가 페이지를 멈춰두지 못하게 강제로 매번 동적(Dynamic)으로 렌더링하도록 명령합니다.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: any): Promise<Metadata> {
  // Next.js 최신 버전을 대비하여 파라미터를 비동기(await)로 안전하게 풀어줍니다.
  const resolvedParams = await searchParams;
  const articleId = resolvedParams?.id;

  if (!articleId) {
    return { title: 'CEO Daily Brief' };
  }

  // URL의 id를 기반으로 기사 제목과 이미지를 가져옵니다.
  const { data: article } = await supabase
    .from('articles')
    .select('title, image_url')
    .eq('id', articleId)
    .single();

  if (!article) {
    return { title: 'CEO Daily Brief' };
  }

  return {
    title: `${article.title} | CEO Daily Brief`,
    openGraph: {
      title: article.title,
      description: 'Click to read the full article on CEO Daily Brief.',
      images: [
        {
          url: article.image_url || '/main-thumbnail.jpg', // 기사 이미지가 없으면 기본 로고 사용
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
      url: `https://www.ceodailybrief.com/article?id=${articleId}`,
    },
  };
}

// 클라이언트 컴포넌트를 호출하여 기존 화면을 그대로 그려줍니다.
export default function ArticlePage() {
  return <ArticleClient />;
}
