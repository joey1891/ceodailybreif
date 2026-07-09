import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 text-black">
      {/* 사이드바 */}
      <aside className="w-64 bg-black text-white flex flex-col">
        <div className="p-6">
          <Link href="/admin">
            <h2 className="text-2xl font-serif font-bold tracking-tight">Daily Brief<br/><span className="text-red-500">CMS</span></h2>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 font-sans">
          <Link href="/admin/write" className="block px-4 py-2 rounded hover:bg-gray-800 transition">기사 작성</Link>
          <Link href="/admin/articles" className="block px-4 py-2 rounded hover:bg-gray-800 transition">기사 관리</Link>
          <Link href="/admin/headlines" className="block px-4 py-2 rounded hover:bg-gray-800 transition">헤드라인 편집</Link>
        </nav>
        <div className="p-4 border-t border-gray-800 font-sans">
          <Link href="/" className="text-sm text-gray-400 hover:text-white flex items-center">
            ← 메인 사이트로 돌아가기
          </Link>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}