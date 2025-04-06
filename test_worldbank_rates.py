import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime

def get_main_countries_interest_rates():
    """
    Trading Economics 웹사이트에서 주요 5개국 + 유로존의 금리 데이터를 스크래핑합니다.
    """
    print("Trading Economics에서 주요 국가 금리 데이터 가져오는 중...")
    
    # 주요 국가 매핑 (유로존 추가)
    main_countries = {
        "US": "미국",
        "KR": "대한민국", 
        "JP": "일본",
        "CN": "중국",
        "DE": "독일",
        "EU": "유럽​​ 지역"
    }
    
    # 웹사이트에서는 다른 형태의 이름이 사용될 수 있어 역매핑 추가
    country_names_mapping = {
        "미국": "미국",
        "United States": "미국",
        "대한민국": "대한민국",
        "South Korea": "대한민국",
        "한국": "대한민국",
        "일본": "일본",
        "Japan": "일본",
        "중국": "중국",
        "China": "중국",
        "독일": "독일",
        "Germany": "독일",
        "유럽​​ 지역": "유럽​​ 지역",
        "유로 지역": "유럽​​ 지역",
        "유로존": "유럽​​ 지역",
        "Euro Area": "유럽​​ 지역",
        "Euro Zone": "유럽​​ 지역",
        "Eurozone": "유럽​​ 지역"
    }
    
    # G20 금리 페이지 URL
    url = "https://ko.tradingeconomics.com/country-list/interest-rate?continent=g20"
    
    # User-Agent 설정으로 봇 차단 방지
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        # 페이지 요청
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # 응답 상태 확인
        
        # 디버깅을 위해 HTML 내용 확인
        print(f"응답 상태 코드: {response.status_code}")
        print("HTML 내용 길이:", len(response.content))
        
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
                print(f"선택자 '{selector}'로 {len(tables)}개 테이블 찾음")
                table = tables[0]
                break
        
        if not table:
            print("테이블을 찾을 수 없습니다. 웹사이트 구조가 변경되었을 수 있습니다.")
            # 디버깅을 위해 HTML 구조 저장
            with open("debug_tradingeconomics.html", "w", encoding="utf-8") as f:
                f.write(soup.prettify())
            print("디버깅을 위해 HTML 구조를 'debug_tradingeconomics.html'에 저장했습니다.")
            return None
        
        # 테이블 헤더 확인
        headers_row = table.find('tr')
        if headers_row:
            headers = [th.text.strip() for th in headers_row.find_all(['th', 'td'])]
            print("테이블 헤더:", headers)
        
        # 데이터 추출
        rows = []
        for row in table.find_all('tr')[1:]:  # 헤더 행 제외
            cols = row.find_all('td')
            if len(cols) >= 4:  # 최소 4개 열이 있는지 확인
                country = cols[0].text.strip()
                
                # 국가가 주요 국가 중 하나인지 확인
                standard_country_name = country_names_mapping.get(country)
                if standard_country_name:
                    # 현재 웹사이트 구조에 맞게 데이터 추출
                    # 데이터 구조: [국가, 마지막, 이전, 참고, 단위]
                    value = cols[1].text.strip()  # 마지막(금리)
                    previous = cols[2].text.strip()  # 이전
                    reference = cols[3].text.strip() if len(cols) > 3 else ""  # 참고
                    unit = cols[4].text.strip() if len(cols) > 4 else "%"  # 단위
                    
                    rows.append({
                        '국가': standard_country_name,
                        '국가코드': next((code for code, name in main_countries.items() if name == standard_country_name), ""),
                        '금리': value,
                        '이전 값': previous,
                        '참고': reference,
                        '단위': unit
                    })
                    print(f"국가 '{country}' -> '{standard_country_name}' 데이터 추출됨")
        
        # DataFrame 생성
        df = pd.DataFrame(rows)
        
        if df.empty:
            print("주요 국가 데이터를 찾을 수 없습니다.")
            return None
        
        # 주요 국가 순서대로 정렬
        country_order = list(main_countries.values())
        df['정렬순서'] = df['국가'].apply(lambda x: country_order.index(x) if x in country_order else 999)
        df = df.sort_values('정렬순서').drop('정렬순서', axis=1)
        
        # 데이터가 없는 주요 국가 확인
        found_countries = df['국가'].unique()
        missing_countries = [name for name in main_countries.values() if name not in found_countries]
        
        if missing_countries:
            print(f"다음 주요 국가의 데이터가 누락되었습니다: {', '.join(missing_countries)}")
        
        print(f"총 {len(df)} 개국의 금리 데이터를 성공적으로 가져왔습니다.")
        return df
    
    except requests.exceptions.RequestException as e:
        print(f"데이터 요청 중 오류 발생: {e}")
        return None
    except Exception as e:
        print(f"데이터 처리 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()  # 상세한 오류 정보 출력
        return None

def save_interest_rates_data(df, filename=None):
    """
    가져온 금리 데이터를 CSV 파일로 저장합니다.
    """
    if df is None or df.empty:
        print("저장할 데이터가 없습니다.")
        return
    
    if filename is None:
        # 현재 날짜를 파일명에 포함
        today = datetime.now().strftime("%Y%m%d")
        filename = f"main_countries_interest_rates_{today}.csv"
    
    df.to_csv(filename, index=False, encoding='utf-8-sig')
    print(f"데이터가 {filename}에 저장되었습니다.")

if __name__ == "__main__":
    print("Trading Economics에서 주요 국가들의 금리 데이터 스크래핑 시작...")
    
    # 금리 데이터 가져오기
    interest_rates_df = get_main_countries_interest_rates()
    
    # 데이터 확인 및 출력
    if interest_rates_df is not None and not interest_rates_df.empty:
        print("\n금리 데이터 미리보기:")
        print(interest_rates_df)
        
        # 데이터 저장
        save_interest_rates_data(interest_rates_df)
    else:
        print("금리 데이터를 가져오지 못했습니다.") 
