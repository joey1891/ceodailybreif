// // @deno-types="https://deno.land/x/types/env.d.ts"

// // Deno 전역 타입 선언 추가
// declare const Deno: {
//   env: {
//     get(key: string): string | undefined;
//   };
// };

// // Deno-specific imports
// // @ts-ignore
// import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
// // @ts-ignore
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// // cron: 0 9 * * *  // 매일 오전 9시에 실행

// // 필요한 타입 정의
// interface FinanceData {
//   type: string
//   name: string
//   value: number
//   date: string
// }

// // Alpha Vantage API 호출을 위한 스로틀링 함수
// async function throttledAlphaVantageRequest(url: string, apiKey: string): Promise<any> {
//   // 분당 5회 제한을 지키기 위해 요청 사이에 15초 지연
//   await new Promise(resolve => setTimeout(resolve, 15000));
  
//   console.log(`API 요청: ${url}`);
//   const response = await fetch(url);
  
//   if (!response.ok) {
//     throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
//   }
  
//   const text = await response.text();
//   if (!text || text.trim() === '') {
//     throw new Error('빈 응답 받음');
//   }
  
//   return JSON.parse(text);
// }

// // Finnhub API를 사용하여 주요 지수 데이터 가져오기
// async function fetchMarketIndices(apiKey: string): Promise<FinanceData[]> {
//   try {
//     console.log('주요 지수 데이터 가져오는 중...');
    
//     const indices = [
//       { symbol: "^KS11", name: "KOSPI" }, // KOSPI
//       { symbol: "^KQ11", name: "KOSDAQ" }, // KOSDAQ
//       { symbol: "^IXIC", name: "NASDAQ" }, // NASDAQ
//       { symbol: "^GSPC", name: "S&P500" }, // S&P500
//       { symbol: "^DJI", name: "Dow Jones" } // Dow Jones
//     ];
    
//     const results: FinanceData[] = [];
    
//     for (const index of indices) {
//       try {
//         const url = `https://finnhub.io/api/v1/quote?symbol=${index.symbol}&token=${apiKey}`;
//         console.log(`${index.name} 데이터 요청 URL: ${url.replace(apiKey, '***API_KEY***')}`);
        
//         const response = await fetch(url);
        
//         console.log(`${index.name} API 응답 상태: ${response.status} ${response.statusText}`);
        
//         if (!response.ok) {
//           console.error(`${index.name} API 응답 오류: ${response.status} ${response.statusText}`);
//           continue;
//         }
        
//         const responseText = await response.text();
//         console.log(`${index.name} 응답 텍스트:`, responseText);
        
//         if (!responseText || responseText.trim() === '') {
//           console.error(`${index.name} 빈 응답 받음`);
//           continue;
//         }
        
//         let data;
//         try {
//           data = JSON.parse(responseText);
//           console.log(`${index.name} 응답 구조:`, Object.keys(data));
//         } catch (parseError) {
//           console.error(`${index.name} JSON 파싱 오류:`, parseError);
//           continue;
//         }
        
//         if (data && data.c) {
//           const value = data.c;
//           results.push({
//             type: 'index',
//             name: index.name,
//             value: value,
//             date: new Date().toISOString()
//           });
//           console.log(`${index.name} 데이터 추가 성공:`, value);
//         } else {
//           console.error(`${index.name} 데이터 형식 오류:`, data);
//         }
//       } catch (error) {
//         console.error(`${index.name} 처리 오류:`, error);
//       }
      
//       // API 호출 제한을 피하기 위한 지연
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
    
//     return results;
//   } catch (error) {
//     console.error('지수 데이터 가져오기 오류:', error);
//     return [];
//   }
// }

// // Alpha Vantage API를 사용하여 환율 데이터 가져오기
// async function fetchExchangeRates(apiKey: string): Promise<FinanceData[]> {
//   try {
//     console.log('환율 데이터 가져오는 중...');
    
