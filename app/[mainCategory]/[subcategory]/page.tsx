import { notFound } from "next/navigation";
import Link from "next/link";
import SubCategoryList from "@/components/subCategory-list";
import { getAllCategories, getCategoryById, generateCategoryStaticParams } from '@/lib/category-loader';

// 정적 페이지 생성을 위해 필요한 모든 경로들을 생성합니다.
export async function generateStaticParams() {
  const paths = [];
  const categories = getAllCategories();
  
  for (const category of categories) {
    if (category.subcategories) {
      for (const subcategory of category.subcategories) {
        paths.push({
          mainCategory: category.slug,
          subcategory: subcategory.slug,
        });
      }
    }
  }
  
  return paths;
}

export default function SubCategoryPage({
  params,
}: {
  params: { mainCategory: string; subcategory: string };
}) {
  const { mainCategory, subcategory } = params;
  const category = getCategoryById(mainCategory);
  
  if (!category) {
    return notFound();
  }
  
  const subcategoryData = category.subcategories?.find(
    (sub) => sub.slug === subcategory
  );
  
  if (!subcategoryData) {
    return notFound();
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/${mainCategory}`} className="mb-4 inline-block">
        &larr; {typeof category?.title === 'string' ? category?.title : category?.title?.ko}로 돌아가기
      </Link>
      <SubCategoryList
        category={mainCategory}
        subcategories={[subcategoryData]}
        subcategory={subcategory}
      />
    </div>
  );
}
