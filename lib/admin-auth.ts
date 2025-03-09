import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// ✅ 관리자 로그인 여부 확인 및 세션 유지
export async function getAdminUser(): Promise<User | null> {
  // 세션을 먼저 가져옴
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    console.warn("No active session found");
    return null;
  }

  const user = data.session.user;
  console.log("Authenticated User:", user);

  // 사용자의 역할(role) 조회
  const { data: roles, error: roleError } = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", user.id);

  console.log("Queried User ID:", user.id);
  console.log("Fetched Roles:", roles);

  if (roleError) {
    console.error("Role Query Error:", roleError.message);
    return null;
  }

  // "admin" 역할이 없는 경우 로그아웃 처리
  if (!roles || roles.length === 0 || !roles.some((r: { role: string }) => r.role === "admin")) {
    console.warn("User is not an admin, logging out...");
    await supabase.auth.signOut();
    return null;
  }

  return user;
}

export async function isAdmin(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(error?.message || "Sign in failed");
  }

  const user = data.user;
  console.log("SignIn Response:", data);
  console.log("Logged-in User ID:", user.id);

  // 사용자의 역할(role) 조회
  const { data: roles, error: roleError } = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", user.id);

  console.log("Fetched Roles:", roles);

  if (roleError || !roles || !roles.some((r: { role: string }) => r.role === "admin")) {
    await supabase.auth.signOut();
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
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
