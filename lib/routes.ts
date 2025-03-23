import { categoryMappings } from './category-mappings';
import { categoryUrls, subCategoryUrls } from './category-urls';

// Define interfaces for the category objects
interface CategoryWithHref {
  href: string;
  [key: string]: any;
}

interface CategoryWithTitle {
  title: string;
  [key: string]: any;
}

type CategoryObject = CategoryWithHref | CategoryWithTitle;

/**
 * 카테고리 URL 생성 - 하드코딩된 값 사용
 */
export function getCategoryUrl(
  category: string | CategoryObject | undefined | null, 
  subcategory?: string, 
  subsubcategory?: string
): string {
  // category가 null 또는 undefined인 경우
  if (!category) return '/';
  
  // category가 객체인 경우 (CategoryOption이나 CategoryItem)
  if (typeof category === 'object') {
    if ('href' in category && category.href) {
      return category.href;
    } else if ('title' in category && typeof category.title === 'string') {
      category = category.title;
    } else {
      return '/';
    }
  }

  // 동일한 타이틀이 다른 부모 카테고리 아래 존재할 수 있으므로 특수 케이스 처리
  if (subcategory) {
    // 서브카테고리가 슬러그인 경우
    if (subCategoryUrls[subcategory]) {
      return subCategoryUrls[subcategory];
    }
    
    // 서브카테고리가 타이틀인 경우 (부모 카테고리에 따라 다른 URL)
    // 예: "의료"는 산업, 기업, 정책, 언론 모두에 존재
    let fullKey = '';
    
    switch (category) {
      case "산업 동향":
        fullKey = `industry/${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
        break;
      case "기업 동향":
        fullKey = `company/${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
        break;
      case "정책 동향":
        fullKey = `policy/${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
        break;
      case "언론 동향":
        fullKey = `media/${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
        break;
      default:
        // 기본적으로 부모 카테고리 URL + 서브카테고리 타이틀로 구성
        const mainUrl = categoryUrls[category] || `/${category.toLowerCase().replace(/\s+/g, '-')}`;
        return `${mainUrl}/${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    if (subsubcategory) {
      return `/${fullKey}/${subsubcategory}`;
    }
    
    return `/${fullKey}`;
  }
  
  // 카테고리만 있는 경우
  return categoryUrls[category] || `/${category.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * 게시물 URL 생성 함수
 */
export function getArticleUrl(id: string, category?: string, subcategory?: string, subsubcategory?: string): string {
  if (!category) return `/article/${id}`;
  
  const baseUrl = getCategoryUrl(category, subcategory, subsubcategory);
  return `${baseUrl}/article/${id}`;
}
