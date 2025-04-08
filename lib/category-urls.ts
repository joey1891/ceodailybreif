export const categoryUrls: Record<string, string> = {
  "private-consumption": "/economic-trends/private-consumption",
  "government-spending": "/economic-trends/government-spending",
  "corporate-investment": "/economic-trends/corporate-investment",
  "trade": "/economic-trends/trade",
  "infrastructure-investment": "/economic-trends/government-spending/infrastructure-investment",
  "inventory-investment": "/economic-trends/government-spending/inventory-investment",
  "bank": "/finance/bank",
  "insurance-company": "/finance/insurance-company",
  "investment-bank": "/finance/investment-bank",
  "private-equity": "/finance/private-equity",
  "venture-capital": "/finance/venture-capital",
  "ac": "/finance/ac",
  "industry-medical": "/industry/industry-medical",
  "industry-pharmaceutical": "/industry/industry-pharmaceutical",
  "industry-medical-devices": "/industry/industry-medical-devices",
  "industry-cosmetics": "/industry/industry-cosmetics",
  "industry-health-supplements": "/industry/industry-health-supplements",
  "industry-digital-healthcare": "/industry/industry-digital-healthcare",
  "company-medical": "/company/company-medical",
  "company-pharmaceutical": "/company/company-pharmaceutical",
  "company-medical-devices": "/company/company-medical-devices",
  "company-cosmetics": "/company/company-cosmetics",
  "company-health-supplements": "/company/company-health-supplements",
  "company-digital-healthcare": "/company/company-digital-healthcare",
  "policy-medical": "/policy/policy-medical",
  "policy-pharmaceutical": "/policy/policy-pharmaceutical",
  "policy-medical-devices": "/policy/policy-medical-devices",
  "policy-cosmetics": "/policy/policy-cosmetics",
  "policy-health-supplements": "/policy/policy-health-supplements",
  "policy-digital-healthcare": "/policy/policy-digital-healthcare",
  "media-medical": "/media/media-medical",
  "media-pharmaceutical": "/media/media-pharmaceutical",
  "media-medical-devices": "/media/media-medical-devices",
  "media-cosmetics": "/media/media-cosmetics",
  "media-health-supplements": "/media/media-health-supplements",
  "media-digital-healthcare": "/media/media-digital-healthcare",
  "atl": "/marketing/atl",
  "btl": "/marketing/btl",
  "advertising-agency": "/marketing/advertising-agency",
  "advertising-media": "/marketing/advertising-media",
  "performance-marketing": "/marketing/btl/performance-marketing",
  "influencer-marketing": "/marketing/btl/influencer-marketing",
  "news": "/media-review/news",
  "magazine": "/media-review/magazine",
  "books": "/media-review/books",
  "ha-raw-material": "/report/ha-raw-material",
  "syringe": "/report/syringe",
  "filler": "/report/filler",
  "skin-booster": "/report/skin-booster",
  "stem-cell-treatment": "/report/stem-cell-treatment",
  "obesity-treatment": "/report/obesity-treatment",
  "cosmetics": "/report/cosmetics",
  "report": "/report",
  "economic-trends": "/economic-trends",
  "finance": "/finance",
  "industry": "/industry",
  "company": "/company",
  "policy": "/policy",
  "media": "/media",
  "marketing": "/marketing",
  "people": "/people",
  "media-review": "/media-review"
};

// 서브카테고리 슬러그 기반 URL 매핑

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
  "investment-bank": "/finance/investment-bank",
  
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
  "books": "/media-review/books",

  // 리포트 하위 카테고리
  "ha-raw-material": "/report/ha-raw-material",
  "syringe": "/report/syringe",
  "filler": "/report/filler",
  "skin-booster": "/report/skin-booster",
  "stem-cell-treatment": "/report/stem-cell-treatment",
  "obesity-treatment": "/report/obesity-treatment",
  "report-cosmetics": "/report/cosmetics",

  // 인사 동향 하위 카테고리
  "entrepreneur": "/people/entrepreneur",
  "politician": "/people/politician",
  "public-official": "/people/public-official",
  "legal-professional": "/people/legal-professional",
  "accountant": "/people/accountant",
  "tax-accountant": "/people/tax-accountant",
  "patent-attorney": "/people/patent-attorney",
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
      usedKeys.add(url);
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
    "의료기기": "/media/medical-devices",
    "화장품": "/media/cosmetics",
    "건강기능식품": "/health-supplements",
    "디지털헬스케어": "/digital-healthcare",
  },
  "report": {
    "HA원료": "/report/ha-raw-material",
    "시린지": "/report/syringe",
    "필러": "/report/filler",
    "스킨부스터": "/report/skin-booster",
    "줄기세포치료제": "/report/stem-cell-treatment",
    "비만치료제": "/report/obesity-treatment",
    "화장품": "/report/cosmetics",
  },
  "finance": {
    "은행": "/finance/bank",
    "보험사": "/finance/insurance-company",
    "IB": "/finance/investment-bank",
    "PE": "/finance/private-equity",
    "VC": "/finance/venture-capital",
    "AC": "/finance/ac",
  },
  "people": {
    "기업인": "/people/entrepreneur",
    "정치인": "/people/politician",
    "공무원": "/people/public-official",
    "법조인": "/people/legal-professional",
    "회계사": "/people/accountant",
    "세무사": "/people/tax-accountant",
    "변리사": "/people/patent-attorney",
  },
};
