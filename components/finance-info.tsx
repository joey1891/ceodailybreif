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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [interestRates, setInterestRates] = useState<{
    country: string;
    rate: number;
  }[]>([
    { country: "미국", rate: 5.5 },
    { country: "유로", rate: 4.5 },
    { country: "일본", rate: 0.1 },
    { country: "중국", rate: 3.8 },
    { country: "한국", rate: 3.5 }
  ]);

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
    // Fetch real market data from Finnhub API
    const fetchMarketData = async () => {
      setIsLoading(true);
      setError(null);
      
      const apiKey = 'cvcan11r01qhnuvrq4egcvcan11r01qhnuvrq4f0';
      const indexMapping = {
        "코스피": "^KS11",
        "코스닥": "^KQ11",
        "나스닥": "^IXIC",
        "S&P500": "^GSPC", 
        "다우존스": "^DJI"
      };
      
      try {
        const updatedIndices = await Promise.all(
          indices.map(async (index) => {
            const symbol = indexMapping[index.name as keyof typeof indexMapping];
            if (!symbol) return index;

            const response = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
            );
            
            if (!response.ok) {
              throw new Error(`API request failed for ${index.name}`);
            }
            
            const data = await response.json();
            return {
              name: index.name,
              value: data.c || index.value, // Current price
              change: data.dp || index.change // Percent change
            };
          })
        );
        
        setIndices(updatedIndices);
      } catch (error) {
        console.error("Failed to fetch market data:", error);
        setError("Failed to load market data");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMarketData();
    
    // Set up refresh interval (every 30 seconds)
    const refreshInterval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const dataInterval = setInterval(() => {
      // Keep updating rates, but remove the indices update
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
      setInterestRates(prevRates =>
        prevRates.map(rate => ({
          ...rate,
          rate: rate.rate + (Math.random() - 0.5) * 0.2 // 변동폭을 줄임
        }))
      );
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
    <div className="grid grid-cols-1 gap-4 pt-6">
      {/* 주요 지수 현황 박스 */}
      <div className="relative h-[140px] border-2 border-primary/50 rounded-lg p-4">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <LineChart className="h-4 w-4" />
            <span className="text-sm font-medium">주요 지수현황</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {isLoading ? (
            <div className="col-span-5 text-center">Loading market data...</div>
          ) : error ? (
            <div className="col-span-5 text-center text-red-500">{error}</div>
          ) : (
            indices.map((index) => (
              <div key={index.name} className="text-center">
                <div className="text-sm text-gray-500 mb-1">{index.name}</div>
                <div className="text-base font-bold text-gray-700">
                  {index.value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div className={`text-sm ${index.change > 0 ? "text-green-500" : "text-red-500"}`}>
                  {index.change > 0 ? "▲" : "▼"} {Math.abs(index.change).toFixed(2)}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 주요 도시 시간 박스 */}
      <div className="relative h-[140px] border-2 border-primary/50 rounded-lg p-4 mt-3">
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
        <div className="mt-4 grid grid-cols-5 gap-4">
          {interestRates.map((rate) => (
            <div key={rate.country} className="text-center">
              <div className="text-sm text-gray-500 mb-1">{rate.country}</div>
              <div className="text-base font-bold text-gray-700">
                {rate.rate.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
