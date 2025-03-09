"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";
import debounce from "lodash.debounce";

export default function SearchDropdown() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // HTML 태그 제거 및 기본 특수문자 치환 (필요시 추가 개선)
  const sanitizeText = (text: string): string => {
    // HTML 태그 제거
    let sanitized = text.replace(/<[^>]+>/g, "");
    // HTML 엔티티 치환 (예시: &amp; → &)
    sanitized = sanitized.replace(/&amp;/g, "&");
    sanitized = sanitized.replace(/&lt;/g, "<");
    sanitized = sanitized.replace(/&gt;/g, ">");
    // 필요에 따라 추가 치환 적용
    return sanitized;
  };

  // 검색 결과 가져오기
  const fetchResults = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,content.ilike.%${q}%`);
    if (error) {
      console.error("Search error:", error.message);
      setResults([]);
    } else {
      setResults(data || []);
    }
  };

  // 300ms 디바운스 적용
  const debouncedFetchResults = debounce(fetchResults, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    debouncedFetchResults(q);
    setShowDropdown(true);
    setSelectedIndex(-1); // 입력 시 선택 초기화
  };

  // 키보드 내비게이션 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleResultClick(results[selectedIndex].id);
      }
    }
  };

  // 결과 항목 클릭 시 상세 페이지로 이동
  const handleResultClick = (id: string) => {
    setShowDropdown(false);
    router.push(`/article/${id}`);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 엔터 제출 시 별도 검색 결과 페이지로 이동할 수도 있음
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // 검색어와 매칭되는 부분 하이라이트
  const highlightMatch = (text: string, keyword: string) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // 게시글의 각 컬럼에서 검색어 매칭 결과를 우선적으로 표시
  const getHighlightedSnippet = (post: any, keyword: string) => {
    const lowerKeyword = keyword.toLowerCase();
    if (post.title && post.title.toLowerCase().includes(lowerKeyword)) {
      return highlightMatch(post.title, keyword);
    } else if (
      post.description &&
      post.description.toLowerCase().includes(lowerKeyword)
    ) {
      return highlightMatch(post.description, keyword);
    } else if (
      post.content &&
      post.content.toLowerCase().includes(lowerKeyword)
    ) {
      // content의 경우 HTML 태그나 특수문자 제거 후 스니펫 추출
      const sanitizedContent = sanitizeText(post.content);
      const matchIndex = sanitizedContent.toLowerCase().indexOf(lowerKeyword);
      const start = Math.max(matchIndex - 20, 0);
      const snippet = sanitizedContent.substring(start, start + 100);
      return highlightMatch(snippet, keyword);
    }
    return "";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="border rounded p-1"
        />
        <button type="submit" className="p-1">
          <Search className="h-5 w-5" />
        </button>
      </form> */}
      {showDropdown && results.length > 0 && (
        <div className="absolute bg-white border mt-1 w-full rounded shadow-lg z-10">
          <ul>
            {results.map((post, index) => (
              <li
                key={post.id}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedIndex === index ? "bg-gray-200" : ""
                }`}
                onClick={() => handleResultClick(post.id)}
              >
                {getHighlightedSnippet(post, query)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