//     const currencies = [
//       { from: "USD", to: "KRW", name: "USD" },
//       { from: "EUR", to: "KRW", name: "EUR" },
//       { from: "JPY", to: "KRW", name: "JPY" },
//       { from: "CNY", to: "KRW", name: "CNY" },
//       { from: "GBP", to: "KRW", name: "GBP" }
//     ];
    
//     const results: FinanceData[] = [];
    
//     for (const currency of currencies) {
//       try {
//         const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${currency.from}&to_currency=${currency.to}&apikey=${apiKey}`;
//         console.log(`${currency.name} 환율 데이터 요청 URL: ${url}`);
        
//         const data = await throttledAlphaVantageRequest(url, apiKey);
//         console.log(`${currency.name} 환율 응답 구조:`, Object.keys(data));
        
//         if (data["Realtime Currency Exchange Rate"] && data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) {
//           const value = parseFloat(data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
//           results.push({
//             type: 'exchange_rate',
//             name: currency.name,
//             value: value,
//             date: new Date().toISOString()
//           });
//           console.log(`${currency.name} 환율 데이터 추가 성공:`, value);
//         } else {
//           console.error(`${currency.name} 환율 데이터 형식 오류:`, data);
//         }
//       } catch (error) {
//         console.error(`${currency.name} 환율 처리 오류:`, error);
//       }
//     }
    
//     return results;
//   } catch (error) {
//     console.error('환율 데이터 가져오기 오류:', error);
//     return [];
//   }
// }

// // Trading Economics API를 사용하여 금리 데이터 가져오기
// async function fetchInterestRates(apiKey: string): Promise<FinanceData[]> {
//   try {
//     console.log('금리 데이터 가져오는 중...');
    
//     const countries = [
//       { code: "united-states", name: "미국" },
//       { code: "euro-area", name: "유로" },
//       { code: "japan", name: "일본" },
//       { code: "china", name: "중국" },
//       { code: "south-korea", name: "한국" }
//     ];
    
//     const results: FinanceData[] = [];
    
//     for (const country of countries) {
//       try {
//         const url = `https://api.tradingeconomics.com/historical/country/${country.code}/indicator/interest-rate?c=${apiKey}`;
//         console.log(`${country.name} 금리 데이터 요청 URL: ${url.replace(apiKey, '***API_KEY***')}`);
        
//         const response = await fetch(url);
        
//         console.log(`${country.name} 금리 API 응답 상태: ${response.status} ${response.statusText}`);
        
//         if (!response.ok) {
//           console.error(`${country.name} 금리 API 응답 오류: ${response.status} ${response.statusText}`);
//           continue;
//         }
        
//         const responseText = await response.text();
//         console.log(`${country.name} 금리 응답 텍스트 (일부):`, responseText.substring(0, 100));
        
//         if (!responseText || responseText.trim() === '') {
//           console.error(`${country.name} 빈 응답 받음`);
//           continue;
//         }
        
//         let data;
//         try {
//           data = JSON.parse(responseText);
//           console.log(`${country.name} 금리 응답 데이터 수:`, data.length);
//         } catch (parseError) {
//           console.error(`${country.name} 금리 JSON 파싱 오류:`, parseError);
//           continue;
//         }
        
//         if (data && data.length > 0) {
//           // 가장 최근 데이터 사용 (마지막 항목)
//           const latestData = data[data.length - 1];
//           results.push({
//             type: 'interest_rate',
//             name: country.name,
//             value: latestData.Value, // API 응답의 필드명이 'Value'인지 확인 필요
//             date: new Date().toISOString()
//           });
//           console.log(`${country.name} 금리 데이터 추가 성공:`, latestData.Value);
//         } else {
//           console.error(`${country.name} 금리 데이터 없음`);
//         }
//       } catch (error) {
//         console.error(`${country.name} 금리 처리 오류:`, error);
//       }
      
//       // API 호출 제한을 피하기 위한 지연
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
    
//     return results;
//   } catch (error) {
//     console.error('금리 데이터 가져오기 오류:', error);
//     return [];
//   }
// }

