"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminSession } from "@/lib/admin-auth"; // client-side auth

export default function AdminNewPostButton({ categoryId }: { categoryId: string }) {
  const { adminUser, loading } = useAdminSession();
  
  if (loading || !adminUser) {
    return null;
  }

  return (
    <Link
      href={`/admin/articles/create?category=${categoryId}`}
      className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 mr-1"
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
      </svg>
      새 게시글 작성
    </Link>
  );
} 