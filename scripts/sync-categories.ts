import { getAllCategories, CategoryItem } from "@/lib/category-loader";
import { supabase } from "@/lib/supabase";

/**
 * 카테고리 구조를 Supabase에 동기화하는 함수
 */
async function syncCategoriesToSupabase() {
  const categories = getAllCategories();
  const processedItems: string[] = [];
  
  // 메인 카테고리 처리
  for (const category of categories) {
    await syncCategoryItem(category, null);
    processedItems.push(category.id);
    
    // 서브카테고리 처리
    if (category.subcategories) {
      for (const subcategory of category.subcategories) {
        await syncCategoryItem(subcategory, category.id);
        processedItems.push(subcategory.id);
        
        // 하위-하위 카테고리 처리
        if (subcategory.subcategories) {
          for (const subsubcategory of subcategory.subcategories) {
            await syncCategoryItem(subsubcategory, subcategory.id);
            processedItems.push(subsubcategory.id);
          }
        }
      }
    }
  }
  
  // 삭제된 카테고리 처리 (옵션)
  const { data: existingCategories } = await supabase
    .from("categories")
    .select("id");
    
  if (existingCategories) {
    for (const item of existingCategories) {
      if (!processedItems.includes(item.id)) {
        await supabase
          .from("categories")
          .delete()
          .eq("id", item.id);
          
        console.log(`Deleted category: ${item.id}`);
      }
    }
  }
  
  console.log("Categories sync completed successfully!");
}

/**
 * 개별 카테고리 항목을 Supabase에 저장
 */
async function syncCategoryItem(item: CategoryItem, parentId: string | null) {
  const { error } = await supabase
    .from("categories")
    .upsert({
      id: item.id,
      title_ko: item.title.ko,
      title_en: item.title.en,
      slug: item.slug,
      parent_id: parentId,
      updated_at: new Date().toISOString()
    });
    
  if (error) {
    console.error(`Error syncing category ${item.id}:`, error);
  } else {
    console.log(`Synced category: ${item.id}`);
  }
}

// 스크립트 실행
syncCategoriesToSupabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Sync failed:", err);
    process.exit(1);
  }); 