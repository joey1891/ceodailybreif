"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface ArticleLinkProps {
  postId: string;
  children: ReactNode;
  className?: string;
}

export const ArticleLink = ({ postId, children, className = "" }: ArticleLinkProps) => {
  // Define the function outside the onClick handler
  const handleClick = () => {
    console.log("ArticleLink clicked for post:", postId);
    incrementViewCount();
  };

  const incrementViewCount = async () => {
    console.log("Incrementing view count for post:", postId);
    
    try {
      // Step 1: Fetch the current viewcnt
      const { data, error: fetchError } = await supabase
        .from("posts")
        .select("viewcnt")
        .eq("id", postId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching viewcnt:", fetchError);
        return;
      }
      
      console.log("Current viewcnt:", data?.viewcnt);
      
      // Step 2: Calculate the new viewcnt value (default to 0 if it's null)
      const currentViewcnt = data?.viewcnt ?? 0;
      const newViewcnt = currentViewcnt + 1;
      
      console.log(`Updating viewcnt from ${currentViewcnt} to ${newViewcnt}`);
      
      // Step 3: Update the viewcnt in the database
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

  return (
    <Link 
      href={`/article/${postId}`} 
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}; 