// serve(async (req) => {
//   try {
//     console.log('금융 데이터 업데이트 함수 시작');
    
//     // Supabase 클라이언트 생성
//     const supabaseClient = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
//       {
//         auth: {
//           autoRefreshToken: false,
//           persistSession: false
//         }
//       }
//     );
    
//     // API 키 설정
//     const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY') ?? '';
//     const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY') ?? '';
//     // const apiNinjasApiKey = Deno.env.get('API_NINJAS_API_KEY') ?? '';
//     const tradingEconomicsApiKey = '37b850b2c4184e0:jycm4oqilh1m8bq'; // 환경 변수로 이동 권장
    
//     console.log(`Finnhub API 키 유효성: ${finnhubApiKey ? '설정됨' : '설정 안됨'}`);
//     console.log(`Alpha Vantage API 키 유효성: ${alphaVantageApiKey ? '설정됨' : '설정 안됨'}`);
//     console.log(`Trading Economics API 키 유효성: ${tradingEconomicsApiKey ? '설정됨' : '설정 안됨'}`);

//     // 지수 데이터, 환율 데이터, 금리 데이터 가져오기
//     const [indices, exchangeRates, interestRates] = await Promise.all([
//       fetchMarketIndices(finnhubApiKey),
//       fetchExchangeRates(alphaVantageApiKey),
//       fetchInterestRates(tradingEconomicsApiKey)
//     ]);
    
//     // 모든 데이터 합치기
//     const allData = [...indices, ...exchangeRates, ...interestRates];
    
//     console.log(`수집된 데이터: ${allData.length}개`);
    
//     // 데이터가 없으면 업데이트하지 않음
//     if (allData.length === 0) {
//       console.log('유효한 데이터가 없어 DB 업데이트를 건너뜁니다.');
//       return new Response(
//         JSON.stringify({ 
//           success: false, 
//           message: '유효한 금융 데이터를 가져오지 못했습니다' 
//         }),
//         { headers: { 'Content-Type': 'application/json' } }
//       );
//     }
    
//     // 안전한 삭제: 오늘 날짜의 데이터 중 수집한 종류만 삭제
//     if (indices.length > 0) {
//       const { error: indexDeleteError } = await supabaseClient
//         .from('finance_info')
//         .delete()
//         .eq('type', 'index')
//         .gte('date', new Date().toISOString().split('T')[0]);
      
//       if (indexDeleteError) console.error('지수 데이터 삭제 오류:', indexDeleteError);
//     }
    
//     if (exchangeRates.length > 0) {
//       const { error: exchangeRateDeleteError } = await supabaseClient
//         .from('finance_info')
//         .delete()
//         .eq('type', 'exchange_rate')
//         .gte('date', new Date().toISOString().split('T')[0]);
      
//       if (exchangeRateDeleteError) console.error('환율 데이터 삭제 오류:', exchangeRateDeleteError);
//     }
    
//     if (interestRates.length > 0) {
//       const { error: interestRateDeleteError } = await supabaseClient
//         .from('finance_info')
//         .delete()
//         .eq('type', 'interest_rate')
//         .gte('date', new Date().toISOString().split('T')[0]);
      
//       if (interestRateDeleteError) console.error('금리 데이터 삭제 오류:', interestRateDeleteError);
//     }
    
//     // 새 데이터 삽입
//     const { data, error: insertError } = await supabaseClient
//       .from('finance_info')
//       .insert(allData);
    
//     if (insertError) {
//       console.error('데이터 삽입 오류:', insertError);
//       throw insertError;
//     }
    
//     console.log('금융 데이터 업데이트 완료');
    
//     return new Response(
//       JSON.stringify({ 
//         success: true, 
//         message: '금융 데이터가 성공적으로 업데이트되었습니다', 
//         updatedRecords: allData.length 
//       }),
//       { headers: { 'Content-Type': 'application/json' } }
//     );
//   } catch (error) {
//     console.error('Error:', error);
//     return new Response(
//       JSON.stringify({ success: false, error: (error as Error).message }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } }
//     );
//   }
// });
