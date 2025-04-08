// 카테고리 데이터 로더 및 유틸리티 함수

// 카테고리 타입 정의
export interface CategoryItem {
  id: string;
  title: {
    ko: string;
    en: string;
  };
  slug: string;
  subcategories?: CategoryItem[];
}

// 카테고리 매핑
interface CategoryMappings {
  categories: CategoryItem[];
  categoryMap: Map<string, CategoryItem>;
  slugMap: Map<string, {category: CategoryItem, subcategory?: CategoryItem, subsubcategory?: CategoryItem}>;
}

// 모든 카테고리를 정적으로 가져옴 (Next.js에서는 빌드 시 실행)
import report from '@/data/categories/01-report.json';
import economicTrends from '@/data/categories/02-economic-trends.json';
import finance from '@/data/categories/03-finance.json';
import industry from '@/data/categories/04-industry.json';
import company from '@/data/categories/05-company.json';
import policy from '@/data/categories/06-policy.json';
import media from '@/data/categories/07-media.json';
import marketing from '@/data/categories/08-marketing.json';
import people from '@/data/categories/09-people.json';
import mediaReview from '@/data/categories/10-media-review.json';
import schedule from '@/data/categories/11-schedule.json';

// 카테고리 데이터를 한곳에 모음 (순서가 중요)
const allCategories: CategoryItem[] = [
  report as CategoryItem,
  economicTrends as CategoryItem,
  finance as CategoryItem,
  industry as CategoryItem,
  company as CategoryItem,
  policy as CategoryItem,
  media as CategoryItem,
  marketing as CategoryItem,
  people as CategoryItem,
  mediaReview as CategoryItem,
  schedule as CategoryItem
];

// 카테고리 매핑 초기화
export function initCategoryMappings(): CategoryMappings {
  const categoryMap = new Map<string, CategoryItem>();
  const slugMap = new Map<string, {
    category: CategoryItem, 
    subcategory?: CategoryItem,
    subsubcategory?: CategoryItem
  }>();
  
  allCategories.forEach(category => {
    // ID 기반 매핑
    categoryMap.set(category.id, category);
    
    // 메인 카테고리 슬러그 매핑
    slugMap.set(category.slug, {category});
    
    // 서브 카테고리 매핑
    category.subcategories?.forEach(subcategory => {
      // 서브 카테고리 URL 생성
      const fullSlug = `${category.slug}/${subcategory.slug}`;
      slugMap.set(fullSlug, {category, subcategory});
      
      // 하위-하위 카테고리가 있는 경우 (3단계 깊이)
      subcategory.subcategories?.forEach(subsubcategory => {
        const subsubSlug = `${category.slug}/${subcategory.slug}/${subsubcategory.slug}`;
        slugMap.set(subsubSlug, {category, subcategory, subsubcategory});
      });
    });
  });
  
  return {
    categories: allCategories,
    categoryMap,
    slugMap
  };
}

// 전역에서 사용할 카테고리 매핑 초기화
const categoryMappings = initCategoryMappings();

// 카테고리 데이터 액세스 유틸리티 함수
export function getAllCategories(): CategoryItem[] {
  return categoryMappings.categories;
}

export function getCategoryById(id: string): CategoryItem | undefined {
  return categoryMappings.categoryMap.get(id);
}

export function getCategoryBySlug(slug: string): {
  category: CategoryItem, 
  subcategory?: CategoryItem,
  subsubcategory?: CategoryItem
} | undefined {
  return categoryMappings.slugMap.get(slug);
}

export function getSubcategoriesByCategoryId(categoryId: string): CategoryItem[] | undefined {
  const category = getCategoryById(categoryId);
  return category?.subcategories;
}

/**
 * 정적 경로 파라미터 생성 함수
 * Next.js의 generateStaticParams에서 사용
 */
export function generateCategoryStaticParams() {
  const paramsArray: { mainCategory: string; subcategory: string }[] = [];

  function processCategoryItem(
    mainCategory: string,
    item: CategoryItem,
    paramsArray: {mainCategory: string; subcategory: string}[]
  ) {
    // 모든 서브카테고리에 대한 경로 파라미터 추가
    paramsArray.push({
      mainCategory: mainCategory,
      subcategory: item.slug,
    });

    // 하위-하위 카테고리가 있으면 재귀적으로 처리
    if (item.subcategories) {
      for (const subItem of item.subcategories) {
        processCategoryItem(mainCategory, subItem, paramsArray);
      }
    }
  }

  // 모든 메인 카테고리 처리
  for (const category of categoryMappings.categories) {
    if (category.subcategories && category.subcategories.length > 0) {
      for (const subCat of category.subcategories) {
        processCategoryItem(category.slug, subCat, paramsArray);
      }
    }
  }

  return paramsArray;
}

import { loadCategoryData } from './category-options';

// 카테고리 데이터 캐싱
let categoryDataCache: Map<string, any> | null = null;

// ID로 카테고리 가져오기
export async function getCategoryByIdentifier(categoryId: string) {
  // 캐시된 데이터가 없으면 로드
  if (!categoryDataCache) {
    categoryDataCache = await loadCategoryData();
  }
  
  // 카테고리 ID에 맞는 데이터 찾기
  for (const [categoryName, categoryData] of categoryDataCache.entries()) {
    const slug = categoryData.href?.replace(/^\//, '') || '';
    if (slug === categoryId) {
      return {
        id: slug,
        name: categoryName,
        items: categoryData.items || []
      };
    }
  }
  
  return null;
}

export const fetchCategoryData = async () => {
  return await loadCategoryData();
};

export { loadCategoryData }; 