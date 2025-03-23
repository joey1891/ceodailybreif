"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { categoryOptions } from "@/lib/category-options";
import { Menu, X } from "lucide-react";
import { getCategoryUrl } from '@/lib/routes';

export function MainNav() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  // 모든 카테고리 가져오기 (주요일정은 이미 categoryOptions에 있음)
  const allCategories = React.useMemo(() => {
    return Array.from(categoryOptions.values());
  }, []);
  
  // 카테고리 수에 따른 동적 스타일 계산
  const categoryCount = allCategories.length;
  
  // 메뉴 바깥 클릭 시 닫기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen && 
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);
  
  return (
    <div className="relative w-full max-w-[1400px] ml-0 mr-auto">
      <div className="flex justify-start py-3 pl-0 pr-3 mx-0">
        <button 
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-primary" />
          ) : (
            <Menu className="h-6 w-6 text-primary" />
          )}
        </button>
      </div>
      
      {isMenuOpen && (
        <div 
          ref={menuRef}
          style={{ width: "1400px", position: "absolute", left: 0, top: "64px" }} 
          className="bg-white shadow-lg border-y border-gray-200 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto"
        >
          <div className="py-4 w-full">
            {/* 메인 카테고리 가로 정렬 - 동적 너비 계산 */}
            <div 
              className="grid gap-4 pb-4 mb-4 border-b border-gray-200"
              style={{ 
                gridTemplateColumns: `repeat(${categoryCount}, minmax(0, 1fr))` 
              }}
            >
              {allCategories.map((category, idx) => (
                <div key={idx}>
                  <Link
                    href={category.href || "#"}
                    className="block px-3 py-2 bg-primary/10 rounded-md text-sm font-bold text-primary hover:bg-primary/20 transition-colors text-center"
                  >
                    {category.title}
                  </Link>
                </div>
              ))}
            </div>
            
            {/* 하위 카테고리 가로 정렬 */}
            <div 
              className="grid gap-4"
              style={{ 
                gridTemplateColumns: `repeat(${categoryCount}, minmax(0, 1fr))` 
              }}
            >
              {Array.from(categoryOptions.values()).map((category) => (
                <div key={category.title} className="space-y-1">
                  <div className="flex flex-col space-y-1">
                    {/* 주요일정인 경우 하드코딩된 항목 대신 동적으로 처리 */}
                    {category.title === "주요일정" ? (
                      <>
                        <Link
                          href="/schedule/annual"
                          className="px-3 py-2 text-sm text-primary/80 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          연간일정
                        </Link>
                        <Link
                          href="/schedule/monthly"
                          className="px-3 py-2 text-sm text-primary/80 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          월간일정
                        </Link>
                      </>
                    ) : (
                      // 다른 카테고리는 기존 방식대로 처리
                      category.items.map((item) => {
                        const href = getCategoryUrl(category, item.slug);
                        return (
                          <Link
                            key={href}
                            href={href}
                            className="px-3 py-2 text-sm text-primary/80 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            {item.title}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
