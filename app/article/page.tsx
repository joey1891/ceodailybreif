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

  // 💡 메타데이터 생성 시 번역본(translations)과 함께 content, hashtags도 가져옵니다.
  const { data: article } = await supabase
    .from('articles')
    .select('title, image_url, translations, content, hashtags')
    .eq('id', articleId)
    .single();

  if (!article) {
    return { title: 'CEO Daily Brief' };
  }

  // 1. SNS 미리보기 썸네일용 기사 제목 추출 (해당 언어 우선)
  let displayTitle = article.title;
  if (targetLang !== 'en' && article.translations && article.translations[targetLang] && article.translations[targetLang].title) {
    displayTitle = article.translations[targetLang].title;
  } else if (typeof article.title === 'object') {
    displayTitle = article.title.en || article.title.ko || 'CEO Daily Brief';
  }

  // 2. 검색엔진 및 SNS 요약본(Description)을 위한 본문 추출 (해당 언어 우선)
  let displayContent = article.content || '';
  if (targetLang !== 'en' && article.translations && article.translations[targetLang] && article.translations[targetLang].content) {
    displayContent = article.translations[targetLang].content;
  } else if (typeof article.content === 'object') {
    displayContent = article.content.en || article.content.ko || '';
  }

  // HTML 태그를 제거하고 텍스트만 150자 내외로 자릅니다.
  const plainTextDescription = displayContent
    ? displayContent.replace(/<[^>]+>/g, '').substring(0, 150) + '...'
    : 'The Executive\'s Window into South Korea\'s Markets, Policy, and Industry Intelligence';

  // 3. 해시태그 추출 (문자열 형태일 경우 콤마로 분리)
  const keywords = article.hashtags 
    ? (typeof article.hashtags === 'string' ? article.hashtags.split(',').map((tag: string) => tag.trim()) : article.hashtags)
    : ['CEO', 'South Korea', 'Business', 'News'];

  return {
    title: `${displayTitle} | CEO Daily Brief`,
    description: plainTextDescription, // 💡 기사 본문 요약본 반영
    keywords: keywords, // 💡 검색엔진 최적화(SEO)를 위한 해시태그 반영
    openGraph: {
      title: displayTitle,
      description: plainTextDescription,
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
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: plainTextDescription,
      images: [article.image_url || '/main-thumbnail.jpg'],
    },
  };
}

export default function ArticlePage() {
  return <ArticleClient />;
}
