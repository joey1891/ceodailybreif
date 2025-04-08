"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { parseISO } from "date-fns";
import { format } from "date-fns";

interface CalendarSectionProps {
  initialView?: "annual" | "monthly" | "both";
}

export function CalendarSection({ initialView = "both" }: CalendarSectionProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"annual" | "monthly" | "both">(initialView);
  const [targetYear, setTargetYear] = useState<number>(2025); // 기본값으로 2025년 사용
  const [targetMonth, setTargetMonth] = useState<number>(2); // 기본값으로 3월(인덱스 2) 사용

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase.from("calendar_events").select("*");
        if (error) {
          console.error("Error fetching calendar events:", error);
          return;
        }
        if (data) {
          console.log("불러온 이벤트 데이터:", data.length);
          setEvents(data);
          
          // 이벤트 데이터에서 가장 많은 연도/월 찾기
          const yearCounts: Record<number, number> = {};
          const monthCounts: Record<number, number> = {};
          
          data.forEach(event => {
            const date = parseISO(event.start_date);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            yearCounts[year] = (yearCounts[year] || 0) + 1;
            monthCounts[month] = (monthCounts[month] || 0) + 1;
          });
          
          if (Object.keys(yearCounts).length > 0) {
            const mostFrequentYear = Number(
              Object.keys(yearCounts).reduce((a, b) => 
                yearCounts[Number(a)] > yearCounts[Number(b)] ? a : b
              )
            );
            setTargetYear(mostFrequentYear);
          }
          
          if (Object.keys(monthCounts).length > 0) {
            const mostFrequentMonth = Number(
              Object.keys(monthCounts).reduce((a, b) => 
                monthCounts[Number(a)] > monthCounts[Number(b)] ? a : b
              )
            );
            setTargetMonth(mostFrequentMonth);
          }
        }
      } catch (error) {
        console.error("Unexpected error fetching calendar events:", error);
      }
    };
    fetchEvents();
  }, []);

  // 연간 일정: calendar_type이 "monthly"인 이벤트를 월별로 그룹화
  const yearlySchedule = Array.from({ length: 12 }, (_, i) => {
    const monthEvents = events.filter((event) => {
      if (event.calendar_type !== "monthly") return false;
      const eventDate = parseISO(event.start_date);
      return eventDate.getMonth() === i && eventDate.getFullYear() === targetYear;
    });
    return {
      name: `${i + 1}월`,
      events: monthEvents.map((e) => e.title),
    };
  });

  // 월간 일정: calendar_type이 "weekly"인 이벤트를 targetMonth의 주차별로 그룹화
  const weeklyEvents = events.filter((event) => {
    if (event.calendar_type !== "weekly") return false;
    const eventDate = parseISO(event.start_date);
    return eventDate.getMonth() === targetMonth && eventDate.getFullYear() === targetYear;
  });

  // 주차 계산: 간단하게 day 값을 기반으로 계산 (1~7일: 1주차, 8~14일: 2주차, ...)
  const weeklySchedule = [1, 2, 3, 4, 5].map((week) => {
    const weekEvents = weeklyEvents.filter((event) => {
      const day = parseISO(event.start_date).getDate();
      return Math.ceil(day / 7) === week;
    });
    return {
      name: `${week}주차`,
      events: weekEvents.map((e) => e.title),
    };
  });

  // View logic
  const showAnnual = activeView === "annual" || activeView === "both";
  const showMonthly = activeView === "monthly" || activeView === "both";

  return (
    <div className="relative border-2 border-primary/50 rounded-lg p-4 space-y-8 mt-6 ">
      {/* Title */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 ">
        <div className="flex items-center gap-2 text-gray-500 select-none">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">일정</span>
        </div>
      </div>

      {/* View switcher (only show if initialView is "both") */}
      {initialView === "both" && (
        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => setActiveView("annual")}
            className={`px-3 py-1 text-sm rounded-md ${activeView === "annual" ? "bg-primary text-white" : "bg-gray-100"}`}
          >
            연간 일정
          </button>
          <button 
            onClick={() => setActiveView("monthly")}
            className={`px-3 py-1 text-sm rounded-md ${activeView === "monthly" ? "bg-primary text-white" : "bg-gray-100"}`}
          >
            월간 일정
          </button>
          {activeView !== "both" && (
            <button 
              onClick={() => setActiveView("both")}
              className="px-3 py-1 text-sm rounded-md bg-gray-100"
            >
              모두 보기
            </button>
          )}
        </div>
      )}

      {/* 연간 일정 영역: calendar_type === "monthly" */}
      {showAnnual && (
        <div>
          <div className="mb-4 text-sm font-medium text-gray-500 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{targetYear}년 연간 일정</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {yearlySchedule.map((month, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {month.name}
                  </h4>
                  <ul className="space-y-1">
                    {month.events.length > 0 ? (
                      month.events.map((event, idx) => (
                        <li key={idx} className="text-xs text-gray-600">
                          • {event}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-gray-400">없음</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 월간 일정 영역: calendar_type === "weekly" */}
      {showMonthly && (
        <div>
          <div className="mb-4 text-sm font-medium text-gray-500 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{targetYear}년 {targetMonth + 1}월 월간 일정</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklySchedule.map((week, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {week.name}
                  </h4>
                  <ul className="space-y-1">
                    {week.events.length > 0 ? (
                      week.events.map((event, idx) => (
                        <li key={idx} className="text-xs text-gray-600">
                          • {event}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-gray-400">없음</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
