"use client";

import Link from "next/link";
import { CalendarSection } from "@/components/calendar-section";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function SchedulePage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">주요일정</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Annual Schedule Card */}
        <Link href="/schedule/annual">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <Calendar className="h-5 w-5" />
                <h2 className="text-lg font-semibold">연간일정</h2>
              </div>
              <p className="text-gray-600">
                연간 주요 일정을 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Monthly Schedule Card */}
        <Link href="/schedule/monthly">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <Calendar className="h-5 w-5" />
                <h2 className="text-lg font-semibold">월간일정</h2>
              </div>
              <p className="text-gray-600">
                월간 주요 일정을 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      {/* Calendar Section below */}
      <CalendarSection />
    </div>
  );
}