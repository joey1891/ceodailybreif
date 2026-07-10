<!-- ... existing code ... -->
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 border-b border-gray-300 pb-8 sm:pb-12">
          
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-10">
            {headlines.MAIN_HERO ? (
              <Link href={`/article?id=${headlines.MAIN_HERO.id}`}>
                <article className="group cursor-pointer">
                  {headlines.MAIN_HERO.image_url && (
                    {/* 높이 제한(h-[350px])을 제거하고, 비율을 유지하며 전체가 보이도록 수정 */}
                    <div className="w-full bg-gray-100 mb-4 sm:mb-6 overflow-hidden rounded">
                      <img 
                        src={headlines.MAIN_HERO.image_url} 
                        alt="Lead story" 
                        {/* object-cover를 빼고 w-full, h-auto를 사용하여 이미지 원본 비율대로 표시되게 함 */}
                        className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 ease-in-out grayscale-[20%]"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
<!-- ... existing code ... -->
            <hr className="border-gray-200" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {[headlines.SUB_1, headlines.SUB_2].map((subArticle, idx) => (
                subArticle ? (
                  <Link key={idx} href={`/article?id=${subArticle.id}`}>
                    <article className="group cursor-pointer flex flex-col h-full">
                      {subArticle.image_url && (
                        {/* 서브 기사도 높이 제한을 풀거나 비율(aspect-video)을 사용하는 것이 좋습니다. 여기서는 원본 비율 유지로 변경합니다. */}
                        <div className="w-full bg-gray-100 mb-3 sm:mb-4 overflow-hidden rounded">
                          <img 
                            src={subArticle.image_url} 
                            alt={subArticle.title} 
                            className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 grayscale-[20%]"
                          />
                        </div>
                      )}
                      <span className="text-red-800 font-bold text-[10px] sm:text-xs tracking-widest mb-2 uppercase">{subArticle.category}</span>
<!-- ... existing code ... -->
