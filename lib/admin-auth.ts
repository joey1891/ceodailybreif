import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// Add this type definition
type AdminUser = User & {
  role?: string;
  name?: string | null;
};

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
  const { data: adminData, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .single();

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

// ✅ 관리자 인증 확인 함수 개선
export async function isAdmin() {
  try {
    // 현재 세션 확인 - 이미 로그인된 사용자가 있는지 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    // 세션이 있으면 관리자 여부만 확인하고 반환
    if (session?.user) {
      return await getAdminUser();
    }
    
    // 세션이 없으면 null 반환
    return null;
  } catch (error) {
    console.error("Admin authentication error:", error);
    return null;
  }
}

// ✅ 관리자 로그아웃
export async function signOutAdmin() {
  await supabase.auth.signOut();
}

// ✅ React Hook으로 관리자 세션 유지 & 로그인 상태 감지
export function useAdminSession() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminSession() {
      const user = await getAdminUser();
      setAdminUser(user);
      setLoading(false);
    }

    checkAdminSession();

    // Supabase Auth 상태 변화 감지 (로그인/로그아웃 시 자동 업데이트)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        getAdminUser().then(setAdminUser);
      } else {
        setAdminUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { adminUser, loading };
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
