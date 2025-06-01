"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { getCategoryUrl } from '@/lib/routes';

interface ArticleLinkProps {
  postId?: string;
  category?: string;
  subcategory?: string;
  subsubcategory?: string;
  children: ReactNode;
  className?: string;
}

export const ArticleLink = ({ 
  postId, 
  category, 
  subcategory, 
  subsubcategory,
  children, 
  className = "" 
}: ArticleLinkProps) => {
  // Define the function outside the onClick handler
  const handleClick = () => {
    console.log("ArticleLink clicked for post:", postId);
    // incrementViewCount(); // 클라이언트 사이드 조회수 증가 로직 호출 제거
  };

  // incrementViewCount 함수 전체를 제거하거나 주석 처리할 수 있습니다.
  // 만약 다른 용도로 이 함수가 필요 없다면 완전히 삭제하는 것이 좋습니다.
  /*
  const incrementViewCount = async () => {
    if (!postId) {
      return;
    }
    console.log("Incrementing view count for post:", postId);
    try {
      const { data, error: fetchError } = await supabase
        .from("posts")
        .select("viewcnt")
        .eq("id", postId)
        .single();
      if (fetchError) {
        console.error("Error fetching viewcnt:", fetchError);
        return;
      }
      const currentViewcnt = data?.viewcnt ?? 0;
      const newViewcnt = currentViewcnt + 1;
      const { error: updateError } = await supabase
        .from("posts")
        .update({ viewcnt: newViewcnt })
        .eq("id", postId);
      if (updateError) {
        console.error("Error updating viewcnt:", updateError);
      } else {
        console.log("Successfully updated viewcnt for post:", postId);
      }
    } catch (error) {
      console.error("Failed to increment view count:", error);
    }
  };
  */

  // 절대 경로 사용
  const href = postId 
    ? `/article/${postId}` 
    : category 
      ? getCategoryUrl(category, subcategory, subsubcategory)
      : "/";

  return (
    <Link 
      href={href} 
      onClick={handleClick} // handleClick은 유지하되, 내부에서 incrementViewCount 호출을 제거
      className={className}
    >
      {children}
    </Link>
  );
}; 