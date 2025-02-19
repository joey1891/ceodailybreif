import { categoryOptions } from "@/lib/category-options";
import { FinanceInfo } from "@/components/finance-info";
import { CalendarSection } from "@/components/calendar-section";
import { Sidebar } from "@/components/sidebar";
import SubCategoryPreview from "@/components/subCategory-preview";
import Link from "next/link";

// 정적 내보내기를 위한 모든 메인 카테고리 경로 생성
export async function generateStaticParams() {
  return Array.from(categoryOptions.values()).map((cat) => {
    const mainPath = cat.href
      ? cat.href.replace(/^\//, "")
      : cat.base
      ? cat.base.replace(/^\//, "")
      : cat.title.toLowerCase().replace(/\s+/g, "-");
    return { mainCategory: mainPath };
  });
}

export default function CategoryPage({
  params,
}: {
  params: { mainCategory: string };
}) {
  // 모든 메인 카테고리를 배열로 추출
  const mainCategories = Array.from(categoryOptions.values());

  // URL의 mainCategory 값과 일치하는 카테고리 객체 찾기
  const currentCategory = mainCategories.find((cat) => {
    const mainPath = cat.href
      ? cat.href.replace(/^\//, "")
      : cat.base
      ? cat.base.replace(/^\//, "")
      : cat.title.toLowerCase().replace(/\s+/g, "-");
    return mainPath === params.mainCategory;
  });

  if (!currentCategory) {
    return (
      <div className="container mx-auto px-4 py-8">
        Category not found.
      </div>
    );
  }

  const mainPath = currentCategory.href
    ? currentCategory.href.replace(/^\//, "")
    : currentCategory.base
    ? currentCategory.base.replace(/^\//, "")
    : currentCategory.title.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{currentCategory.title}</h1>
      {/* 하위 카테고리 목록 */}
      {currentCategory.items && currentCategory.items.length > 0 ? (
        currentCategory.items.map((subCat) => (
          <div key={subCat.slug} className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {subCat.title}
            </h2>
            {/* SubCategoryPreview 내부에서 게시물이 없으면 "No articles" 메시지와 함께 View All 버튼은 숨김 */}
            <SubCategoryPreview
              mainCategory={mainPath}
              subCategory={subCat.slug}
              limit={3}
              showViewAll={true}
            />
          </div>
        ))
      ) : (
        <p>No subcategories available for this category.</p>
      )}

      <div className="flex flex-col lg:flex-row gap-8 mt-12">
        <div className="w-full lg:w-2/3">
          {/* 추가 메인 컨텐츠 */}
        </div>
        <div className="w-full lg:w-1/3">
          <Sidebar />
        </div>
      </div>

      <div className="mt-12">
        <FinanceInfo />
      </div>
      <div className="mt-12">
        <CalendarSection />
      </div>
    </div>
  );
}
