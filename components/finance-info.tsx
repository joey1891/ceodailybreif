"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Clock, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

type MarketIndex = {
  name: string;
  value: number;
  change: number;
};

type ExchangeRate = {
  currency: string;
  rate: number;
  trend: "up" | "down";
};

type CityTime = {
  name: string;
  time: string;
};

type InterestRate = {
  rate: number;
};

export function FinanceInfo() {
  const [indices, setIndices] = useState<MarketIndex[]>([
    { name: "코스피", value: 2567.45, change: 0.45 },
    { name: "코스닥", value: 892.31, change: -0.28 },
    { name: "나스닥", value: 14972, change: 0.13 },
    { name: "S&P500", value: 4783, change: 0.15 },
    { name: "다우존스", value: 37562, change: -0.15 }
  ]);

  const [rates, setRates] = useState<ExchangeRate[]>([
    { currency: "USD", rate: 1324.5, trend: "up" },
    { currency: "EUR", rate: 1445.32, trend: "down" },
    { currency: "JPY", rate: 932.45, trend: "up" },
    { currency: "CNY", rate: 184.67, trend: "down" },
    { currency: "GBP", rate: 1678.9, trend: "up" }
  ]);

  const [times, setTimes] = useState<CityTime[]>([
    { name: "뉴욕", time: "" },
    { name: "런던", time: "" },
    { name: "도쿄", time: "" },
    { name: "베이징", time: "" },
    { name: "서울", time: "" }
  ]);

  const [interestRate, setInterestRate] = useState<InterestRate>({ rate: 3.5 });

  useEffect(() => {
    const updateTimes = () => {
      const newTimes = times.map(city => ({
        name: city.name,
        time: new Date().toLocaleTimeString("ko-KR", {
          timeZone: getTimeZone(city.name),
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })
      }));
      setTimes(newTimes);
    };

    updateTimes();
    const timeInterval = setInterval(updateTimes, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const dataInterval = setInterval(() => {
      setIndices(prev =>
        prev.map(index => ({
          ...index,
          value: index.value + (Math.random() - 0.5) * (index.value * 0.001),
          change: (Math.random() - 0.5) * 0.5
        }))
      );

      setRates(prev =>
        prev.map(rate => ({
          ...rate,
          rate: rate.rate + (Math.random() - 0.5) * 2,
          trend: Math.random() > 0.5 ? "up" : "down"
        }))
      );
    }, 3000);

    return () => clearInterval(dataInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setInterestRate(() => ({
        rate: 3.0 + Math.random() * 1.0 // 3.0 ~ 4.0
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function getTimeZone(city: string): string {
    const zones: Record<string, string> = {
      "뉴욕": "America/New_York",
      "런던": "Europe/London",
      "도쿄": "Asia/Tokyo",
      "베이징": "Asia/Shanghai",
      "서울": "Asia/Seoul"
    };
    return zones[city] || "Asia/Seoul";
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* 주요 지수 현황 박스 */}
      <div className="relative h-[140px] border-2 border-primary/50 rounded-lg p-4">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <LineChart className="h-4 w-4" />
            <span className="text-sm font-medium">주요 지수현황</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {indices.map((index) => (
            <div key={index.name} className="text-center">
              <div className="text-sm text-gray-500 mb-1">{index.name}</div>
              <div className="text-base font-bold text-gray-700">
                {index.value.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className={`text-sm ${index.change > 0 ? "text-green-500" : "text-red-500"}`}>
                {index.change > 0 ? "▲" : "▼"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 주요 도시 시간 박스 */}
      <div className="relative h-[140px] border-2 border-primary/50 rounded-lg p-4">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">주요 도시 시간</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {times.map((city) => (
            <div key={city.name} className="text-center">
              <div className="text-sm text-gray-500 mb-1">{city.name}</div>
              <div className="text-base font-bold text-gray-700">{city.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 환율 정보 박스 */}
      <div className="relative h-[140px] border-2 border-primary/50 rounded-lg p-4">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">환율</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {rates.map((rate) => (
            <div key={rate.currency} className="text-center">
              <div className="text-sm text-gray-500 mb-1">{rate.currency}</div>
              <div className="text-base font-bold text-gray-700">
                {rate.rate.toFixed(2)}
              </div>
              <div className={`text-sm ${rate.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                {rate.trend === "up" ? "▲" : "▼"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 금리 정보 박스 */}
      <div className="relative h-[140px] border-2 border-primary/50 rounded-lg p-4">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Percent className="h-4 w-4" />
            <span className="text-sm font-medium">금리</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">기준 금리</div>
            <div className="text-base font-bold text-gray-700">
              {interestRate.rate.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}