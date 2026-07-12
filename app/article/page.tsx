import { Metadata } from 'next';
import { supabase } from '@/utils/supabase';
import ArticleClient from './ArticleClient'; // 분리해둔 기존 파일을 불러옵니다.

// 썸네일(OG 태그)을 동적으로 생성하는 서버 컴포넌트 전용 코드
export async function generateMetadata({ searchParams }: any): Promise<Metadata> {
  const articleId = searchParams?.id;

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
        },
      ],
      type: 'article',
    },
  };
}

// 클라이언트 컴포넌트를 호출하여 기존 화면을 그대로 그려줍니다.
export default function ArticlePage() {
  return <ArticleClient />;
}
