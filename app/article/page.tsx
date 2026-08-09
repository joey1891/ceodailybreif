import { Metadata } from 'next';
import { supabase } from '@/utils/supabase';
import ArticleClient from './ArticleClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: any): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const articleId = resolvedParams?.id;

  if (!articleId) {
    return { title: 'CEO Daily Brief' };
  }

  const { data: article } = await supabase
    .from('articles')
    .select('title, image_url')
    .eq('id', articleId)
    .single();

  if (!article) {
    return { title: 'CEO Daily Brief' };
  }

  // 💡 메타데이터용 타이틀 텍스트 추출
  const displayTitle = typeof article.title === 'object' 
    ? (article.title.en || article.title.ko || 'CEO Daily Brief') 
    : article.title;

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
      url: `https://www.ceodailybrief.com/article?id=${articleId}`,
    },
  };
}

export default function ArticlePage() {
  return <ArticleClient />;
}
