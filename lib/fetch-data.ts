import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";

export async function fetchRecentPosts(limit = 5): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching recent posts:", error);
    return [];
  }
  
  return data || [];
} 