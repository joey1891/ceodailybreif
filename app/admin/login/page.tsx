"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("1234");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage("");
    
    try {
      // 폼 제출 시 입력값 확인
      console.log("Form submission values:");
      console.log("- Email:", email);
      console.log("- Password length:", password.length);
      console.log("- Password first/last char:", password[0] + "..." + password[password.length-1]);
      
      // 1. 세션 정리
      console.log("Clearing session (before signOut call)...");
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error("Error during signOut:", JSON.stringify(signOutError, null, 2));
          // signOut 오류도 화면에 표시하거나 별도 처리 가능
          setErrorMessage(`세션 초기화 실패: ${signOutError.message}`); 
          setIsLoggingIn(false);
          return; // signOut 실패 시 더 이상 진행하지 않음
        }
        console.log("Successfully signed out (or no session to sign out).");
      } catch (e: any) {
        console.error("Exception during signOut:", JSON.stringify(e, null, 2));
        setErrorMessage(`세션 초기화 중 예외 발생: ${e.message}`);
        setIsLoggingIn(false);
        return; // signOut 실패 시 더 이상 진행하지 않음
      }

      // signOut 직후 세션 상태 확인 (디버깅용)
      const sessionAfterSignOut = await supabase.auth.getSession();
      console.log("Session state immediately after signOut attempt:", JSON.stringify(sessionAfterSignOut.data.session, null, 2));
      
      // 2. 로그인 직전 확인
      console.log("About to call auth.signInWithPassword with:");
      console.log("- Email:", email);
      console.log("- Password (masked):", "*".repeat(password.length));
      
      // 매우 기본적인 로그인 시도
      const authResponse = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // 로그인 응답 확인 (비밀번호 정보는 제외)
      console.log("Raw auth response:");
      console.log("- Success:", !authResponse.error);
      console.log("- User:", authResponse.data?.user?.id);
      console.log("- Error:", authResponse.error);
      
      if (authResponse.error) throw authResponse.error;
      
      // 3. 로그인은 성공했지만 admin 여부 확인
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", authResponse.data.user.id)
        .single();

      // ===== 추가된 디버깅 로그 시작 =====
      console.log("Detailed Admin Check - User ID for query:", authResponse.data.user.id);
      console.log("Detailed Admin Check - adminData (raw):", JSON.stringify(adminData, null, 2));
      console.log("Detailed Admin Check - adminError (raw):", JSON.stringify(adminError, null, 2));
      console.log("Detailed Admin Check - Is adminData truthy?", !!adminData);
      console.log("Detailed Admin Check - Is adminError truthy?", !!adminError);
      // ===== 추가된 디버깅 로그 끝 =====
      
      // 기존 로그
      console.log("Admin check:");
      console.log("- User ID:", authResponse.data.user.id);
      console.log("- Found admin:", !!adminData);
      console.log("- Error:", adminError);
      
      if (adminError || !adminData) {
        // ===== 조건 확인 로그 추가 시작 =====
        if (adminError) {
          console.error("Throwing error because adminError is present. Message:", adminError.message, "Details:", JSON.stringify(adminError, null, 2));
        }
        if (!adminData) {
          console.error("Throwing error because adminData is falsy (null, undefined, etc.). Current adminData:", JSON.stringify(adminData, null, 2));
        }
        // ===== 조건 확인 로그 추가 끝 =====
        throw new Error("해당 이메일은 관리자로 등록되지 않았습니다. (Debug: adminError or !adminData condition met)");
      }
      
      // 4. 성공 시 이동
      console.log("Login successful, redirecting to admin page");
      router.push('/admin');
      
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "로그인 실패");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          관리자 로그인
        </h2>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
          </div>

          {errorMessage && (
            <div className="text-red-500 text-sm">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoggingIn ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
