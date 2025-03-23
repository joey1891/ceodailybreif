"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/lib/admin-auth"; // ✅ 관리자 세션 유지 훅
import ArticlesManagement from "@/app/admin/articles/page";
import CalendarManagement from "@/app/admin/calendar/page";
import ProfileManagement from "@/app/admin/about-me/page"; // 프로필 관리 컴포넌트 import
import Link from "next/link";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("articles"); // 기본값을 'articles'로 설정
  const { adminUser, loading } = useAdminSession(); // ✅ 전역에서 로그인 상태 유지
  const router = useRouter();

  useEffect(() => {
    if (!loading && !adminUser) {
      router.replace("/login"); // ✅ 로그인 상태가 아니면 로그인 페이지로 이동
    }
  }, [adminUser, loading]);

  if (loading) return <p>Loading...</p>;
  if (!adminUser) return null; // ✅ 로그인이 필요하면 아무것도 렌더링하지 않음

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* 탭 네비게이션 상단 고정 */}
      <div className="bg-white shadow-md w-full flex justify-center sticky top-0 z-10">
        <div className="flex w-full max-w-10xl">
          {["articles", "calendar", "profile"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-lg ${
                activeTab === tab
                  ? "border-b-4 border-blue-500 text-blue-500 font-bold"
                  : "text-gray-500"
              }`}
            >
              {tab === "articles" 
                ? "기사 관리" 
                : tab === "calendar" 
                  ? "일정 관리" 
                  : "프로필 관리"}
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 영역 - 충분한 패딩 추가 */}
      <div className="flex flex-col items-center justify-center flex-1 p-6 w-full max-w-10xl mx-auto">
        {/* 탭 컨텐츠를 감싸는 컨테이너 - 여백 추가 */}
        <div className="w-full mb-16">
          {activeTab === "articles" && <ArticlesManagement />}
          {activeTab === "calendar" && <CalendarManagement />}
          {activeTab === "profile" && <ProfileManagement />}
        </div>
      </div>

      {/* 추가 카드 영역 - 필요시 여백 추가 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 mb-10">
        {/* 다른 관리 기능 카드들... */}
        <Link href="/admin/settings" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">사이트 설정</h3>
            <p className="text-gray-600">웹사이트 전반적인 설정을 관리합니다.</p>
          </div>
        </Link>
        
        {/* 필요한 경우 다른 카드 추가 */}
      </div>
    </div>
  );
}
