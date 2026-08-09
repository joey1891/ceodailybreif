import { Metadata } from 'next';
import { supabase } from '@/utils/supabase';
import ArticleClient from './ArticleClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: any): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const articleId = resolvedParams?.id;
  // 💡 URL에서 공유된 언어 파라미터를 읽어옵니다.
  const targetLang = resolvedParams?.lang || 'en'; 

  if (!articleId) {
    return { title: 'CEO Daily Brief' };
  }

  // 💡 메타데이터 생성 시번역본(translations)도 함께 가져옵니다.
  const { data: article } = await supabase
    .from('articles')
    .select('title, image_url, translations')
    .eq('id', articleId)
    .single();

  if (!article) {
    return { title: 'CEO Daily Brief' };
  }

  // 💡 SNS 미리보기 썸네일용 기사 제목 추출 (해당 언어 우선)
  let displayTitle = article.title;
  
  if (targetLang !== 'en' && article.translations && article.translations[targetLang] && article.translations[targetLang].title) {
    // 공유된 언어로 직접 작성된 제목이 있으면 사용
    displayTitle = article.translations[targetLang].title;
  } else if (typeof article.title === 'object') {
    // 옛날 데이터(객체) 처리 호환성 유지
    displayTitle = article.title.en || article.title.ko || 'CEO Daily Brief';
  }

  return {
    title: `${displayTitle} | CEO Daily Brief`,
    openGraph: {
      title: displayTitle,
      description: 'Click to read the full article on CEO Daily Brief.',
      images: [
        {
          url: article.image_url || '/main-thumbnail.jpg',
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
      url: `https://www.ceodailybrief.com/article?id=${articleId}&lang=${targetLang}`,
    },
  };
}

export default function ArticlePage() {
  return <ArticleClient />;
}
