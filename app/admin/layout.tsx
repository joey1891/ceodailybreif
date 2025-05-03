"use client";

import { useRouter } from "next/navigation";
import { useAdminSession } from "@/lib/admin-auth";

export default function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: any; 
}) {
  const { adminUser, loading } = useAdminSession();
  const router = useRouter();

  // 로딩 중이 아니고 관리자가 아닌 경우 로그인 페이지로 리다이렉트
  if (!loading && !adminUser) {
    router.push('/admin/login');
    return null;
  }

  // 로딩 중인 경우 로딩 표시
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // 관리자인 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}
  