'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 인증 상태 관리 (기본은 미인증 상태)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isChecking, setIsChecking] = useState(true); // 처음엔 확인 중 화면 표시

  // 대표님만 아는 비밀번호 (원하시는 번호로 변경 가능합니다!)
  const ADMIN_PASSWORD = 'ceo';

  // 1. 처음 페이지 로드 시, 브라우저에 인증 기록이 있는지 확인
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  // 2. 로그인 버튼 클릭 시 실행되는 함수
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // 브라우저 탭을 닫기 전까지 로그인 상태 유지
      sessionStorage.setItem('adminAuth', 'true');
    } else {
      alert('비밀번호가 틀렸습니다!');
      setPasswordInput('');
    }
  };

  // --- 화면 렌더링 시작 ---

  // 확인 중일 때
  if (isChecking) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">확인 중...</div>;

  // 인증되지 않았을 때 (로그인 화면 렌더링)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-sans">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 text-center max-w-sm w-full mx-4">
          <h2 className="text-2xl font-black font-serif mb-2 text-black uppercase tracking-tight">CEO Daily Brief</h2>
          <p className="text-gray-500 text-sm font-bold tracking-widest mb-8 uppercase">Admin Area</p>
          
          <input 
            type="password" 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter password" 
            className="w-full border-b-2 border-gray-300 p-3 mb-8 text-center text-xl font-bold focus:outline-none focus:border-red-800 text-black transition-colors"
            autoFocus
          />
          <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded hover:bg-red-800 transition-colors uppercase tracking-widest text-sm">
            Login
          </button>
          
          <div className="mt-6 text-sm">
            <Link href="/" className="text-gray-400 hover:text-black">Return to Main</Link>
          </div>
        </form>
      </div>
    );
  }

  // 인증 성공 시 (관리자 레이아웃 렌더링)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row text-black font-sans">
      {/* 1. 왼쪽 사이드바 메뉴 */}
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col min-h-screen">
        <div className="mb-10">
          <h2 className="text-2xl font-serif font-black uppercase tracking-tighter mb-1">CEO Daily Brief</h2>
          <p className="text-red-500 text-xs font-bold tracking-widest">CMS ADMIN</p>
        </div>
        
        <nav className="flex flex-col gap-6 font-bold flex-1">
          <Link href="/admin/write" className="hover:text-red-400 transition-colors">새 기사 작성</Link>
          <Link href="/admin/articles" className="hover:text-red-400 transition-colors">기사 관리</Link>
          <Link href="/admin/headlines" className="hover:text-red-400 transition-colors">헤드라인 편집</Link>
        </nav>

        <div className="mt-auto pt-8 border-t border-gray-800">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← 메인 홈으로
          </Link>
        </div>
      </aside>

      {/* 2. 메인 콘텐츠 영역 (이 자리에 기사 작성/관리 내용이 들어옴) */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
