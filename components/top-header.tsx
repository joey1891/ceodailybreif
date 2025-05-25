"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAdminUser, signOutAdmin, useAdminSession } from "@/lib/admin-auth";
import { format } from "date-fns";

export function TopHeader() {
  const { adminUser, loading: adminLoading, error: adminError } = useAdminSession();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    console.log("TopHeader adminUser:", adminUser);
    console.log("TopHeader adminLoading:", adminLoading);
    console.log("TopHeader adminError:", adminError);
  }, [adminUser, adminLoading, adminError]);

  const isLoggedIn = !adminLoading && adminUser !== null;
  const isAdmin = !adminLoading && adminUser !== null && (adminUser.role === 'super_admin' || adminUser.role === 'sub_admin');

  useEffect(() => {
    const today = new Date();
    const formattedDate = format(today, "yyyy-MM-dd").toUpperCase();
    setCurrentDate(formattedDate);
  }, []);

  const handleLogout = async () => {
    await signOutAdmin();
  };

  return (
    <div className="container max-w-[1400px] mx-auto px-4 lg:px-8 bg-white border-b border-transparent">
      <div className="flex justify-between py-2 text-sm">
        {/* 왼쪽 영역: Home, Contact */}
        <div className="flex items-center space-x-4 select-none justify-center">
          {/* <Link
            href="/"
            className="text-black hover:text-gray-700 inline-flex items-center select-none"
          >
            Home
         </Link> */}
          {/* <a
            href="mailto:wjshin2450@gmail.com"
            className="text-black hover:text-gray-700 inline-flex items-center select-none"
          >
            Contact
         </a> */}
        </div>

        {/* 오른쪽 영역: 로그인, 날짜 */}
        <div className="flex items-center space-x-4 select-none">
          {adminLoading ? (
            <span className="text-black">로딩...</span>
          ) : !isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="text-black hover:text-gray-700 inline-flex items-center"
              >
                <LogIn className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">로그인</span>
              </Link>
            </>
          ) : (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-black hover:text-gray-700 inline-flex items-center"
                >
                  관리자
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-black hover:text-gray-700 inline-flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
              </button>
            </>
          )}
          <span className="text-black hidden md:inline">{currentDate}</span>
        </div>
      </div>
    </div>
  );
}
