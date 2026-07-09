import { supabase } from '@/utils/supabase';
import Link from 'next/link';

// 캐시 주기를 설정하여 빠른 페이지 로딩 보장 (ISR 방식)
export const revalidate = 60; 

export default async function Home() {
  // 메인 화면에 노출될 헤드라인 기사들을 가져옵니다.
  const { data: headlines } = await supabase
    .from('headlines')
    .select(`
      position,
      articles ( id, title, content, category, image_url, author_name, created_at )
    `);

  // 위치별 기사 매핑
  const mainHero = headlines?.find(h => h.position === 'MAIN_HERO')?.articles;
  const sub1 = headlines?.find(h => h.position === 'SUB_1')?.articles;
  const sub2 = headlines?.find(h => h.position === 'SUB_2')?.articles;

  // Format date to English style
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      
      {/* === MASTHEAD === */}
      <header className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 pb-2">
        {/* Top Utility Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-300 pb-2 gap-2 sm:gap-0">
          <span>{currentDate}</span>
          <span className="flex space-x-4">
            <Link href="#" className="hover:text-black transition-colors">Global Edition</Link>
            <Link href="#" className="hover:text-black transition-colors">Newsletter</Link>
          </span>
        </div>
        
        {/* Main Logo Title */}
        <div className="text-center py-4 sm:py-6">
          <Link href="/">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-serif tracking-tighter uppercase leading-none break-words" style={{ letterSpacing: '-0.05em' }}>
              CEO Daily Brief
            </h1>
          </Link>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base font-serif italic text-gray-600 px-2">
            The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence
          </p>
        </div>

        {/* Section Navigation */}
        <nav className="border-t-2 border-b border-black py-2 sm:py-3 mt-2 sm:mt-4">
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-6 md:gap-10 text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase">
            <li><Link href="#politics" className="hover:text-red-800 transition-colors">Politics & Policy</Link></li>
            <li><Link href="#economy" className="hover:text-red-800 transition-colors">Economy & Markets</Link></li>
            <li><Link href="#industry" className="hover:text-red-800 transition-colors">Chaebol & Industry</Link></li>
            <li><Link href="#tech" className="hover:text-red-800 transition-colors">Tech & Innovation</Link></li>
            <li><Link href="#beauty" className="hover:text-red-800 transition-colors">K-Beauty</Link></li>
            <li><Link href="#culture" className="hover:text-red-800 transition-colors">K-Culture & Society</Link></li>
          </ul>
        </nav>
      </header>

      {/* === MAIN CONTENT GRID === */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        
        {/* Top Section: Hero (Left/Center) + Sidebar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 border-b border-gray-300 pb-8 sm:pb-12">
          
          {/* Main Content Area (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-10">
            
            {/* The Lead Story */}
            <section>
              {mainHero ? (
                <article className="group cursor-pointer">
                  <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] bg-gray-200 mb-4 sm:mb-6 overflow-hidden">
                    {mainHero.image_url ? (
                      <img 
                        src={mainHero.image_url} 
                        alt="Lead story" 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-in-out grayscale-[20%]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="text-red-800 font-bold text-xs sm:text-sm tracking-widest uppercase">{mainHero.category}</span>
                    <span className="text-gray-400 text-xs hidden sm:inline">|</span>
                    <span className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase">{new Date(mainHero.created_at).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-black font-serif leading-[1.15] mb-3 sm:mb-5 group-hover:text-gray-700 transition-colors break-words">
                    {mainHero.title}
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed md:w-11/12 font-serif line-clamp-3">
                    {mainHero.content}
                  </p>
                  <div className="mt-4 text-xs sm:text-sm font-bold text-black border-l-2 border-red-800 pl-3 uppercase">
                    By {mainHero.author_name}
                  </div>
                </article>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-100 text-gray-500 font-bold font-serif">No Lead Story Published Yet.</div>
              )}
            </section>
          </div>

          {/* Right Sidebar (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col">
            
            {/* Markets & Policy Briefing (SUB_1, SUB_2) */}
            <div className="px-2 sm:px-0">
              <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase border-b-2 border-black pb-2 mb-4 sm:mb-5">
                Executive Briefing
              </h3>
              
              <div className="flex flex-col gap-6 sm:gap-8">
                {sub1 && (
                  <article className="border-b border-gray-200 pb-6 group cursor-pointer">
                    <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 block uppercase">{sub1.category}</span>
                    <h4 className="text-xl sm:text-2xl font-bold font-serif mb-2 group-hover:text-red-700 leading-snug transition-colors">
                      {sub1.title}
                    </h4>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
                      {sub1.author_name}
                    </div>
                  </article>
                )}

                {sub2 && (
                  <article className="group cursor-pointer">
                    <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 block uppercase">{sub2.category}</span>
                    <h4 className="text-xl sm:text-2xl font-bold font-serif mb-2 group-hover:text-red-700 leading-snug transition-colors">
                      {sub2.title}
                    </h4>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
                      {sub2.author_name}
                    </div>
                  </article>
                )}

                {!sub1 && !sub2 && (
                   <p className="text-sm text-gray-500 italic font-serif">Awaiting breaking news updates.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* === FOOTER === */}
      <footer className="bg-[#111] text-white py-12 sm:py-16 mt-12 sm:mt-16 border-t-[8px] sm:border-t-[12px] border-red-800">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-8 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black mb-2 uppercase tracking-tighter">CEO Daily Brief</h2>
            <p className="text-gray-400 text-xs sm:text-sm font-serif italic">The Global Executive's Guide to South Korea.</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 text-[10px] sm:text-sm font-bold text-gray-400 uppercase tracking-wider">
            <Link href="#" className="hover:text-white transition-colors">About Us</Link>
            <Link href="#" className="hover:text-white transition-colors">Subscribe</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            {/* Admin Link Moved to Footer */}
            <Link href="/admin" className="hover:text-white transition-colors text-red-700">Admin Login</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 text-center md:text-left text-[10px] sm:text-xs text-gray-600">
          © {new Date().getFullYear()} CEO Daily Brief Media Group. All rights reserved. Reproduction without permission is prohibited.
        </div>
      </footer>

    </div>
  );
}