"use client";

import { useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

// 커스텀 드롭다운 컴포넌트
function CustomDropdown({ 
  value, 
  options, 
  onChange,
  label
}: { 
  value: any, 
  options: {value: any, label: string}[], 
  onChange: (value: any) => void,
  label?: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 현재 선택된 옵션의 레이블 찾기
  const selectedLabel = options.find(opt => opt.value === value)?.label || '';
  
  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      {label && <div className="text-sm text-gray-500 mb-1">{label}</div>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto">
          <ul className="py-1">
            {options.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  option.value === value ? 'bg-primary/10 text-primary' : 'text-gray-700'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AnnualSchedulePage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [year, setYear] = useState(2025);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("calendar_type", "monthly");
        
        if (error) {
          console.error("Error fetching events:", error);
          return;
        }
        
        setEvents(data || []);
        
        // 데이터에서 가장 많은 연도 찾기
        if (data && data.length > 0) {
          const yearCounts: Record<number, number> = {};
          
          data.forEach(event => {
            const eventYear = parseISO(event.start_date).getFullYear();
            yearCounts[eventYear] = (yearCounts[eventYear] || 0) + 1;
          });
          
          // 가장 많은 이벤트가 있는 연도 찾기
          const mostFrequentYear = Number(
            Object.keys(yearCounts).reduce((a, b) => 
              yearCounts[Number(a)] > yearCounts[Number(b)] ? a : b
            )
          );
          
          setYear(mostFrequentYear);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvents();
  }, []);
  
  // 연도 변경 핸들러
  const handlePrevYear = () => {
    setYear(year - 1);
  };
  
  const handleNextYear = () => {
    setYear(year + 1);
  };
  
  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };
  
  // 현재 연도 기준 앞뒤 2년씩 표시할 연도 배열 생성
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: year - 2 + i,
    label: `${year - 2 + i}년`
  }));
  
  // 월별 일정 그룹화
  const yearlySchedule = Array.from({ length: 12 }, (_, i) => {
    const monthEvents = events.filter((event) => {
      const eventDate = parseISO(event.start_date);
      return eventDate.getMonth() === i && eventDate.getFullYear() === year;
    });
    
    return {
      name: `${i + 1}월`,
      month: i,
      events: monthEvents
    };
  });
  
  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center py-20">
          <div className="text-primary">데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      {/* 뒤로가기 버튼 */}
      <button 
        onClick={() => router.push("/schedule")}
        className="mb-4 flex items-center text-primary hover:text-primary/80 transition-colors"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        <span>뒤로 가기</span>
      </button>
      
      {/* 헤더 영역 */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 mb-6">
        <h1 className="text-3xl font-bold mb-3">일정 관리</h1>
        <p className="text-gray-600 mb-4">
          주요 행사 및 일정을 효율적으로 관리하고 확인할 수 있습니다
        </p>
        <div className="flex items-center text-primary text-sm font-medium">
          <Calendar className="h-4 w-4 mr-2" />
          <span>일정 관리 및 확인</span>
        </div>
      </div>
      
      {/* 페이지 네비게이션 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => router.push("/schedule/annual")}
          className="p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <div className="font-semibold text-primary">연간일정</div>
          <div className="text-sm text-primary/70 mt-1">연간 주요 산업 일정 및 이벤트</div>
        </button>
        
        <button 
          onClick={() => router.push("/schedule/monthly")}
          className="p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="font-semibold text-gray-500">월간일정</div>
          <div className="text-sm text-gray-400 mt-1">월별 주요 일정 및 이벤트</div>
        </button>
      </div>
      
      {/* 연간 캘린더 타이틀
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{year}년 연간 일정</h2>
        <p className="text-gray-500">올해의 주요 산업 일정 및 이벤트를 확인하세요</p>
      </div> */}
      
      {/* 연도 네비게이션 */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <button 
          onClick={handlePrevYear}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{year}년</h2>
          
          <div className="w-32">
            <CustomDropdown 
              value={year}
              options={yearOptions}
              onChange={handleYearChange}
            />
          </div>
        </div>
        
        <button 
          onClick={handleNextYear}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {/* 월별 이벤트 목록 */}
      <div className="space-y-12">
        {yearlySchedule.map((month, index) => (
          <div key={index} className={`rounded-xl p-6 ${month.events.length > 0 ? 'bg-white shadow-sm border border-gray-100' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  {month.month + 1}
                </div>
                {month.name}
              </h2>
              <div className="text-sm text-gray-500">{year}년</div>
            </div>
            
            {month.events.length > 0 ? (
              <div className="space-y-4">
                {month.events.map((event, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-5 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-primary">{event.title}</h3>
                      <div className="text-sm text-gray-500">
                        {format(parseISO(event.start_date), 'yyyy년 MM월 dd일')}
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-gray-600 mb-3">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {event.location && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">장소:</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.organizer && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">주최:</span>
                          <span>{event.organizer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>예정된 일정이 없습니다</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 