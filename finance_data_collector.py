import FinanceDataReader as fdr
import pandas as pd
import requests
import os
import json
from datetime import datetime
from bs4 import BeautifulSoup

# Supabase 인증 정보
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

def collect_and_save_data():
    print("금융 데이터 수집 시작...")
    try:
        # ----- 한국 지수 데이터 수집 -----
        print("KOSPI/KOSDAQ 데이터 수집...")
        kospi = fdr.DataReader('KS11')  # KOSPI
        kosdaq = fdr.DataReader('KQ11')  # KOSDAQ
        
        # 가장 최근 데이터 추출
        latest_kospi = kospi.tail(1).iloc[0]
        latest_kosdaq = kosdaq.tail(1).iloc[0]
        
        # ----- 해외 지수 데이터 수집 -----
        print("해외 지수 데이터 수집...")
        sp500 = fdr.DataReader('US500')  # S&P 500
        nasdaq = fdr.DataReader('IXIC')  # NASDAQ
        dow = fdr.DataReader('DJI')  # Dow Jones
        
        latest_sp500 = sp500.tail(1).iloc[0]
        latest_nasdaq = nasdaq.tail(1).iloc[0]
        latest_dow = dow.tail(1).iloc[0]
        
        # ----- 금리 데이터 (웹 스크래핑으로 가져오기) -----
        print("금리 데이터 수집...")
        interest_rates = fetch_interest_rates()
        
        if not interest_rates:
            print("금리 데이터 수집 실패. 금리 데이터 없이 진행합니다.")
        
        # ----- 데이터 구성 -----
        now = datetime.now().isoformat()
        
        data = [
            {
                'type': 'index',
                'name': 'KOSPI',
                'value': float(latest_kospi['Close']),
                'date': latest_kospi.name.strftime('%Y-%m-%d')
            },
            {
                'type': 'index',
                'name': 'KOSDAQ',
                'value': float(latest_kosdaq['Close']),
                'date': latest_kosdaq.name.strftime('%Y-%m-%d')
            },
            {
                'type': 'index',
                'name': 'S&P500',
                'value': float(latest_sp500['Close']),
                'date': latest_sp500.name.strftime('%Y-%m-%d')
            },
            {
                'type': 'index',
                'name': 'NASDAQ',
                'value': float(latest_nasdaq['Close']),
                'date': latest_nasdaq.name.strftime('%Y-%m-%d')
            },
            {
                'type': 'index',
                'name': 'Dow Jones',
                'value': float(latest_dow['Close']),
                'date': latest_dow.name.strftime('%Y-%m-%d')
            }
        ]
        
        # 금리 데이터 추가 (수집된 경우에만)
        for rate in interest_rates:
            data.append({
                'type': 'interest_rate',
                'name': rate['name'],
                'value': rate['value'],
                'date': now
            })
        
        print(f"수집된 데이터: {len(data)}개")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        # ----- Supabase에 저장 -----
        if SUPABASE_URL and SUPABASE_KEY:
            print("Supabase에 데이터 저장 중...")
            
            # Supabase API 엔드포인트 및 헤더 설정
            headers = {
                'apikey': SUPABASE_KEY,
                'Authorization': f'Bearer {SUPABASE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'  # UPSERT 기능 활성화
            }
            
            # 테이블 이름을 finance_info로 수정 (기존 성공한 코드와 일치)
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/finance_info",
                headers=headers,
                json=data
            )
            
            if response.status_code >= 200 and response.status_code < 300:
                print(f"데이터 저장 성공: {response.status_code}")
            else:
                print(f"데이터 저장 실패: {response.status_code}")
                print(f"오류 응답: {response.text}")
                
                # 만약 UPSERT가 작동하지 않는 경우 기존 데이터 삭제 후 삽입 시도
                if response.status_code == 409:
                    print("중복 키 오류 발생. 기존 데이터 삭제 후 재시도합니다.")
                    try:
                        # 각 데이터 항목에 대해 개별적으로 처리
                        success_count = 0
                        for item in data:
                            # 기존 데이터 삭제
                            delete_response = requests.delete(
                                f"{SUPABASE_URL}/rest/v1/finance_info",
                                headers={
                                    'apikey': SUPABASE_KEY,
                                    'Authorization': f'Bearer {SUPABASE_KEY}',
                                    'Content-Type': 'application/json'
                                },
                                params={
                                    'type': f"eq.{item['type']}",
                                    'name': f"eq.{item['name']}"
                                }
                            )
                            
                            # 새 데이터 삽입
                            insert_response = requests.post(
                                f"{SUPABASE_URL}/rest/v1/finance_info",
                                headers={
                                    'apikey': SUPABASE_KEY,
                                    'Authorization': f'Bearer {SUPABASE_KEY}',
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                json=[item]  # 단일 항목을 리스트로 감싸기
                            )
                            
                            if insert_response.status_code >= 200 and insert_response.status_code < 300:
                                success_count += 1
                        
                        print(f"개별 처리 결과: {success_count}/{len(data)} 항목 성공")
                    except Exception as e:
                        print(f"개별 처리 중 오류 발생: {e}")
        else:
            print("⚠️ Supabase 환경 변수가 설정되지 않았습니다. 데이터를 저장하지 않습니다.")
        
        print("금융 데이터 수집 완료!")
        return data
        
    except Exception as e:
        print(f"오류 발생: {e}")
        raise

def fetch_interest_rates():
    """실시간 금리 데이터를 Trading Economics에서 스크래핑하여 수집하는 함수"""
    print("Trading Economics 웹사이트에서 금리 데이터 가져오는 중...")
    
    # 주요 국가 매핑
    countries = {
        "미국": "united states",
        "유로": "euro area",
        "일본": "japan",
        "중국": "china",
        "한국": "south korea"
    }
    
    # 웹사이트에서는 다른 형태의 이름이 사용될 수 있어 역매핑 추가
    country_names_mapping = {
        "미국": "미국",
        "United States": "미국",
        "대한민국": "한국",
        "South Korea": "한국",
        "한국": "한국",
        "일본": "일본",
        "Japan": "일본",
        "중국": "중국",
        "China": "중국",
        "유럽​​ 지역": "유로",
        "유로 지역": "유로",
        "유로존": "유로",
        "Euro Area": "유로",
        "Euro Zone": "유로",
        "Eurozone": "유로"
    }
    
    # G20 금리 페이지 URL
    url = "https://ko.tradingeconomics.com/country-list/interest-rate?continent=g20"
    
    # User-Agent 설정으로 봇 차단 방지
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        # 페이지 요청
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # 응답 상태 확인
        
        # BeautifulSoup으로 HTML 파싱
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 여러 가능한 테이블 선택자 시도
        table = None
        possible_selectors = [
            'table.table.table-hover',
            'table.table',
            '.table-responsive table',
            '#aspnetForm table',
            'table'
        ]
        
        for selector in possible_selectors:
            tables = soup.select(selector)
            if tables:
                table = tables[0]
                break
        
        if not table:
            print("테이블을 찾을 수 없습니다. 웹사이트 구조가 변경되었을 수 있습니다.")
            return []
        
        # 데이터 추출
        results = []
        for row in table.find_all('tr')[1:]:  # 헤더 행 제외
            cols = row.find_all('td')
            if len(cols) >= 4:  # 최소 4개 열이 있는지 확인
                country = cols[0].text.strip()
                
                # 국가가 주요 국가 중 하나인지 확인
                standard_country_name = country_names_mapping.get(country)
                if standard_country_name in countries.keys():
                    value = cols[1].text.strip()  # 마지막(금리)
                    
                    # 금리 값을 float로 변환 (% 및 공백 제거)
                    try:
                        rate_value = float(value.replace('%', '').strip())
                        
                        results.append({
                            "name": standard_country_name,
                            "value": rate_value
                        })
                        print(f"{standard_country_name} 금리 데이터 수집 성공: {rate_value}%")
                    except ValueError:
                        print(f"금리 값 변환 오류 ('{value}'): 숫자로 변환할 수 없습니다.")
        
        if not results:
            print("주요 국가의 금리 데이터를 찾을 수 없습니다.")
            # 여기에 백업 데이터를 추가할 수 있습니다 (원하는 경우)
        
        print(f"총 {len(results)}개 국가의 금리 데이터를 성공적으로 가져왔습니다.")
        return results
    
    except requests.exceptions.RequestException as e:
        print(f"Trading Economics 웹사이트 요청 오류: {e}")
        return []
    except Exception as e:
        print(f"Trading Economics 데이터 처리 오류: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == "__main__":
    collect_and_save_data()
