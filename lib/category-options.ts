import { categoryMappings, reverseCategoryMappings } from './category-mappings';
import { categoryUrls } from './category-urls';

interface CategoryItem {
  title: string | { ko: string; en: string };
  slug: string;
  href?: string;
  items?: CategoryItem[];
}

interface CategoryOption {
  href?: string;
  base?: string;
  items: CategoryItem[];
}

// Define the structure for the JSON data
interface CategoryData {
  title: string | { ko: string; en: string };
  slug: string;
  subcategories?: SubcategoryData[];
}

interface SubcategoryData {
  id: string;
  title: string | { ko: string; en: string };
  slug: string;
  subcategories?: SubSubcategoryData[];
}

interface SubSubcategoryData {
  id: string;
  title: string | { ko: string; en: string };
  slug: string;
}

// 카테고리 JSON 파일 로드 함수
async function loadCategoryData() {
  try {
    // Next.js에서는 dynamic import를 사용하여 여러 JSON 파일을 가져올 수 있음
    const categories = await Promise.all([
      import('../data/categories/01-report.json'),
      import('../data/categories/02-economic-trends.json'),
      import('../data/categories/03-finance.json'),
      import('../data/categories/04-industry.json'),
      import('../data/categories/05-company.json'),
      import('../data/categories/06-policy.json'),
      import('../data/categories/07-media.json'),
      import('../data/categories/08-marketing.json'),
      import('../data/categories/09-people.json'),
      import('../data/categories/10-media-review.json'),
      import('../data/categories/11-schedule.json')
    ]);

    // 카테고리 맵 생성
    const categoryMap = new Map<string, CategoryOption>();
    
    categories.forEach(category => {
      const data = category.default as CategoryData;
      const koTitle = typeof data.title === 'object' ? data.title.ko : data.title;
      
      categoryMap.set(koTitle, {
        href: categoryUrls[data.slug] || `/${data.slug}`,
        items: (data.subcategories || []).map(sub => ({
          title: sub.title,
          slug: sub.slug,
          href: categoryUrls[sub.slug] || `/${data.slug}/${sub.slug}`,
          items: (sub.subcategories || []).map(subSub => ({
            title: subSub.title,
            slug: subSub.slug,
            href: categoryUrls[subSub.slug] || `/${data.slug}/${sub.slug}/${subSub.slug}`
          }))
        }))
      });
    });
    
    return categoryMap;
  } catch (error) {
    console.error('카테고리 데이터 로드 실패:', error);
    return new Map();
  }
}

// 카테고리 옵션 초기화
// 클라이언트와 서버 양쪽에서 사용 가능한 방식으로 처리
let categoryOptions = new Map<string, CategoryOption>();

// 서버 사이드에서만 실행
if (typeof window === 'undefined') {
  loadCategoryData().then(data => {
    categoryOptions = data;
  });
}

export { categoryOptions, loadCategoryData };
export type { CategoryItem, CategoryOption }; 