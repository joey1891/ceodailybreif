"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { parseISO } from "date-fns";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function CalendarSection() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase.from("calendar_events").select("*");
      if (!error && data) {
        setEvents(data);
      }
    };
    fetchEvents();
  }, []);

  // 연간 일정: calendar_type이 "monthly"인 이벤트를 월별로 그룹화
  const yearlySchedule = Array.from({ length: 12 }, (_, i) => {
    const monthEvents = events.filter((event) => {
      if (event.calendar_type !== "monthly") return false;
      const eventDate = parseISO(event.start_date);
      return eventDate.getMonth() === i;
    });
    return {
      name: `${i + 1}월`,
      events: monthEvents.map((e) => e.title),
    };
  });

  // 월간 일정: calendar_type이 "weekly"인 이벤트를 현재 달의 주차별로 그룹화
  const currentMonth = new Date().getMonth();
  const weeklyEvents = events.filter((event) => {
    if (event.calendar_type !== "weekly") return false;
    const eventDate = parseISO(event.start_date);
    return eventDate.getMonth() === currentMonth;
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

  return (
    <div className="relative border-2 border-primary/50 rounded-lg p-4 space-y-8 mt-6 ">
      {/* Title */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 ">
        <div className="flex items-center gap-2 text-gray-500 select-none">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">일정</span>
        </div>
      </div>

      {/* 연간 일정 영역: calendar_type === "monthly" */}
      <div>
        <div className="mb-4 text-sm font-medium text-gray-500 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(), "yyyy")}년 연간 일정</span>
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

      {/* 월간 일정 영역: calendar_type === "weekly" */}
      <div>
        <div className="mb-4 text-sm font-medium text-gray-500 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(), "yyyy")}년 {format(new Date(), "MM월")} 월간 일정</span>
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
    </div>
  );
}
