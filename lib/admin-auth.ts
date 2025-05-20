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
      }
    );

    // 초기 세션 확인
    async function initialize() {
      console.log("useAdminSession: Initializing session check"); // Added log
      try { // Added try block
        const { data, error } = await supabase.auth.getSession(); // Modified to get data and error
        console.log("useAdminSession: getSession result:", { data, error }); // Added log
        const session = data?.session; // Get session from data
        
        console.log("Initial session:", session);
        
        if (session?.user) {
          console.log("useAdminSession: Session user found, checking admin user"); // Added log
          await checkAdminUser(session.user);
        } else {
          console.log("useAdminSession: No session user found"); // Added log
        }
      } catch (sessionError) { // Added catch block
        console.error("useAdminSession: getSession caught an exception:", sessionError); // Log exception
      } finally { // Ensure loading state is updated
        setLoading(false);
      }
    }

    // 관리자 테이블에서 사용자 정보 확인
    async function checkAdminUser(user: User) {
      try {
        console.log("Checking admin for user:", user.id);
        console.log("Executing admin query for user ID:", user.id); // Added log
        
        const adminQueryPromise = supabase
          .from("admin_users")
          .select("*")
          .eq("id", user.id)
          .single();

        // Add a timeout to the admin query promise (e.g., 5 seconds)
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error(`Admin query timeout for user ${user.id}`)), 5000) // 5초 타임아웃
        );

        const { data: adminData, error: adminError } = await Promise.race([adminQueryPromise, timeoutPromise]);
        
        console.log("Admin query raw result:", { data: adminData, error: adminError }); // Added log
        console.log("Admin data:", adminData, "Error:", adminError);
        
        if (adminError) {
           console.error("Admin query error:", adminError);
           setAdminUser(null);
        } else if (adminData) {
          // 관리자인 경우 정보 설정
          setAdminUser({
            ...user,
            role: adminData.role,
            name: adminData.name,
            isSuperAdmin: adminData.role === 'super_admin',
            isSubAdmin: adminData.role === 'sub_admin',
          });
        } else {
          // adminData가 null인 경우 (사용자가 admin_users 테이블에 없음)
          setAdminUser(null);
        }
      } catch (error: any) { // Catch timeout or other exceptions
        console.error("Admin check exception:", error);
        setAdminUser(null);
      } finally { // Added finally block
        setLoading(false); // Ensure loading state is updated
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
  console.log("getAdminUser: Fetching session"); // Added log
  try { // Added try block
    // 세션을 먼저 가져옴
    const { data, error } = await supabase.auth.getSession();
    console.log("getAdminUser: getSession result:", { data, error }); // Added log
    console.log("Auth session data:", data, error);

    if (error || !data?.session?.user) { // Modified check for data?.session?.user
      console.warn("getAdminUser: No active session found or error", error); // Added log
      return null;
    }

    const user = data.session.user;
    console.log("getAdminUser: User from session:", user); // Added log
    console.log("User from session:", user);

    // 관리자 테이블에서 사용자 정보 조회 - 정확한 쿼리 확인
    console.log("Querying admin_users with ID:", user.id);
    console.log("Executing admin query for user ID:", user.id); // Added log
    
    const adminQueryPromise = supabase
      .from("admin_users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Add a timeout to the admin query promise (e.g., 5 seconds)
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error(`Admin query timeout for user ${user.id}`)), 5000) // 5초 타임아웃
    );

    const { data: adminData, error: adminError } = await Promise.race([adminQueryPromise, timeoutPromise]);

    console.log("Admin query raw result:", { data: adminData, error: adminError }); // Added log
    console.log("Admin query result:", adminData, adminError);

    if (adminError) {
      console.error("Admin user lookup failed:", adminError);
      return null;
    }
    
    if (!adminData) { // Handle case where adminData is null (user not in admin_users)
       console.warn("Admin user not found in admin_users table.");
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
  } catch (sessionFetchError: any) { // Added catch block and type
    console.error("getAdminUser: getSession or subsequent logic caught an exception:", sessionFetchError); // Log exception
    return null;
  }
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
    } catch (sessionError: any) { // Type error
      console.error("Failed to get session:", sessionError);
      return null;
    }
    
    // 2. 세션 없음 처리
    if (!session) {
      console.log("No active session found", session);
      return null;
    }
    
    // 3. 사용자 정보 가져오기
    let user: User | null; // 명시적으로 타입 지정
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("User error:", userError);
        return null;
      }
      
      user = userData?.user || null; // nullish coalescing operator 사용 및 null 할당

      if (!user) { // Move the null check inside the try block
        console.log("No user found");
        return null;
      }

    } catch (userError: any) {
      console.error("Failed to get user:", userError);
      return null;
    }

    // 4. 관리자 테이블에서 정보 가져오기
    try {
      const adminQueryPromise = supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id) // Now user is guaranteed to be not null here
        .single();

      // Add a timeout to the admin query promise (e.g., 5 seconds)
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error(`Admin query timeout for user ${user.id}`)), 5000) // 5초 타임아웃
      );

      const { data: adminData, error: adminError } = await Promise.race([adminQueryPromise, timeoutPromise]);
      
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
    } catch (adminLookupError: any) { // Type error
      console.error("Failed admin lookup:", adminLookupError);
      return null;
    }
  } catch (error: any) { // Type error
    console.error("Authentication error:", error);
    return null;
  }
}
