import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";

/**
 * 카테고리와 서브카테고리로 게시물 조회
 */
export async function getPostsByCategory({
  mainCategory,
  subCategory,
  limit,
  orderBy = "updated_at",
  ascending = false
}: {
  mainCategory: string;
  subCategory?: string | string[];
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}): Promise<Post[]> {
  try {
    let query = supabase
      .from("posts")
      .select("*")
      .eq("category", mainCategory);
    
    // 서브카테고리가 있는 경우 필터링
    if (subCategory) {
      if (Array.isArray(subCategory)) {
        // 서브카테고리가 배열인 경우 in 연산자 사용
        if (subCategory.length > 0) {
          query = query.in("subcategory", subCategory);
        }
      } else {
        query = query.eq("subcategory", subCategory);
      }
    }
    
    // 정렬 및 제한
    query = query.order(orderBy, { ascending });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getPostsByCategory:", error);
    return [];
  }
}

/**
 * 카테고리와 서브카테고리로 게시물 개수 조회
 */
export async function getPostsCountByCategory({
  mainCategory,
  subCategory
}: {
  mainCategory: string;
  subCategory?: string | string[];
}): Promise<number> {
  try {
    let query = supabase
      .from("posts")
      .select("*", { count: 'exact', head: true })
      .eq("category", mainCategory);
    
    if (subCategory) {
      if (Array.isArray(subCategory)) {
        if (subCategory.length > 0) {
          query = query.in("subcategory", subCategory);
        }
      } else {
        query = query.eq("subcategory", subCategory);
      }
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error("Error counting posts:", error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error in getPostsCountByCategory:", error);
    return 0;
  }
} 