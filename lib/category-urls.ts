// 카테고리 URL 하드코딩 솔루션
export const categoryUrls: Record<string, string> = {
  // 메인 카테고리 URL
  "리포트": "/report",
  "경제 동향": "/economic-trends",
  "금융 동향": "/finance",
  "산업 동향": "/industry",
  "기업 동향": "/company",
  "정책 동향": "/policy",
  "언론 동향": "/media", 
  "마케팅 동향": "/marketing",
  "인물과 동향": "/people",
  "미디어 리뷰": "/media-review",

  // 서브카테고리 URL (경제 동향)
  "민간소비": "/economic-trends/private-consumption",
  "정부지출": "/economic-trends/government-spending",
  "기업투자": "/economic-trends/corporate-investment",
  "수출입": "/economic-trends/trade",
  
  // 서브카테고리 URL (정부지출 하위)
  "시설투자": "/economic-trends/government-spending/infrastructure-investment",
  "재고투자": "/economic-trends/government-spending/inventory-investment",

  // 서브카테고리 URL (금융 동향)
  "금리": "/finance/interest-rate",
  "환율": "/finance/exchange-rate",
  "은행": "/finance/bank",
  "금융투자회사": "/finance/financial-investment-company",
  "보험회사": "/finance/insurance-company",
  "PE": "/finance/private-equity",
  "VC": "/finance/venture-capital",
  
  // 산업 동향의 서브카테고리
  "산업_의료": "/industry/industry-medical",
  "산업_제약": "/industry/industry-pharmaceutical",
  "산업_의료기기": "/industry/industry-medical-devices",
  "산업_화장품": "/industry/industry-cosmetics",
  "산업_건강기능식품": "/industry/industry-health-supplements",
  "산업_디지털헬스케어": "/industry/industry-digital-healthcare",
  
  // 기업 동향의 서브카테고리
  "기업_의료": "/company/company-medical",
  "기업_제약": "/company/company-pharmaceutical",
  "기업_의료기기": "/company/company-medical-devices",
  "기업_화장품": "/company/company-cosmetics",
  "기업_건강기능식품": "/company/company-health-supplements",
  "기업_디지털헬스케어": "/company/company-digital-healthcare",
  
  // 정책 동향의 서브카테고리
  "정책_의료": "/policy/policy-medical",
  "정책_제약": "/policy/policy-pharmaceutical",
  "정책_의료기기": "/policy/policy-medical-devices",
  "정책_화장품": "/policy/policy-cosmetics",
  "정책_건강기능식품": "/policy/policy-health-supplements",
  "정책_디지털헬스케어": "/policy/policy-digital-healthcare",
  
  // 언론 동향의 서브카테고리
  "언론_의료": "/media/media-medical",
  "언론_제약": "/media/media-pharmaceutical",
  "언론_의료기기": "/media/media-medical-devices",
  "언론_화장품": "/media/media-cosmetics",
  "언론_건강기능식품": "/media/media-health-supplements",
  "언론_디지털헬스케어": "/media/media-digital-healthcare",
  
  // 마케팅 동향
  "ATL": "/marketing/atl",
  "BTL": "/marketing/btl",
  "광고대행사": "/marketing/advertising-agency",
  "광고매체": "/marketing/advertising-media",
  
  // 서브카테고리 URL (BTL 하위)
  "퍼포먼스 마케팅": "/marketing/btl/performance-marketing",
  "인플루언서 마케팅": "/marketing/btl/influencer-marketing",
  
  // 서브카테고리 URL (미디어 리뷰)
  "뉴스": "/media-review/news",
  "매거진": "/media-review/magazine",
  "도서": "/media-review/books"
};

