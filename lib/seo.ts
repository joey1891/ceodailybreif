// SEO 공통 상수와 도우미 함수 (서버·클라이언트 공용)

export const SITE_URL = 'https://www.ceodailybrief.com';
export const SITE_NAME = 'CEO Daily Brief';
export const SITE_DESCRIPTION =
  "The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence";
export const LOGO_URL =
  'https://inpfhtkdghdidkbgtrzj.supabase.co/storage/v1/object/public/article_images/fabicon.jpg';
export const DEFAULT_OG_IMAGE =
  'https://inpfhtkdghdidkbgtrzj.supabase.co/storage/v1/object/public/article_images/thumb.jpg';

// 기사 페이지가 지원하는 언어 (en = 원문)
export const LANG_CODES = ['en', 'ko', 'ja', 'zh-CN', 'ru', 'mn', 'vi'] as const;

export type Article = {
  id: string;
  article_no?: number | null; // 기사 번호 (짧은 주소용, DB에서 자동으로 매김)
  title: string;
  content?: string | null;
  category: string;
  image_url?: string | null;
  author_name?: string | null;
  author_bio?: string | null;
  author_image_url?: string | null;
  created_at: string;
  updated_at?: string | null;
  hashtags?: string | null;
  translations?: Record<string, Record<string, unknown>> | null;
  profile_banner_url?: string | null;
  profile_banner_alt?: string | null;
  profile_banner_visible?: boolean | null;
  subscribe_banner_url?: string | null;
  subscribe_banner_alt?: string | null;
  subscribe_banner_visible?: boolean | null;
};

export type Ad = {
  id: number;
  position: string;
  image_url?: string | null;
  link_url?: string | null;
  alt_text?: string | null;
  is_youtube?: boolean | null;
  youtube_id?: string | null;
  autoplay?: boolean | null;
  is_visible?: boolean | null;
  youtube_scale?: number | null;
  description?: string | null;
  file_url?: string | null;
  has_text?: boolean | null;
  text_content?: string | null;
  text_x?: number | null;
  text_y?: number | null;
  text_w?: number | null;
  text_h?: number | null;
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getDisplayText(field: unknown): string {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    const v = obj.en ?? obj.ko ?? Object.values(obj)[0];
    return typeof v === 'string' ? v : '';
  }
  return '';
}

// HTML 태그를 제거하고 공백을 정리한 순수 텍스트 (meta description 용)
export function stripHtml(html: string | null | undefined, max = 160): string {
  const text = String(html ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, ' ')
    .replace(/<(style|script|title|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

// 영문 제목 → 주소용 문자열 (예: "hair-rollers-in-public-the-confident-pragmatism")
//  - 맨 앞의 [Editorial], [Op-Ed] 같은 머리말은 뺍니다.
//  - 영어·숫자만 남기고 나머지는 '-' 로 바꾸며, 60자 안에서 단어 단위로 자릅니다.
export function slugify(title: unknown, maxLen = 60): string {
  let s = getDisplayText(title)
    .replace(/^\s*(\[[^\]]*\]\s*)+/, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’‘`"“”]/g, '')
    .replace(/(\d),(?=\d{3}\b)/g, '$1') // 5,000 → 5000
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length > maxLen) {
    s = s.slice(0, maxLen);
    const cut = s.lastIndexOf('-');
    if (cut > 20) s = s.slice(0, cut);
    s = s.replace(/-+$/, '');
  }
  return s;
}

type ArticleRef = Pick<Article, 'id' | 'title'> & { article_no?: number | null };

// 기사 주소: /article/15/hair-rollers-in-public-…  (번호가 없으면 예전 방식 /article/UUID)
export function articlePath(article: ArticleRef, lang?: string): string {
  const query = lang && lang !== 'en' ? `?lang=${encodeURIComponent(lang)}` : '';
  if (article.article_no == null) return `/article/${article.id}${query}`;
  const slug = slugify(article.title);
  return `/article/${article.article_no}${slug ? `/${slug}` : ''}${query}`;
}

export function articleUrl(article: ArticleRef, lang?: string): string {
  return SITE_URL + articlePath(article, lang);
}

// 번역본이 DB에 실제로 저장된 언어 목록 (자동번역은 제외 → 검색엔진에 중복/저품질로 보이지 않게)
export function storedLanguages(article: Pick<Article, 'translations'>): string[] {
  const t = article.translations || {};
  return LANG_CODES.filter((code) => {
    if (code === 'en') return true;
    const entry = t[code] as Record<string, unknown> | undefined;
    return Boolean(
      entry &&
        typeof entry.title === 'string' && entry.title.trim() &&
        typeof entry.content === 'string' && entry.content.trim()
    );
  });
}

// hashtags 컬럼은 '["a","b"]' (JSON 문자열) 또는 'a, b' 형태
export function parseHashtags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    /* JSON 이 아니면 쉼표 구분으로 처리 */
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

// sitemap.xml 에 넣는 값 이스케이프 (Next.js 는 값을 그대로 출력하므로 직접 처리)
export function xmlSafe(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function isVideoFile(url: string): boolean {
  return /\.(mp4|webm)(\?|$)/i.test(url);
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}

// JSON-LD 를 <script> 에 안전하게 넣기 위한 직렬화 (</script> 주입 방지)
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// 기사 본문에 HTML 문서 전체(<html><head><title>…)가 붙여넣어진 경우,
// <title>/<meta> 가 페이지 본문에 섞여 검색엔진이 제목을 잘못 읽지 않도록 정리합니다.
// (<head> 안의 <style> 은 디자인 유지를 위해 남김)
export function cleanEmbeddedHtml(html: string | null | undefined): string {
  let s = String(html ?? '');
  if (!/<(!doctype|html|head|body|title|meta)\b/i.test(s)) return s;
  s = s.replace(/<!doctype[^>]*>/gi, '');
  s = s.replace(/<head[^>]*>([\s\S]*?)<\/head>/gi, (_m, inner: string) =>
    (inner.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n')
  );
  s = s.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '');
  s = s.replace(/<meta\b[^>]*>/gi, '');
  s = s.replace(/<\/?(html|body)\b[^>]*>/gi, '');
  return s.trim();
}











