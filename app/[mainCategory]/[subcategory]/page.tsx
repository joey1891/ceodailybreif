import SubCategoryList from "@/components/subCategory-list";
import { categoryOptions } from "@/lib/category-options";

export async function generateStaticParams() {
  const paramsArray: { mainCategory: string; subcategory: string }[] = [];

  // 모든 메인 카테고리를 순회
  for (const cat of categoryOptions.values()) {
    // mainCategory slug 결정
    const mainPath = cat.href
      ? cat.href.replace(/^\//, "")
      : cat.base
      ? cat.base.replace(/^\//, "")
      : cat.title.toLowerCase().replace(/\s+/g, "-");

    // 하위 items가 있으면 각각 subcategory slug를 생성
    if (cat.items && cat.items.length > 0) {
      for (const subCat of cat.items) {
        paramsArray.push({
          mainCategory: mainPath,
          subcategory: subCat.slug,
        });
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
  // /[mainCategory]/[subcategory] 경로 접근 시
  // -> SubCategoryList 컴포넌트에 props로 넘겨서 DB 쿼리
  return (
    <SubCategoryList
      category={params.mainCategory}
      subcategory={params.subcategory}
    />
  );
}
