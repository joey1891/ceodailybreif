'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { isAdmin } from '@/lib/admin-auth';
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);
  const router = useRouter();

  // Load saved email from localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const addLog = (message: string) => {
    console.log(message); // 콘솔에도 출력
    setDebugLogs((prev) => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage("");
    
    try {
      addLog(`로그인 시도: ${email}`);
      
      // 1. 세션 초기화
      // - 기존 세션을 정리하여 인증 상태 충돌 방지
      // - 이전 세션이 남아있는 경우 새 로그인에 영향을 줄 수 있음
      addLog("세션 초기화 중...");
      try {
        await supabase.auth.signOut();
        addLog("세션 초기화 완료");
      } catch (signOutError) {
        addLog(`세션 초기화 오류: ${signOutError}`);
      }
      
      // 2. 로그인 시도 - 세분화된 예외 처리
      // - 비동기 호출을 별도 블록으로 분리하여 정확한 에러 위치 추적
      // - Promise 반환 함수에서 발생하는 예외를 명시적으로 포착
      // - 이 세분화된 에러 처리가 문제 해결의 핵심이었음
      addLog("로그인 요청 직전...");
      let authResponse;
      
      try {
        addLog(`supabase.auth.signInWithPassword 호출 시작: ${email}`);
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        addLog("supabase.auth.signInWithPassword 호출 완료");
      } catch (loginError: any) {
        // 네트워크 오류, 타임아웃 등이 여기서 포착됨
        addLog(`로그인 요청 예외: ${loginError}`);
        throw new Error(`로그인 요청 실패: ${loginError.message || loginError}`);
      }
      
      // 3. 응답 처리 - 성공/실패 명확히 구분
      // - API 호출은 성공했으나 인증 실패한 경우
      addLog(`로그인 응답: success=${!authResponse.error}, user=${authResponse.data?.user?.id || 'none'}`);
      
      if (authResponse.error) {
        addLog(`로그인 오류 응답: ${authResponse.error.message}`);
        throw authResponse.error;
      }
      
      addLog(`로그인 성공: ${authResponse.data.user?.id}`);
      
      // 4. 성공 시 리다이렉트
      addLog("메인 페이지로 이동...");
      router.push('/');
      
    } catch (error: any) {
      // 모든 예외를 최종적으로 포착하여 사용자에게 표시
      addLog(`로그인 처리 최종 오류: ${error.message || error}`);
      setErrorMessage(error.message || "로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoggingIn(false);
      addLog("로그인 처리 완료");
    }
  };

  const checkSession = async () => {
    addLog("현재 세션 확인 중...");
    const { data, error } = await supabase.auth.getSession();
    addLog(`세션 데이터: ${JSON.stringify(data)}`);
    if (error) addLog(`세션 오류: ${error.message}`);
  };
  
  const clearSession = async () => {
    addLog("세션 초기화 중...");
    await supabase.auth.signOut();
    addLog("세션 초기화 완료");
    checkSession();
  };

  useEffect(() => {
    addLog("로그인 페이지 로드됨");
    checkSession();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {errorMessage && (
          <p className="text-red-500 mb-4">{errorMessage}</p>
        )}
        <Input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3"
        />
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="remember-me" 
            checked={rememberMe} 
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <label 
            htmlFor="remember-me" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            아이디 저장
          </label>
        </div>
        <Button onClick={handleLogin} className="w-full" disabled={isLoggingIn}>Login</Button>
      </div>
      
      {/* 디버그 섹션 토글 버튼
      <div className="mt-4 text-center">
        <button 
          onClick={() => setShowDebug(!showDebug)} 
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showDebug ? "디버그 숨기기" : "디버그 표시"}
        </button>
      </div> */}
      
      {/* 디버그 섹션
      {showDebug && (
        <div className="mt-8">
          <div className="flex space-x-2 mb-4">
            <button 
              onClick={checkSession} 
              className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded"
            >
              세션 확인
            </button>
            <button 
              onClick={clearSession} 
              className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded"
            >
              세션 초기화
            </button>
          </div>
          
          <div className="border p-4 bg-black text-green-400 font-mono h-64 overflow-auto">
            <h3 className="text-xs mb-2 text-gray-400">디버그 로그:</h3>
            {debugLogs.map((log, i) => (
              <div key={i} className="text-xs">{log}</div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}