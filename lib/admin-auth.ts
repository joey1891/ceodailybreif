"use client";

import { supabase } from "./supabase";
import { useEffect, useState, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from '@supabase/ssr';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { useQuery as useSupabaseQuerySWR } from '@supabase-cache-helpers/postgrest-swr';

// SWR과 함께 사용할 새로운 관리자 사용자 타입
export type AdminUserDetails = {
  role?: string;
  name?: string | null;
  isSuperAdmin: boolean;
  isSubAdmin: boolean;
};

export type AdminSessionUser = User & AdminUserDetails;

// ✅ 관리자 로그인 여부 확인 및 세션 유지를 위한 SWR 기반 훅
export function useAdminSession() {
  // Supabase 클라이언트 인스턴스를 useMemo로 감싸서 한 번만 생성되도록 함
  const supabaseClient = useMemo(() => {
    // console.log("useAdminSession: Creating Supabase client");
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // 1. @supabase/auth-helpers-react의 useSessionContext를 사용하여 세션 정보 가져오기
  const { 
    session, 
    isLoading: isLoadingAuthUser, 
    error: authUserError 
  } = useSessionContext();

  // 추가된 로그
  console.log("useAdminSession - auth state:", { session, isLoadingAuthUser, authUserError });

  const supabaseAuthUser = session?.user ?? null;

  // 2. supabaseAuthUser가 존재하면 admin_users 테이블에서 추가 정보(role, name) 가져오기
  // supabaseAuthUser가 null이면 adminDetailsQueryBuilder도 null이 되어 useSupabaseQuerySWR은 실행되지 않음
  const adminDetailsQueryBuilder = useMemo(() => supabaseAuthUser
    ? supabaseClient
        .from("admin_users")
        .select("role, name")
        .eq("id", supabaseAuthUser.id)
        .single()
    : null, [supabaseAuthUser, supabaseClient]);
  
  // 추가된 로그
  console.log("useAdminSession - adminDetailsQueryBuilder:", adminDetailsQueryBuilder ? 'Querying' : 'Not Querying (no auth user)');

  const { 
    data: adminDbDetails, 
    isLoading: isLoadingAdminDbDetails, 
    error: adminDbDetailsError 
  } = useSupabaseQuerySWR<Pick<AdminUserDetails, "role" | "name"> | null>(
    adminDetailsQueryBuilder, 
    {
      // 필요한 경우 SWR 옵션 추가 (예: revalidateOnFocus: false)
    }
  );
  
  // 추가된 로그
  console.log("useAdminSession - admin_users query state:", { adminDbDetails, isLoadingAdminDbDetails, adminDbDetailsError });
  
  // 3. 인증 사용자 정보와 admin_users 테이블 정보를 결합
  const adminUser = useMemo((): AdminSessionUser | null => {
    if (!supabaseAuthUser) {
      return null; // 로그인하지 않은 상태
    }

    const role = adminDbDetails?.role;
    const name = adminDbDetails?.name;

    return {
      ...supabaseAuthUser,
      role: role,
      name: name || supabaseAuthUser.email, // admin_users에 이름이 없으면 이메일을 기본값으로 사용
      isSuperAdmin: role === 'super_admin',
      isSubAdmin: role === 'sub_admin',
    };
  }, [supabaseAuthUser, adminDbDetails]);

  // 4. 로딩 및 에러 상태 통합
  const loading = isLoadingAuthUser || (!!supabaseAuthUser && isLoadingAdminDbDetails);
  const error = authUserError || adminDbDetailsError;

  // 추가된 로그
  console.log("useAdminSession - final state:", { adminUser, loading, error });
  return { adminUser, loading, error }; // error 상태도 반환하도록 추가
}

// ✅ 관리자 로그인 여부 확인 및 세션 유지 (이 함수는 주로 서버 사이드 또는 단일 호출용으로 사용될 수 있습니다)
export async function getAdminUser(): Promise<AdminSessionUser | null> { // 반환 타입 업데이트 고려
  console.log("getAdminUser: Fetching session");
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
    const adminUserResult: AdminSessionUser = { // 타입 명시
      ...user,
      role: adminData.role,
      name: adminData.name,
      isSuperAdmin: adminData.role === 'super_admin', // isSuperAdmin, isSubAdmin 추가
      isSubAdmin: adminData.role === 'sub_admin',
    };
    
    console.log("Returning admin user:", adminUserResult);
    return adminUserResult;
  } catch (sessionFetchError: any) { // Added catch block and type
    console.error("getAdminUser: getSession or subsequent logic caught an exception:", sessionFetchError); // Log exception
    return null;
  }
}

// ✅ 관리자 로그아웃
export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut(); // supabaseClient.auth.signOut() 사용 고려
  if (error) {
    console.error("Error signing out admin:", error);
  }
  // useSupabaseUserSWR 훅이 자동으로 상태를 업데이트합니다.
}

// ✅ 슈퍼 관리자 확인 함수 개선
export function isSuperAdmin(user: AdminSessionUser | User | null): boolean {
  // console.log("Checking super admin status for:", user);
  if (!user) return false;

  // AdminSessionUser 타입에 isSuperAdmin 속성이 있는지 먼저 확인
  if ('isSuperAdmin' in user && typeof (user as AdminSessionUser).isSuperAdmin === 'boolean') {
    const result = (user as AdminSessionUser).isSuperAdmin;
    // console.log("Is super admin (from isSuperAdmin prop):", result);
    return result;
  }
  // 이전처럼 role 속성으로 확인 (하위 호환성 또는 User 타입 직접 사용 시)
  if ('role' in user) {
    const result = (user as { role?: string }).role === 'super_admin';
    // console.log("Is super admin (from role prop):", result);
    return result;
  }
  // console.log("Is super admin: false (no relevant props)");
  return false;
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

// authenticateAdmin 함수 (이 함수는 주로 서버 사이드 또는 단일 호출용으로 사용될 수 있습니다)
export async function authenticateAdmin(): Promise<AdminSessionUser | null> { // 반환 타입 업데이트 고려
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
      const resultUser: AdminSessionUser = { // 타입 명시
        ...user,
        role: adminData.role,
        name: adminData.name,
        isSuperAdmin: adminData.role === 'super_admin',
        isSubAdmin: adminData.role === 'sub_admin',
      };
      return resultUser;
    } catch (adminLookupError: any) { // Type error
      console.error("Failed admin lookup:", adminLookupError);
      return null;
    }
  } catch (error: any) { // Type error
    console.error("Authentication error:", error);
    return null;
  }
}

