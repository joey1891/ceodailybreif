'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

/**
 * 관리자 영역 레이아웃
 *
 * 인증 방식: Supabase Auth (이메일 + 비밀번호)
 *  - 로그인 세션(JWT)은 supabase-js 가 브라우저에 보관하며, 이후 모든 DB/Storage 요청에 자동으로 실립니다.
 *  - "관리자인지"는 DB의 public.admins 테이블 + public.is_admin() 함수로 판정합니다.
 *  - 이 화면의 게이트는 UX 용도일 뿐이며, 실제 보안은 RLS 정책(supabase/migrations/*_security.sql)이 담당합니다.
 *    즉 누군가 이 화면을 우회하더라도 관리자 계정이 아니면 DB 쓰기·삭제가 거부됩니다.
 */

type AuthState = 'checking' | 'signed_out' | 'not_admin' | 'admin';

const GTM_SNIPPET = `
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-PTCS5PBM');
`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [session, setSession] = useState<Session | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 세션이 있으면 DB 함수 is_admin() 으로 관리자 여부 확인
  const evaluateSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession) {
      setAuthState('signed_out');
      return;
    }
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.error('is_admin check failed:', error);
      setAuthState('not_admin');
      return;
    }
    setAuthState(data === true ? 'admin' : 'not_admin');
  }, []);

  useEffect(() => {
    // 1) 최초 진입 시 저장된 세션 확인
    supabase.auth.getSession().then(({ data }) => evaluateSession(data.session));

    // 2) 로그인/로그아웃/토큰 갱신 이벤트 구독
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // onAuthStateChange 콜백 안에서 바로 supabase 호출을 await 하면 교착될 수 있어 다음 tick 으로 미룸
      setTimeout(() => evaluateSession(nextSession), 0);
    });

    return () => subscription.subscription.unsubscribe();
  }, [evaluateSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsSigningIn(false);
    if (error) {
      setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
      setPassword('');
      return;
    }
    setPassword('');
    // 이후 상태 전환은 onAuthStateChange 가 처리
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState('signed_out');
  };

  const gtm = (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">{GTM_SNIPPET}</Script>
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-PTCS5PBM"
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );

  // --- 확인 중 ---
  if (authState === 'checking') {
    return (
      <>
        {gtm}
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">확인 중...</div>
      </>
    );
  }

  // --- 로그인은 되었지만 관리자 계정이 아님 ---
  if (authState === 'not_admin') {
    return (
      <>
        {gtm}
        <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-sans">
          <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 text-center max-w-sm w-full mx-4">
            <h2 className="text-2xl font-black font-serif mb-2 text-black uppercase tracking-tight">CEO Daily Brief</h2>
            <p className="text-red-700 text-sm font-bold mb-2">관리자 권한이 없는 계정입니다.</p>
            <p className="text-gray-500 text-xs mb-8 break-all">{session?.user.email}</p>
            <button
              onClick={handleLogout}
              className="w-full bg-black text-white font-bold py-3 rounded hover:bg-red-800 transition-colors uppercase tracking-widest text-sm"
            >
              Logout
            </button>
            <div className="mt-6 text-sm">
              <Link href="/" className="text-gray-400 hover:text-black">Return to Main</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- 로그인 화면 ---
  if (authState === 'signed_out') {
    return (
      <>
        {gtm}
        <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-sans">
          <form onSubmit={handleLogin} className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 text-center max-w-sm w-full mx-4">
            <h2 className="text-2xl font-black font-serif mb-2 text-black uppercase tracking-tight">CEO Daily Brief</h2>
            <p className="text-gray-500 text-sm font-bold tracking-widest mb-8 uppercase">Admin Area</p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              autoComplete="username"
              required
              className="w-full border-b-2 border-gray-300 p-3 mb-4 text-center font-bold focus:outline-none focus:border-red-800 text-black transition-colors"
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full border-b-2 border-gray-300 p-3 mb-6 text-center font-bold focus:outline-none focus:border-red-800 text-black transition-colors"
            />

            {errorMessage && <p className="text-red-700 text-xs font-bold mb-4">{errorMessage}</p>}

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full bg-black text-white font-bold py-3 rounded hover:bg-red-800 transition-colors uppercase tracking-widest text-sm disabled:bg-gray-400"
            >
              {isSigningIn ? 'Signing in...' : 'Login'}
            </button>

            <div className="mt-6 text-sm">
              <Link href="/" className="text-gray-400 hover:text-black">Return to Main</Link>
            </div>
          </form>
        </div>
      </>
    );
  }

  // --- 관리자 레이아웃 ---
  return (
    <>
      {gtm}
      <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row text-black font-sans">
        <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col min-h-screen">
          <div className="mb-10">
            <h2 className="text-2xl font-serif font-black uppercase tracking-tighter mb-1">CEO Daily Brief</h2>
            <p className="text-red-500 text-xs font-bold tracking-widest">CMS ADMIN</p>
          </div>

          <nav className="flex flex-col gap-6 font-bold flex-1">
            <Link href="/admin/write" className="hover:text-red-400 transition-colors">새 기사 작성</Link>
            <Link href="/admin/articles" className="hover:text-red-400 transition-colors">기사 관리</Link>
            <Link href="/admin/headlines" className="hover:text-red-400 transition-colors">헤드라인 편집</Link>
            <Link href="/admin/banners" className="hover:text-red-400 transition-colors">배너 관리</Link>
          </nav>

          <div className="mt-auto pt-8 border-t border-gray-800 flex flex-col gap-3">
            <p className="text-gray-500 text-xs break-all">{session?.user.email}</p>
            <button onClick={handleLogout} className="text-left text-gray-400 hover:text-white text-sm transition-colors">
              로그아웃
            </button>
            <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
              ← 메인 홈으로
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}






