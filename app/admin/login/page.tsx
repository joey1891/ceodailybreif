"use client";

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/supabase"; // lib/supabase에서 loginAdmin 함수 임포트

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
      console.log("Form submission values:");
      console.log("- Email:", email);
      console.log("- Password length:", password.length);
      
      // lib/supabase의 loginAdmin 함수 사용
      const { data, error } = await loginAdmin(email, password);

      if (error) {
        console.error("Login failed:", error);
        // loginAdmin 함수에서 이미 에러 로깅을 하므로 간단히 메시지 설정
        setErrorMessage(error.message || "로그인 실패");
        setIsLoggingIn(false);
        return;
      }

      // loginAdmin 함수 내에서 이미 admin_users 확인까지 완료됨
      // data.user가 존재하면 관리자로 간주
      if (data?.user) {
        console.log("Login successful, redirecting to admin page");
        router.push('/admin');
      } else {
        // loginAdmin에서 에러 없이 user가 null인 경우는 없어야 하지만, 안전을 위해 처리
        console.error("Login process completed without error but no user data.");
        setErrorMessage("로그인 처리 중 오류가 발생했습니다.");
      }
      
    } catch (error: any) { // any 타입으로 유지하되, message 속성 존재 여부 확인
      console.error("Unexpected login error:", error);
      // error 객체가 message 속성을 가지고 있는지 확인하여 안전하게 접근
      setErrorMessage((error as any).message || "로그인 처리 중 예상치 못한 오류 발생");
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
