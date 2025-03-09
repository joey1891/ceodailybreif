import { categoryMappings } from './category-mappings';

/**
 * 카테고리 기반 URL 생성 함수
 */
export function getCategoryUrl(category: string, subcategory?: string, subsubcategory?: string): string {
  // 한글 카테고리를 영문으로 변환
  const categorySlug = categoryMappings[category] || category.toLowerCase().replace(/\s+/g, '-');
  
  let url = `/${categorySlug}`;
  
  if (subcategory) {
    url += `/${subcategory}`;
    
    if (subsubcategory) {
      url += `/${subsubcategory}`;
    }
  }
  
  return url;
}

/**
 * 게시물 상세 URL 생성 함수
 */
export function getArticleUrl(id: string, category: string, subcategory?: string, subsubcategory?: string): string {
  const baseUrl = getCategoryUrl(category, subcategory, subsubcategory);
  return `${baseUrl}/article/${id}`;
} 