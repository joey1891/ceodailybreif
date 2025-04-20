"use client";

import { useEffect, useState } from "react";
import { LineChart, Clock, DollarSign, Percent } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminSession } from "@/lib/admin-auth";

interface FinanceData {
  id: string;
  type: string;
  name: string;
  value: number;
  date: string;
  created_at: string;
  updated_at: string;
}

type MarketIndex = {
  name: string;
  value: number;
  change: number;
};

type ExchangeRate = {
  currency: string;
  rate: number;
  trend: "up" | "down"; // You can keep the trend logic if you want
};

type CityTime = {
  name: string;
  time: string;
};

type InterestRate = {
  country: string;
  rate: number;
};

// 순서를 정의하는 상수들 추가
const CURRENCY_ORDER = ["USD", "EUR", "JPY", "CNY", "GBP"];
const INDEX_ORDER = ["KOSPI", "KOSDAQ", "NASDAQ", "S&P500", "Dow Jones"];
const INTEREST_RATE_ORDER = ["미국", "유로", "일본", "중국", "한국"];
const CITY_ORDER = ["뉴욕", "런던", "도쿄", "베이징", "서울"];

export function FinanceInfo() {
  const { adminUser, loading } = useAdminSession();
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const [times, setTimes] = useState<CityTime[]>([
    { name: "뉴욕", time: "" },
    { name: "런던", time: "" },
    { name: "도쿄", time: "" },
    { name: "베이징", time: "" },
    { name: "서울", time: "" }
  ].sort((a, b) => CITY_ORDER.indexOf(a.name) - CITY_ORDER.indexOf(b.name)));

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

    useEffect(() => {
      updateTimes();
      
      // 시간 업데이트를 위한 타이머 설정 (선택적)
      const timer = setInterval(updateTimes, 60000); // 1분마다 업데이트
      
      // 클린업 함수
      return () => clearInterval(timer);
    }, []); // 빈 의존성 배열

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


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("finance_info")
          .select("*");

        if (error) {
          throw error;
        }

        if (data) {
          const typedData = data as FinanceData[];
          
          const indicesData = typedData
            .filter((item) => item.type === "index")
            .map((item) => ({
              name: item.name,
              value: item.value,
              change: 0, // You might need to fetch historical data to calculate change
            }))
            // 지수 데이터 정렬
            .sort((a, b) => {
              return INDEX_ORDER.indexOf(a.name) - INDEX_ORDER.indexOf(b.name);
            });

          const ratesData = typedData
            .filter((item) => item.type === "exchange_rate")
            .map((item) => ({
              currency: item.name,
              rate: item.value,
              trend: "up" as "up", 
            }))
            // 정의된 순서대로 정렬
            .sort((a, b) => {
              return CURRENCY_ORDER.indexOf(a.currency) - CURRENCY_ORDER.indexOf(b.currency);
            });

          const interestRatesData = typedData
            .filter((item) => item.type === "interest_rate")
            .map((item) => ({
              country: item.name,
              rate: item.value,
            }))
            // 금리 데이터 정렬
            .sort((a, b) => {
              return INTEREST_RATE_ORDER.indexOf(a.country) - INTEREST_RATE_ORDER.indexOf(b.country);
            });

          setIndices(indicesData);
          setRates(ratesData);
          setInterestRates(interestRatesData);
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 관리자가 아닌 경우 또는 로딩 중인 경우 컴포넌트를 렌더링하지 않음
  if (loading || !adminUser) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 pt-6">
      {/* 주요 도시 시간 박스 */}
      <div className="relative h-[168px] border-2 border-primary/50 rounded-lg p-4 mt-3">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm max-[300px]:text-[9px] font-medium">주요 도시 시간</span>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-5 gap-4">
          {times.map((city) => (
            <div key={city.name} className="text-center">
              <div className="text-sm max-[300px]:text-[9px] text-gray-500 mb-1 flex items-center justify-center h-full">{city.name}</div>
              <div className="text-sm max-[300px]:text-[9px] font-bold text-gray-700">{city.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 주요 지수 현황 박스 */}
      <div className="relative h-[168px] max-[400px]:h-auto border-2 border-primary/50 rounded-lg p-4">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <LineChart className="h-4 w-4" />
            <span className="text-sm max-[300px]:text-[9px] font-medium">주요 지수현황</span>
          </div>
        </div>
        
        {/* 지수 그리드 - 400px 이하에서는 세로로 표시 */}
        <div className="mt-1 grid grid-cols-5 max-[400px]:grid-cols-1 gap-4 max-[400px]:gap-2">
          {isLoading ? (
            <div className="col-span-5 max-[400px]:col-span-1 text-center">Loading...</div>
          ) : error ? (
            <div className="col-span-5 max-[400px]:col-span-1 text-center text-red-500">{error}</div>
          ) : (
            indices.map((index) => (
              <div key={index.name} className="text-center max-[400px]:text-left max-[400px]:flex max-[400px]:items-center max-[400px]:justify-between">
                <div className="whitespace-nowrap max-[300px]:text-[9px] text-gray-500 mb-2 max-[400px]:mb-0 flex items-center justify-center max-[400px]:justify-start h-full">{index.name}</div>
                <div className="text-sm max-[300px]:text-[9px] font-bold text-gray-700">
                  {Math.floor(index.value*10)/10}
                </div>
                <div
                  className={`text-sm max-[300px]:text-[9px] ${
                    index.change > 0 ? "text-green-500" : "text-red-500"
                  } max-[400px]:hidden`}
                >
                  {/* {index.change > 0 ? "▲" : "▼"}{" "}
                  {Math.abs(index.change).toFixed(2)}% */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      

      {/* 환율 정보 박스 */}
      <div className="relative h-[168px] border-2 border-primary/50 rounded-lg p-4">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm max-[300px]:text-[9px] font-medium">환율</span>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-5 gap-4">
          {isLoading ? (
            <div className="col-span-5 text-center">Loading...</div>
          ) : error ? (
            <div className="col-span-5 text-center text-red-500">{error}</div>
          ) : (
            rates.map((rate) => (
              <div key={rate.currency} className="text-center">
                <div className="text-sm max-[300px]:text-[9px] text-gray-500 mb-1 flex items-center justify-center h-full">{rate.currency}</div>
                <div className="text-sm max-[300px]:text-[9px] font-bold text-gray-700">
                  {Math.floor(rate.rate*10)/10}
                </div>
                <div
                  className={`text-sm max-[300px]:text-[9px] ${
                    rate.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {/* {rate.trend === "up" ? "▲" : "▼"} */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 금리 정보 박스 */}
      <div className="relative h-[168px] border-2 border-primary/50 rounded-lg p-4">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Percent className="h-4 w-4" />
            <span className="text-sm max-[300px]:text-[9px] font-medium">금리</span>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-5 gap-4">
          {isLoading ? (
            <div className="col-span-5 text-center">Loading...</div>
          ) : error ? (
            <div className="col-span-5 text-center text-red-500">{error}</div>
          ) : (
            interestRates.map((rate) => (
              <div key={rate.country} className="text-center">
                <div className="text-sm max-[300px]:text-[9px] text-gray-500 mb-1 flex items-center justify-center h-full">{rate.country}</div>
                <div className="text-sm max-[300px]:text-[9px] font-bold text-gray-700">
                  {rate.rate.toFixed(2)}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
