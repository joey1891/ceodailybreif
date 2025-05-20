"use client";

import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// 관리자 사용자 타입 정의
type AdminUser = User & {
  role?: string;
  name?: string | null;
  isSuperAdmin?: boolean;
  isSubAdmin?: boolean;
};

// ✅ 관리자 로그인 여부 확인 및 세션 유지를 위한 훅
export function useAdminSession() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 세션 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        
        // 세션이 있으면 관리자 정보 확인
        if (session?.user) {
          await checkAdminUser(session.user);
        } else {
          setAdminUser(null);
        }
        
        setLoading(false);
      }
    );

    // 초기 세션 확인
    async function initialize() {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initial session:", session);
      
      if (session?.user) {
        await checkAdminUser(session.user);
      }
      
      setLoading(false);
    }

    // 관리자 테이블에서 사용자 정보 확인
    async function checkAdminUser(user: User) {
      try {
        console.log("Checking admin for user:", user.id);
        console.log("Executing admin query for user ID:", user.id); // Added log
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("*")
          .eq("id", user.id)
          .single();
        
        console.log("Admin query raw result:", { data: adminData, error: adminError }); // Added log
        console.log("Admin data:", adminData, "Error:", adminError);
        
        if (adminData) {
          // 관리자인 경우 정보 설정
          setAdminUser({
            ...user,
            role: adminData.role,
            name: adminData.name,
            isSuperAdmin: adminData.role === 'super_admin',
            isSubAdmin: adminData.role === 'sub_admin',
          });
        } else {
          setAdminUser(null);
        }
      } catch (error) {
        console.error("Admin check error:", error);
        setAdminUser(null);
      }
    }

    initialize();

    // 클린업 함수
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { adminUser, loading };
}

// ✅ 관리자 로그인 여부 확인 및 세션 유지
export async function getAdminUser(): Promise<AdminUser | null> {
  // 세션을 먼저 가져옴
  const { data, error } = await supabase.auth.getSession();
  console.log("Auth session data:", data, error);

  if (error || !data.session?.user) {
    console.warn("No active session found", error);
    return null;
  }

  const user = data.session.user;
  console.log("User from session:", user);

  // 관리자 테이블에서 사용자 정보 조회 - 정확한 쿼리 확인
  console.log("Querying admin_users with ID:", user.id);
  console.log("Executing admin query for user ID:", user.id); // Added log
  const { data: adminData, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .single();

  console.log("Admin query raw result:", { data: adminData, error: adminError }); // Added log
  console.log("Admin query result:", adminData, adminError);

  if (adminError || !adminData) {
    console.error("Admin user lookup failed:", adminError);
    return null;
  }

  console.log("Admin user data:", adminData);
  
  // 관리자 권한이 있는 경우 세션 유저 정보 반환
  const adminUser = {
    ...user,
    role: adminData.role,
    name: adminData.name
  };
  
  console.log("Returning admin user:", adminUser);
  return adminUser;
}

// ✅ 관리자 로그아웃
export async function signOutAdmin() {
  await supabase.auth.signOut();
}

// ✅ 슈퍼 관리자 확인 함수 개선
export function isSuperAdmin(user: AdminUser | null): boolean {
  console.log("Checking super admin status for:", user);
  const result = user !== null && user.role === 'super_admin';
  console.log("Is super admin:", result);
  return result;
}

// 관리자 로그인 전용 함수 추가
export const loginAdmin = async (email: string, password: string) => {
  try {
    // 먼저 로그아웃을 해서 세션을 초기화
    await supabase.auth.signOut();
    
    // 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('관리자 로그인 오류:', error);
    return { data: null, error };
  }
};

export async function authenticateAdmin() {
  try {
    console.log("Admin auth check starting...");
    
    // 1. 세션 가져오기 - 중첩 try-catch로 세분화
    let session;
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log("Auth session data:", data);
      
      if (error) {
        console.error("Session error:", error);
        return null;
      }
      
      session = data.session;
    } catch (sessionError) {
      console.error("Failed to get session:", sessionError);
      return null;
    }
    
    // 2. 세션 없음 처리
    if (!session) {
      console.log("No active session found", session);
      return null;
    }
    
    // 3. 사용자 정보 가져오기
    let user;
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("User error:", userError);
        return null;
      }
      
      user = userData?.user;
    } catch (userError) {
      console.error("Failed to get user:", userError);
      return null;
    }
    
    if (!user) {
      console.log("No user found");
      return null;
    }
    
    // 4. 관리자 테이블에서 정보 가져오기
    try {
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (adminError) {
        console.error("Admin lookup error:", adminError);
        return null;
      }
      
      if (!adminData) {
        console.log("User not in admin table");
        return null;
      }
      
      // 서브 관리자 및 슈퍼 관리자 모두 허용
      return {
        ...user,
        role: adminData.role,
        name: adminData.name,
        isSuperAdmin: adminData.role === 'super_admin',
        isSubAdmin: adminData.role === 'sub_admin',
      };
    } catch (adminLookupError) {
      console.error("Failed admin lookup:", adminLookupError);
      return null;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}
