import SubCategoryList from "@/components/subCategory-list";
import { categoryOptions, CategoryItem } from "@/lib/category-options";

export async function generateStaticParams() {
  const paramsArray: { mainCategory: string; subcategory: string }[] = [];

  // 재귀적으로 카테고리 항목을 처리하는 함수
  function processCategoryItem(
    mainCategory: string,
    item: CategoryItem,
    paramsArray: { mainCategory: string; subcategory: string }[]
  ) {
    if (item.slug) {
      paramsArray.push({
        mainCategory: mainCategory,
        subcategory: item.slug,
      });
    }
    if (item.items) {
      for (const subItem of item.items) {
        processCategoryItem(mainCategory, subItem, paramsArray);
      }
    }
  }

  // 모든 메인 카테고리를 순회
  for (const cat of categoryOptions.values()) {
    // mainCategory slug 결정
    const mainPath = cat.href
      ? cat.href.replace(/^\//, "")
      : cat.base
      ? cat.base.replace(/^\//, "")
      : cat.title.toLowerCase().replace(/[\s]+/g, "-");

    // 하위 items가 있으면 각각 subcategory slug를 생성
    if (cat.items && cat.items.length > 0) {
      for (const subCat of cat.items) {
        processCategoryItem(mainPath, subCat, paramsArray);
      }
    }
  }

  return paramsArray;
}

export default function SubCategoryPage({
  params,
}: {
  params: { mainCategory: string; subcategory: string };
}) {
  return (
    <div className="flex gap-6">
      <div className="w-full md:w-3/4">
        <SubCategoryList
          category={params.mainCategory}
          subcategory={params.subcategory}
          subcategories={[{ slug: params.subcategory, title: params.subcategory }]}
        />
      </div>
    </div>
  );
}
