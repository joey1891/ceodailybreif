"use client";

import { supabase } from "./supabase";
import { useEffect, useState, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from '@supabase/ssr';

// 관리자 사용자 타입 정의
type AdminUser = User & {
  role?: string;
  name?: string | null;
  isSuperAdmin?: boolean;
  isSubAdmin?: boolean;
};

// ✅ 관리자 로그인 여부 확인 및 세션 유지를 위한 훅
export function useAdminSession() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Supabase 클라이언트 인스턴스를 useMemo로 감싸서 한 번만 생성되도록 함
  const supabase = useMemo(() => {
    // console.log("useAdminSession: Creating Supabase client");
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  useEffect(() => {
    let isMounted = true; // 컴포넌트 마운트 상태 추적
    // console.log("useAdminSession: useEffect triggered. Supabase instance:", supabase ? "exists" : "null");

    const getSessionAndSetUser = async () => {
      // console.log("useAdminSession: getSessionAndSetUser called");
      if (!isMounted) return;
      setLoading(true);

      const { data: { session }, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("Error getting session in useAdminSession:", error);
        setAdminUser(null);
      } else if (session) {
        // TODO: 실제 관리자 역할 확인 로직 추가
        // const isAdmin = await checkUserAdminRole(supabase, session.user.id);
        // setAdminUser(isAdmin ? session.user : null);
        setAdminUser(session.user); // 현재: 로그인된 사용자는 모두 관리자로 간주
        // console.log("useAdminSession: Session found, user set:", session.user.id);
      } else {
        setAdminUser(null);
        // console.log("useAdminSession: No session found.");
      }
      setLoading(false);
    };

    getSessionAndSetUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // console.log("useAdminSession: onAuthStateChange triggered", _event, "Session:", session ? session.user.id : null);
        if (!isMounted) return;
        
        // 인증 상태 변경 시에도 로딩 상태를 잠시 true로 설정하여 UI가 올바르게 반응하도록 할 수 있습니다.
        // setLoading(true); // 필요에 따라 주석 해제

        if (session) {
          // TODO: 실제 관리자 역할 확인 로직 추가
          // const isAdmin = await checkUserAdminRole(supabase, session.user.id);
          // setAdminUser(isAdmin ? session.user : null);
          setAdminUser(session.user);
        } else {
          setAdminUser(null);
        }
        // 인증 상태 변경 처리 후 로딩 상태를 false로 설정합니다.
        // (위에서 setLoading(true)를 사용했다면 여기서 false로 설정)
        if (isMounted) setLoading(false); // setLoading(true)를 사용하지 않았다면 이 줄도 필요 없을 수 있음
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
      // console.log("useAdminSession: Unsubscribed from auth listener");
    };
  }, [supabase]); // supabase는 이제 안정적인 의존성임

  // console.log("useAdminSession: Returning state - loading:", loading, "adminUser:", adminUser ? adminUser.id : null);
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
      setTimeout(() => { // Added a block for the callback
        if (!user) { // Add null check for user
          reject(new Error(`Admin query timeout for an unknown user`)); // Handle null user case
        } else {
          reject(new Error(`Admin query timeout for user ${user.id}`)); // Original logic
        }
      }, 5000) // 5초 타임아웃
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
        setTimeout(() => { // Added a block for the callback
          if (!user) { // Add null check for user
            reject(new Error(`Admin query timeout for an unknown user`)); // Handle null user case
          } else {
            reject(new Error(`Admin query timeout for user ${user.id}`)); // Original logic
          }
        }, 5000) // 5초 타임아웃
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

