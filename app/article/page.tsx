import { Metadata } from 'next';
import { supabase } from '@/utils/supabase';
import ArticleClient from './ArticleClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: any): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const articleId = resolvedParams?.id;
  const targetLang = resolvedParams?.lang || 'en'; 

  if (!articleId) return { title: 'CEO Daily Brief' };

  const { data: article } = await supabase
    .from('articles')
    .select('title, image_url, translations, content, hashtags')
    .eq('id', articleId)
    .single();

  if (!article) return { title: 'CEO Daily Brief' };

  let displayTitle = article.title;
  if (targetLang !== 'en' && article.translations && article.translations[targetLang] && article.translations[targetLang].title) {
    displayTitle = article.translations[targetLang].title;
  } else if (typeof article.title === 'object') {
    displayTitle = article.title.en || article.title.ko || 'CEO Daily Brief';
  }

  let displayContent = article.content || '';
  if (targetLang !== 'en' && article.translations && article.translations[targetLang] && article.translations[targetLang].content) {
    displayContent = article.translations[targetLang].content;
  } else if (typeof article.content === 'object') {
    displayContent = article.content.en || article.content.ko || '';
  }

  const plainTextDescription = displayContent ? displayContent.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : 'The Executive\'s Window into South Korea\'s Markets, Policy, and Industry Intelligence';
  const keywords = article.hashtags ? (typeof article.hashtags === 'string' ? article.hashtags.split(',').map((tag: string) => tag.trim()) : article.hashtags) : ['CEO', 'South Korea', 'Business', 'News'];

  return {
    title: `${displayTitle} | CEO Daily Brief`,
    description: plainTextDescription, 
    keywords: keywords, 
    openGraph: {
      title: displayTitle,
      description: plainTextDescription,
      images: [{ url: article.image_url || '/main-thumbnail.jpg', width: 1200, height: 630 }],
      type: 'article',
      url: `https://www.ceodailybrief.com/article?id=${articleId}&lang=${targetLang}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: plainTextDescription,
      images: [article.image_url || '/main-thumbnail.jpg'],
    },
  };
}

export default async function ArticlePage({ searchParams }: any) {
  const resolvedParams = await searchParams;
  const articleId = resolvedParams?.id;
  const targetLang = resolvedParams?.lang || 'en';

  // 💡 서버에서 기사 데이터를 미리 가져옵니다 (SEO 핵심)
  let initialArticle = null;
  if (articleId) {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();
    initialArticle = data;
  }

  // 완성된 데이터를 클라이언트 컴포넌트(ArticleClient)로 전달합니다.
  return <ArticleClient initialArticle={initialArticle} articleId={articleId} initialLang={targetLang} />;
}
