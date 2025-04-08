"use client";

import { useState, useEffect, useRef } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type CalendarEvent = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  description?: string;
  calendar_type: string;
  time?: string;
  location?: string;
  [key: string]: any;
};

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

export default function MonthlySchedulePage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(2); // 3월 (0부터 시작)
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("calendar_type", "weekly");
        
        if (error) {
          console.error("Error fetching events:", error);
          return;
        }
        
        setEvents(data || []);
        
        // 데이터에서 사용 가능한 연도 추출
        if (data && data.length > 0) {
          const years = new Set<number>();
          const yearMonthCounts: Record<string, number> = {};
          
          data.forEach(event => {
            const date = parseISO(event.start_date);
            const yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
            years.add(date.getFullYear());
            yearMonthCounts[yearMonth] = (yearMonthCounts[yearMonth] || 0) + 1;
          });
          
          setAvailableYears(Array.from(years).sort());
          
          // 가장 많은 이벤트가 있는 연-월 찾기
          const mostFrequentYearMonth = Object.keys(yearMonthCounts).reduce((a, b) => 
            yearMonthCounts[a] > yearMonthCounts[b] ? a : b
          );
          
          const [yearStr, monthStr] = mostFrequentYearMonth.split('-');
          setYear(Number(yearStr));
          setMonth(Number(monthStr));
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvents();
  }, []);
  
  // 월 변경 핸들러
  const handlePrevMonth = () => {
    const newDate = subMonths(new Date(year, month), 1);
    setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
  };
  
  const handleNextMonth = () => {
    const newDate = addMonths(new Date(year, month), 1);
    setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
  };
  
  // 연도, 월 선택 핸들러
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
  };
  
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number(e.target.value));
  };
  
  // 현재 월의 시작일과 종료일
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  
  // 주간 배열 생성
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });
  
  // 주차별 이벤트 그룹화
  const weeklySchedule = weeks.map((weekStart, index) => {
    const days = eachDayOfInterval({
      start: weekStart,
      end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000) // 주의 마지막 날
    });
    
    // 이번 주에 해당하는 이벤트 찾기
    const weekEvents = events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return days.some(day => isSameDay(day, eventDate));
    });
    
    return {
      weekNumber: index + 1,
      startDate: weekStart,
      days,
      events: weekEvents
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
  
  // 모든 월 옵션 (1월~12월)
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${i + 1}월`
  }));
  
  // 현재 연도 기준 앞뒤 2년씩 표시할 연도 배열 생성
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: year - 2 + i,
    label: `${year - 2 + i}년`
  }));
  
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
          className="p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="font-semibold text-gray-500">연간일정</div>
          <div className="text-sm text-gray-400 mt-1">연간 주요 산업 일정 및 이벤트</div>
        </button>
        
        <button 
          onClick={() => router.push("/schedule/monthly")}
          className="p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <div className="font-semibold text-primary">월간일정</div>
          <div className="text-sm text-primary/70 mt-1">월별 주요 일정 및 이벤트</div>
        </button>
      </div>
      
      {/* 월간 캘린더 타이틀
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{format(new Date(year, month), 'yyyy년 MM월')} 월간 일정</h2>
        <p className="text-gray-500">이번 달 주요 일정 및 이벤트를 확인하세요</p>
      </div> */}
      
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <button 
          onClick={handlePrevMonth}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{format(new Date(year, month), 'yyyy년 M월')}</h2>
          
          <div className="flex gap-2 min-w-[220px]">
            <div className="w-1/2">
              <CustomDropdown 
                value={year}
                options={yearOptions}
                onChange={handleYearChange}
              />
            </div>
            
            <div className="w-1/2">
              <CustomDropdown 
                value={month}
                options={monthOptions}
                onChange={handleMonthChange}
              />
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleNextMonth}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {/* 월간 캘린더 헤더 */}
      <div className="bg-primary text-white rounded-t-xl p-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{format(new Date(year, month), 'yyyy년 MM월')}</h2>
        <div className="text-sm bg-white/20 px-3 py-1 rounded-md">
          총 {events.filter(e => {
            const date = parseISO(e.start_date);
            return date.getFullYear() === year && date.getMonth() === month;
          }).length}개의 일정
        </div>
      </div>
      
      {/* 주차별 이벤트 목록 */}
      <div className="border-x border-b border-gray-200 rounded-b-xl overflow-hidden divide-y divide-gray-200">
        {weeklySchedule.map((week) => (
          <div key={week.weekNumber} className="bg-white">
            {/* 주차 헤더 */}
            <div className="bg-gray-50 p-4 flex items-center">
              <div className="font-bold text-gray-700 mr-3">
                {week.weekNumber}주차
              </div>
              <div className="text-sm text-gray-500">
                {format(week.startDate, 'MM/dd')} ~ {format(week.days[week.days.length-1], 'MM/dd')}
              </div>
            </div>
            
            {/* 이벤트 목록 */}
            {week.events.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {week.events.map((event, idx) => (
                  <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center mb-2 gap-2">
                      <div className="bg-primary/10 text-primary font-medium rounded-md px-3 py-1 text-sm">
                        {format(parseISO(event.start_date), 'MM월 dd일 (EEE)')}
                      </div>
                      {event.time && (
                        <div className="text-sm text-gray-500">
                          {event.time}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                    
                    {event.description && (
                      <p className="text-gray-600 mb-3">{event.description}</p>
                    )}
                    
                    {event.location && (
                      <div className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">장소:</span> {event.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <p>이 주에 예정된 일정이 없습니다</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 