"use client";

import { useAdminSession, isSuperAdmin } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminHeader from "./AdminHeader";

export default function AdminLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: any; 
}) {
  const { adminUser, loading } = useAdminSession();
  const router = useRouter();
  
  // 로딩 중이 아니며 관리자가 아닌 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!loading) {
      if (!adminUser) {
        router.push('/login');
      }
    }
  }, [adminUser, loading, router]);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>;
  }
  
  if (!adminUser) {
    return null; // 리다이렉트 중이므로 아무것도 표시하지 않음
  }
  
  // Remove or comment this out - Next.js routing handles this
  // const renderContent = () => {
  //   switch(activeTab) {
  //     case "popup": 
  //       return <PopupManagement />;
  //     // other cases
  //   }
  // }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader adminUser={adminUser} />
      {children}
    </div>
  );
}
  