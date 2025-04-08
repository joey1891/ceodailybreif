"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { getCategoryUrl } from '@/lib/routes';
import { getAllCategories, CategoryItem } from '@/lib/category-loader';

export function MainNav() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  // 모든 카테고리 가져오기 (새로운 방식)
  const allCategories = React.useMemo(() => {
    return getAllCategories();
  }, []);
  
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
  
  // 링크 클릭 시 메뉴 닫기 함수
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };
  
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
          className="bg-white shadow-lg border-y border-gray-200 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto absolute left-0 top-[64px] w-full"
        >
          <div className="py-3 w-full px-3 sm:py-4 sm:px-4">
            <div className="flex flex-row overflow-x-auto pb-3 sm:pb-4 gap-3 sm:gap-6 no-scrollbar">
              {allCategories.map((category) => (
                <div key={category.id} className="flex flex-col items-start min-w-[80px] max-w-[80px] sm:min-w-[100px] sm:max-w-[100px] flex-shrink-0">
                  {/* Main category */}
                  <Link
                    href={`/${category.slug}`}
                    className="whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 rounded-md text-xs sm:text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
                    onClick={handleLinkClick}
                  >
                    {category.title.ko}
                  </Link>
                  
                  {/* Subcategories directly below each main category */}
                  <div className="w-full flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-3 pl-1">
                    {/* 주요일정인 경우 하드코딩된 항목 대신 동적으로 처리 */}
                    {category.id === "schedule" ? (
                      <>
                        <Link
                          href="/schedule/annual"
                          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-primary/80 hover:bg-gray-100 rounded-md transition-colors break-words"
                          onClick={handleLinkClick}
                        >
                          연간일정
                        </Link>
                        <Link
                          href="/schedule/monthly"
                          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-primary/80 hover:bg-gray-100 rounded-md transition-colors break-words"
                          onClick={handleLinkClick}
                        >
                          월간일정
                        </Link>
                      </>
                    ) : (
                      // 다른 카테고리는 기존 방식대로 처리
                      category.subcategories?.map((subcategory) => (
                        <Link
                          key={subcategory.id}
                          href={getCategoryUrl(category, subcategory)}
                          className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-primary/80 hover:bg-gray-100 rounded-md transition-colors break-words"
                          onClick={handleLinkClick}
                        >
                          {subcategory.title.ko}
                        </Link>
                      ))
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