// 서브카테고리 슬러그 기반 URL 매핑
export const subCategoryUrls: Record<string, string> = {
  // 산업 동향
  "industry-medical": "/industry/industry-medical",
  "industry-pharmaceutical": "/industry/industry-pharmaceutical",
  "industry-medical-devices": "/industry/industry-medical-devices",
  "industry-cosmetics": "/industry/industry-cosmetics",
  "industry-health-supplements": "/industry/industry-health-supplements",
  "industry-digital-healthcare": "/industry/industry-digital-healthcare",
  
  // 기업 동향
  "company-medical": "/company/company-medical",
  "company-pharmaceutical": "/company/company-pharmaceutical",
  "company-medical-devices": "/company/company-medical-devices",
  "company-cosmetics": "/company/company-cosmetics",
  "company-health-supplements": "/company/company-health-supplements",
  "company-digital-healthcare": "/company/company-digital-healthcare",
  
  // 정책 동향
  "policy-medical": "/policy/policy-medical",
  "policy-pharmaceutical": "/policy/policy-pharmaceutical",
  "policy-medical-devices": "/policy/policy-medical-devices",
  "policy-cosmetics": "/policy/policy-cosmetics",
  "policy-health-supplements": "/policy/policy-health-supplements",
  "policy-digital-healthcare": "/policy/policy-digital-healthcare",
  
  // 언론 동향
  "media-medical": "/media/media-medical",
  "media-pharmaceutical": "/media/media-pharmaceutical",
  "media-medical-devices": "/media/media-medical-devices",
  "media-cosmetics": "/media/media-cosmetics",
  "media-health-supplements": "/media/media-health-supplements",
  "media-digital-healthcare": "/media/media-digital-healthcare",
  
  // 경제 동향
  "private-consumption": "/economic-trends/private-consumption",
  "government-spending": "/economic-trends/government-spending",
  "corporate-investment": "/economic-trends/corporate-investment",
  "trade": "/economic-trends/trade",
  "infrastructure-investment": "/economic-trends/government-spending/infrastructure-investment",
  "inventory-investment": "/economic-trends/government-spending/inventory-investment",
  
  // 금융 동향
  "interest-rate": "/finance/interest-rate",
  "exchange-rate": "/finance/exchange-rate",
  "bank": "/finance/bank",
  "financial-investment-company": "/finance/financial-investment-company",
  "insurance-company": "/finance/insurance-company",
  "private-equity": "/finance/private-equity",
  "venture-capital": "/finance/venture-capital",
  
  // 마케팅 동향
  "atl": "/marketing/atl",
  "btl": "/marketing/btl",
  "advertising-agency": "/marketing/advertising-agency",
  "advertising-media": "/marketing/advertising-media",
  "performance-marketing": "/marketing/btl/performance-marketing",
  "influencer-marketing": "/marketing/btl/influencer-marketing",
  
  // 미디어 리뷰
  "news": "/media-review/news",
  "magazine": "/media-review/magazine",
  "books": "/media-review/books"
}; 

// 중복 코드를 확인하기 위한 검증 함수를 추가
function validateCategoryUrls() {
  // 이미 사용된 URL들을 추적
  const usedUrls = new Set<string>();
  
  // 중복 URL 검사
  for (const [key, url] of Object.entries(categoryUrls)) {
    if (usedUrls.has(url)) {
      console.error(`Duplicate URL: ${url} for key ${key}`);
    } else {
      usedUrls.add(url);
    }
  }
  
  // 이미 사용된 키들을 추적
  const usedKeys = new Set<string>();
  
  // 중복 키 검사
  for (const [key, url] of Object.entries(subCategoryUrls)) {
    if (usedKeys.has(key)) {
      console.error(`Duplicate key: ${key} with URL ${url}`);
    } else {
      usedKeys.add(key);
    }
  }
  
  console.log('URL validation complete');
}

// 서버 시작 시 한 번만 실행
if (typeof window === 'undefined') {
  validateCategoryUrls();
}

// 메인 카테고리에 따른 서브카테고리 표시 이름과 URL 매핑
export const categoryDisplayMap: Record<string, Record<string, string>> = {
  "industry": {
    "의료": "/industry/industry-medical",
    "제약": "/industry/industry-pharmaceutical",
    "의료기기": "/industry/industry-medical-devices",
    "화장품": "/industry/industry-cosmetics",
    "건강기능식품": "/industry/industry-health-supplements",
    "디지털헬스케어": "/industry/industry-digital-healthcare",
  },
  "company": {
    "의료": "/company/company-medical",
    "제약": "/company/company-pharmaceutical",
    "의료기기": "/company/company-medical-devices",
    "화장품": "/company/company-cosmetics",
    "건강기능식품": "/company/company-health-supplements",
    "디지털헬스케어": "/company/company-digital-healthcare",
  },
  "policy": {
    "의료": "/policy/policy-medical",
    "제약": "/policy/policy-pharmaceutical",
    "의료기기": "/policy/policy-medical-devices",
    "화장품": "/policy/policy-cosmetics",
    "건강기능식품": "/policy/policy-health-supplements",
    "디지털헬스케어": "/policy/policy-digital-healthcare",
  },
  "media": {
    "의료": "/media/media-medical",
    "제약": "/media/media-pharmaceutical",
    "의료기기": "/media/media-medical-devices",
    "화장품": "/media/media-cosmetics",
    "건강기능식품": "/media/media-health-supplements",
    "디지털헬스케어": "/media/media-digital-healthcare",
  }
};