'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const sessionFetcher = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      addLog(`세션 가져오기 SWR 오류: ${error.message}`);
      throw error;
    }
    addLog(`세션 데이터 (SWR): ${JSON.stringify(session)}`);
    return session;
  };

  const { data: currentSession, isLoading: isLoadingSession } = useSWR<Session | null>(
    'user_session',
    sessionFetcher,
  );

  useEffect(() => {
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const addLog = (message: string) => {
    console.log(message);
    setDebugLogs((prev) => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage("");
    
    try {
      addLog(`로그인 시도: ${email}`);
      
      addLog("supabase.auth.signInWithPassword 호출 시작...");
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      addLog("supabase.auth.signInWithPassword 호출 완료");
      
      if (authError) {
        addLog(`로그인 오류 응답: ${authError.message}`);
        throw new Error(authError.message || "로그인에 실패했습니다.");
      }
      
      addLog(`로그인 성공: ${data.user?.id}`);

      if (rememberMe) {
        localStorage.setItem('adminEmail', email);
        addLog(`이메일 저장됨: ${email}`);
      } else {
        localStorage.removeItem('adminEmail');
        addLog("저장된 이메일 삭제됨");
      }
      
      addLog("메인 페이지로 이동...");
      router.push('/');
      
    } catch (error: any) {
      addLog(`로그인 처리 최종 오류: ${error.message || error}`);
      setErrorMessage(error.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoggingIn(false);
      addLog("로그인 처리 완료");
    }
  };

  useEffect(() => {
    addLog("로그인 페이지 로드됨");
    if (!isLoadingSession && currentSession) {
      addLog("SWR: 활성 세션 감지됨. 메인 페이지로 리다이렉트합니다.");
      router.push('/');
    } else if (!isLoadingSession && !currentSession) {
      addLog("SWR: 활성 세션 없음.");
    } else if (isLoadingSession) {
      addLog("SWR: 세션 로딩 중...");
    }
  }, [currentSession, isLoadingSession, router, addLog]);

  if (isLoadingSession) {
    // 세션 로딩 중에는 로딩 스피너 등을 보여줄 수 있습니다.
    // return <div>Loading session...</div>; // 예시: 간단한 로딩 표시
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
        {errorMessage && (
          <p className="text-red-500 mb-4">{errorMessage}</p>
        )}
        <Input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3"
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3"
          autoComplete="current-password"
        />
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="remember-me" 
            checked={rememberMe} 
            onCheckedChange={(checked) => {
              const newCheckedState = checked as boolean;
              setRememberMe(newCheckedState);
              if (!newCheckedState) {
                localStorage.removeItem('adminEmail');
                addLog("아이디 저장 체크 해제, 저장된 이메일 즉시 삭제");
              }
            }}
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
      
      {/* 디버그 섹션 토글 버튼 - 주석 처리 
      <div className="mt-4 text-center">
        <button 
          onClick={() => setShowDebug(!showDebug)} 
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showDebug ? "디버그 숨기기" : "디버그 표시"}
        </button>
      </div>
      */}
      
      {/* 디버그 섹션 - 주석 처리
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
      )}
      */}
    </div>
  );
}
