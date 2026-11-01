// 기사 상세 — /article/[id]  (서버 컴포넌트)
//  - 기사 본문·제목·작성자·배너를 서버에서 완성된 HTML로 보냅니다.
//  - NewsArticle / BreadcrumbList 구조화 데이터(JSON-LD)로 구글 뉴스·검색 결과에 기사 정보가 표시되게 합니다.
//  - DB에 저장된 번역본이 있는 언어만 ?lang=xx 주소로 hreflang 연결합니다.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { supabase } from '@/utils/supabase';
import ArticleClient from '../ArticleClient';
import {
  SITE_URL, SITE_NAME, LOGO_URL, DEFAULT_OG_IMAGE, UUID_RE,
  type Article,
  getDisplayText, stripHtml, articlePath, articleUrl, storedLanguages, parseHashtags, jsonLd, cleanEmbeddedHtml,
} from '@/lib/seo';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ lang?: string }>;

// generateMetadata 와 페이지 본문이 같은 요청에서 DB를 두 번 조회하지 않도록 캐시
const getArticle = cache(async (id: string): Promise<Article | null> => {
  if (!UUID_RE.test(id)) return null;
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  if (!data) return null;
  const article = data as Article;
  // 본문(원문 + 번역본)에 붙어 있는 <html>/<head>/<title> 정리
  article.content = cleanEmbeddedHtml(article.content);
  if (article.translations) {
    for (const t of Object.values(article.translations)) {
      if (t && typeof t.content === 'string') t.content = cleanEmbeddedHtml(t.content);
    }
  }
  return article;
});

function localized(article: Article, field: 'title' | 'content' | 'author_name' | 'author_bio', lang: string): string {
  if (lang !== 'en') {
    const v = article.translations?.[lang]?.[field];
    if (typeof v === 'string' && v.trim()) return v;
  }
  const base = (article as Record<string, unknown>)[field];
  return field === 'title' ? getDisplayText(base) : typeof base === 'string' ? base : '';
}

function resolveLang(article: Article, requested?: string) {
  const langs = storedLanguages(article);
  const lang = requested && langs.includes(requested) ? requested : 'en';
  return { lang, langs };
}

export async function generateMetadata(
  { params, searchParams }: { params: Params; searchParams: SearchParams }
): Promise<Metadata> {
  const { id } = await params;
  const { lang: requested } = await searchParams;
  const article = await getArticle(id);
  if (!article) return { title: `${SITE_NAME}`, robots: { index: false, follow: true } };

  const { lang, langs } = resolveLang(article, requested);
  const title = localized(article, 'title', lang);
  const description = stripHtml(localized(article, 'content', lang), 160) || title;
  const image = article.image_url || DEFAULT_OG_IMAGE;
  const keywords = parseHashtags(lang !== 'en' ? article.translations?.[lang]?.hashtags ?? article.hashtags : article.hashtags);
  const authorName = localized(article, 'author_name', lang) || 'Editor-in-Chief';

  // 번역본이 저장된 언어끼리 서로 연결 (hreflang)
  const languages: Record<string, string> = {};
  for (const code of langs) languages[code] = articlePath(article.id, code);
  languages['x-default'] = articlePath(article.id);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords: keywords.length ? keywords : ['CEO', 'South Korea', 'Business', 'News', article.category],
    authors: [{ name: authorName }],
    category: article.category,
    alternates: {
      canonical: articlePath(article.id, lang),
      languages: langs.length > 1 ? languages : undefined,
    },
    openGraph: {
      type: 'article',
      url: articleUrl(article.id, lang),
      siteName: SITE_NAME,
      title,
      description,
      locale: lang === 'zh-CN' ? 'zh_CN' : lang,
      publishedTime: article.created_at,
      modifiedTime: article.updated_at || article.created_at,
      section: article.category,
      authors: [authorName],
      tags: keywords,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  };
}

export default async function ArticlePage(
  { params, searchParams }: { params: Params; searchParams: SearchParams }
) {
  const { id } = await params;
  const { lang: requested } = await searchParams;
  const article = await getArticle(id);
  if (!article) notFound();

  // 요청한 언어가 저장된 번역이 아니면 화면에서는 자동번역(기존 기능)을 쓰고,
  // 검색엔진용 canonical 은 영어 원문을 가리킵니다.
  const { lang } = resolveLang(article, requested);
  const initialLang = requested || 'en';

  const title = localized(article, 'title', lang);
  const authorName = localized(article, 'author_name', lang) || 'Editor-in-Chief';
  const images = [article.image_url, article.author_image_url].filter(Boolean) as string[];
  const keywords = parseHashtags(article.hashtags);
  const plainBody = stripHtml(localized(article, 'content', lang), 5000);

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      '@id': `${articleUrl(article.id, lang)}#article`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl(article.id, lang) },
      headline: title.length > 110 ? title.slice(0, 109) + '…' : title,
      description: stripHtml(localized(article, 'content', lang), 300),
      image: images.length ? images : [DEFAULT_OG_IMAGE],
      datePublished: article.created_at,
      dateModified: article.updated_at || article.created_at,
      inLanguage: lang,
      articleSection: article.category,
      keywords: keywords.join(', ') || undefined,
      wordCount: plainBody ? plainBody.split(/\s+/).length : undefined,
      isAccessibleForFree: true,
      author: [{
        '@type': 'Person',
        name: authorName,
        ...(article.author_image_url ? { image: article.author_image_url } : {}),
      }],
      publisher: {
        '@type': 'NewsMediaOrganization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: LOGO_URL },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: article.category, item: `${SITE_URL}/news?category=${encodeURIComponent(article.category)}` },
        { '@type': 'ListItem', position: 3, name: title, item: articleUrl(article.id, lang) },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <ArticleClient initialArticle={article} articleId={article.id} initialLang={initialLang} />
    </>
  );
}








