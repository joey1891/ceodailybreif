import { categoryMappings } from './category-mappings';
import { categoryUrls, subCategoryUrls } from './category-urls';
import { CategoryItem } from '@/lib/category-loader';

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
 * 카테고리 URL 생성 함수
 */
export function getCategoryUrl(
  category: CategoryItem | string,
  subcategory?: CategoryItem | string,
  subsubcategory?: CategoryItem | string
): string {
  // 카테고리가 문자열인 경우
  if (typeof category === 'string') {
    return `/${category}${subcategory ? `/${typeof subcategory === 'string' ? subcategory : subcategory.slug}` : ''}${subsubcategory ? `/${typeof subsubcategory === 'string' ? subsubcategory : subsubcategory.slug}` : ''}`;
  }
  
  // 카테고리가 객체인 경우
  return `/${category.slug}${subcategory ? `/${typeof subcategory === 'string' ? subcategory : subcategory.slug}` : ''}${subsubcategory ? `/${typeof subsubcategory === 'string' ? subsubcategory : subsubcategory.slug}` : ''}`;
}

/**
 * 게시물 URL 생성 함수
 */
export function getArticleUrl(id: string, category?: string, subcategory?: string, subsubcategory?: string): string {
  if (!category) return `/article/${id}`;
  
  const baseUrl = getCategoryUrl(category, subcategory, subsubcategory);
  return `${baseUrl}/article/${id}`;
}
