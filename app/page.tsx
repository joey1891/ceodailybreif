// ... existing code ...
        <div className="text-center py-4 sm:py-6 cursor-pointer">
          <Link href="/">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-serif tracking-tighter uppercase leading-none break-words hover:text-gray-800 transition-colors" style={{ letterSpacing: '-0.05em' }}>
              CEO Daily Brief
            </h1>
          </Link>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base font-serif italic text-gray-600 px-2">
            The Executive&apos;s Window into South Korea&apos;s Markets, Policy, and Industry Intelligence
          </p>
        </div>

        <nav className="border-t-2 border-b border-black py-3 mt-4">
          <ul className="flex flex-col sm:flex-row justify-start sm:justify-center items-start sm:items-center gap-3 sm:gap-6 md:gap-8 text-[11px] sm:text-sm md:text-[15px] font-bold tracking-widest uppercase px-2 sm:px-0">
            {categories.map(cat => (
              <li key={cat} className="w-full sm:w-auto text-left">
                <Link href={`/news?category=${encodeURIComponent(cat)}`} className="hover:text-red-800 cursor-pointer transition-colors block w-full">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 border-b border-gray-300 pb-8 sm:pb-12">
          
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-10">
            {headlines.MAIN_HERO ? (
              <Link href={`/article?id=${headlines.MAIN_HERO.id}`}>
                <article className="group cursor-pointer">
                  {headlines.MAIN_HERO.image_url && (
                    <div className="w-full bg-gray-100 mb-4 sm:mb-6 overflow-hidden rounded">
                      <img 
                        src={headlines.MAIN_HERO.image_url} 
                        alt="Lead story" 
                        className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 ease-in-out grayscale-[20%]"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="text-red-800 font-bold text-xs sm:text-sm tracking-widest uppercase">{headlines.MAIN_HERO.category}</span>
                    <span className="text-gray-400 text-xs hidden sm:inline">|</span>
                    <span className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase">{formatTime(headlines.MAIN_HERO.created_at)}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-black font-serif leading-[1.15] mb-3 sm:mb-5 group-hover:text-red-800 transition-colors break-words">
                    {headlines.MAIN_HERO.title}
                  </h2>
                  <div 
                    className="text-sm sm:text-lg text-gray-700 leading-relaxed md:w-11/12 font-serif line-clamp-3 overflow-hidden break-words [&>p]:!mb-0 [&>div]:!mb-0"
                    dangerouslySetInnerHTML={{ __html: headlines.MAIN_HERO.content }}
                  />
                </article>
              </Link>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 font-serif italic text-xl">
                No Lead Story Published Yet.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-2 sm:mt-0">
              {[headlines.SUB_1, headlines.SUB_2].map((subArticle, idx) => (
// ... existing code ...
              ) : (
                <p className="text-sm font-serif italic text-gray-500">
                  Awaiting breaking news updates. (새 기사를 작성하면 이곳에 표시됩니다)
                </p>
              )}
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-gray-50 text-gray-400 py-6 sm:py-8 mt-8 sm:mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm sm:text-base font-serif font-black text-gray-800 uppercase tracking-tighter">CEO Daily Brief</h2>
            <p className="text-[10px] sm:text-xs font-serif italic mt-0.5">The Global Executive&apos;s Guide to South Korea.</p>
          </div>
          
          <div>
            <Link href="/admin" className="text-[10px] font-bold text-gray-400 hover:text-gray-800 uppercase tracking-widest transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
