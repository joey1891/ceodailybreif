"use client";

import Link from "next/link";
import { LogIn, UserPlus, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAdminUser, signOutAdmin } from "@/lib/admin-auth";
import { format } from "date-fns";

export function TopHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // 현재 날짜 포맷팅 (THURSDAY 06TH FEBRUARY 2025 형식)
    const today = new Date();
    const formattedDate = format(today, "EEEE do MMMM yyyy").toUpperCase();
    setCurrentDate(formattedDate);

    const checkUser = async () => {
      const user = await getAdminUser();
      console.log("User in TopHeader:", user);

      if (user) {
        setIsLoggedIn(true);
        setIsAdmin(true);
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    checkUser();

    // 로그인 상태 변경 감지
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser();
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOutAdmin();
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  return (
    <div className="container max-w-[1400px] mx-auto px-4 lg:px-8 bg-black border-b border-gray-200">
      <div className="flex justify-between py-2 text-sm">
        {/* 왼쪽 영역: Home, About, Contact */}
        <div className="flex items-center space-x-4 select-none justify-center">
          <Link
            href="/"
            className="text-white font-bold hover:text-gray-300 inline-flex items-center select-none"
          >
            Home
          </Link>
          {/* <Link
            href="/about"
            className="text-white font-bold hover:text-gray-300 inline-flex items-center select-none"
          >
            About Me
          </Link> */}
          <a
            href="mailto:wjshin2450@gmail.com"
            className="text-white font-bold hover:text-gray-300 inline-flex items-center select-none"
          >
            Contact
          </a>
        </div>

        {/* 오른쪽 영역: 회원가입, 로그인, 날짜 */}
        <div className="flex items-center space-x-4 select-none">
          {!isLoggedIn ? (
            <>
              <Link
                href="/signup"
                className="text-white font-bold hover:text-gray-300 inline-flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">회원가입</span>
              </Link>
              <Link
                href="/login"
                className="text-white font-bold hover:text-gray-300 inline-flex items-center"
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
                  className="text-white hover:text-white inline-flex items-center font-bold"
                >
                  관리자 페이지
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-white hover:text-white inline-flex items-center font-bold"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
              </button>
            </>
          )}
          <span className="text-white hidden md:inline">{currentDate}</span>
        </div>
      </div>
    </div>
  );
}
