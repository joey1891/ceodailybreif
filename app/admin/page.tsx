"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession, isSuperAdmin } from "@/lib/admin-auth"; // ✅ 관리자 세션 유지 훅
import ArticlesManagement from "@/app/admin/articles/page";
import CalendarManagement from "@/app/admin/calendar/page";
import ProfileManagement from "@/app/admin/about-me/page"; // 프로필 관리 컴포넌트 import
import MembersManagement from "@/app/admin/members/page"; // 회원 관리 컴포넌트 import
import BooksManagement from "@/app/admin/books/page"; // 도서 관리 컴포넌트 import
import SideMenuManagement from "@/app/admin/sidemenu/page"; // 사이드 메뉴 관리 컴포넌트 import
import SliderSpeedManagement from "@/app/admin/slider/page"; // 슬라이더 속도 관리 컴포넌트 import
import PopupManagement from "@/app/admin/popup/page"; // 경로 확인 - 실제 컴포넌트 임포트
import Link from "next/link";
import AdminAccountsManagement from "@/app/admin/accounts/page"; // 관리자 계정 관리 컴포넌트 import
import SubManagersManagement from "@/app/admin/sub-managers/page"; // 서브 관리자 관리 컴포넌트 추가

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("master");
  const { adminUser, loading } = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !adminUser) {
      router.replace("/login");
    }
  }, [adminUser, loading]);

  if (loading) return <p>Loading...</p>;
  if (!adminUser) return null;

  const tabs = [
    "master",
    "profile",
    "articles",
    "sidemenu",
    "books",
    "popup",
    "calendar",
    "members",
    "slider"
  ];

  const getTabDisplayName = (tab: string) => {
    switch (tab) {
      case "master": return "관리자 계정 관리";
      case "profile": return "프로필 관리";
      case "articles": return "기사 관리";
      case "sidemenu": return "사이드 메뉴 관리";
      case "books": return "도서 관리";
      case "popup": return "팝업 관리";
      case "calendar": return "일정 관리";
      case "members": return "회원 관리";
      case "slider": return "슬라이더 속도 관리";
      default: return tab;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* 탭 네비게이션 상단 고정 */}
      <div className="bg-white shadow-md w-full flex justify-center sticky top-0 z-10">
        <div className="flex w-full max-w-10xl overflow-x-auto">
          {tabs.map((tab) => {
            // 모든 탭을 렌더링하되, master 탭 다음에 서브 관리자 탭 추가
            if (tab === "master") {
              return (
                <>
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 text-lg whitespace-nowrap ${
                      activeTab === tab
                        ? "border-b-4 border-blue-500 text-blue-500 font-bold"
                        : "text-gray-500"
                    }`}
                  >
                    {getTabDisplayName(tab)}
                  </button>
                  
                  {/* 서브 관리자 관리 메뉴 - 슈퍼 관리자만 표시 */}
                  {isSuperAdmin(adminUser) && (
                    <button
                      onClick={() => setActiveTab("sub-managers")}
                      className={`flex-1 py-3 px-4 text-lg whitespace-nowrap ${
                        activeTab === "sub-managers"
                          ? "border-b-4 border-blue-500 text-blue-500 font-bold"
                          : "text-gray-500"
                      }`}
                    >
                      서브 관리자
                    </button>
                  )}
                </>
              );
            }
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 text-lg whitespace-nowrap ${
                  activeTab === tab
                    ? "border-b-4 border-blue-500 text-blue-500 font-bold"
                    : "text-gray-500"
                }`}
              >
                {getTabDisplayName(tab)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex flex-col items-center justify-center flex-1 p-6 w-full max-w-10xl mx-auto">
        <div className="w-full mb-16">
          {activeTab === "master" && <AdminAccountsManagement />}
          {activeTab === "profile" && <ProfileManagement />}
          {activeTab === "articles" && <ArticlesManagement />}
          {activeTab === "sidemenu" && <SideMenuManagement />}
          {activeTab === "books" && <BooksManagement />}
          {activeTab === "popup" && <PopupManagement />}
          {activeTab === "calendar" && <CalendarManagement />}
          {activeTab === "members" && <MembersManagement />}
          {activeTab === "slider" && <SliderSpeedManagement />}
          {activeTab === "sub-managers" && <SubManagersManagement />}
        </div>
      </div>

      {/* 추가 카드 영역 - 필요시 여백 추가 */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 mb-10"> */}
        {/* 다른 관리 기능 카드들...
        <Link href="/admin/settings" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">사이트 설정</h3>
            <p className="text-gray-600">웹사이트 전반적인 설정을 관리합니다.</p>
          </div>
        </Link> */}
      </div>
  );
}
