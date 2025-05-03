"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { isSuperAdmin } from "@/lib/admin-auth";

export default function AdminHeader({ adminUser }: { adminUser: User }) {
  const router = useRouter();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/admin" className="font-bold text-xl text-gray-800">
            관리자
          </Link>
          <span className="ml-4 text-sm text-gray-500">
            {adminUser?.email ? `${adminUser.email} (${isSuperAdmin(adminUser) ? '슈퍼관리자' : '서브관리자'})` : '로그인 필요'}
          </span>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
} 