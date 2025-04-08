// 한글 카테고리명을 영문으로 변환하는 매핑
export const categoryMappings: Record<string, string> = {
  // 메인 카테고리
  "리포트": "report",
  "경제 동향": "economic-trends",
  "금융 동향": "finance",
  "산업 동향": "industry",
  "기업 동향": "company",
  "정책 동향": "policy",
  "언론 동향": "media",
  "마케팅 동향": "marketing",
  "인사 동향": "people",
  "미디어 리뷰": "media-review",
  "새 카테고리": "new-category",

  // 리포트 하위 카테고리
  "HA원료": "ha-ingredients",
  "시린지": "syringe",
  "필러": "filler",
  "스킨부스터": "skin-booster",
  "줄기세포치료제": "stem-cell-therapy",
  "비만치료제": "obesity-treatment",
  "화장품": "cosmetics",
  
  // 기본 서브 카테고리
  "민간소비": "private-consumption",
  "정부지출": "government-spending",
  "기업투자": "corporate-investment",
  "수출입": "trade",
  "은행": "bank",
  "보험사": "insurance-company",
  "PE": "private-equity",
  "VC": "venture-capital",
  "AC": "ac",
  "ATL": "atl",
  "BTL": "btl",
  "광고대행사": "advertising-agency",
  "광고매체": "advertising-media",
  "뉴스": "news",
  "매거진": "magazine",
  "도서": "books",

  // 인사 동향 하위 카테고리
  "기업인": "businessman",
  "정치인": "politician",
  "공무원": "government-official",
  "법조인": "lawyer",
  "회계사": "accountant",
  "세무사": "tax-accountant",
  "변리사": "patent-attorney",
  
  // 서브서브 카테고리
  "시설투자": "infrastructure-investment",
  "재고투자": "inventory-investment",
  "퍼포먼스 마케팅": "performance-marketing",
  "인플루언서 마케팅": "influencer-marketing",
  
  // 산업 동향의 서브카테고리
  "산업_필러": "industry-filler",
  "산업_스킨부스터": "industry-skin-booster",
  "산업_비만치료제": "industry-obesity-treatment",
  "산업_보톡스": "industry-botox",
  "산업_의료": "industry-medical",
  "산업_제약": "industry-pharmaceutical",
  "산업_의료기기": "industry-medical-devices",
  "산업_화장품": "industry-cosmetics",
  "산업_건강기능식품": "industry-health-supplements",
  "산업_디지털헬스케어": "industry-digital-healthcare",
  
  // 기업 동향의 서브카테고리
  "기업_필러": "company-filler",
  "기업_스킨부스터": "company-skin-booster",
  "기업_비만치료제": "company-obesity-treatment",
  "기업_보톡스": "company-botox",
  "기업_의료": "company-medical",
  "기업_제약": "company-pharmaceutical",
  "기업_의료기기": "company-medical-devices",
  "기업_화장품": "company-cosmetics",
  "기업_건강기능식품": "company-health-supplements",
  "기업_디지털헬스케어": "company-digital-healthcare",
  
  // 정책 동향의 서브카테고리
  "정책_필러": "policy-filler",
  "정책_스킨부스터": "policy-skin-booster",
  "정책_비만치료제": "policy-obesity-treatment",
  "정책_보톡스": "policy-botox",
  "정책_의료": "policy-medical",
  "정책_제약": "policy-pharmaceutical",
  "정책_의료기기": "policy-medical-devices",
  "정책_화장품": "policy-cosmetics",
  "정책_건강기능식품": "policy-health-supplements",
  "정책_디지털헬스케어": "policy-digital-healthcare",
  
  // 언론 동향의 서브카테고리
  "언론_필러": "media-filler",
  "언론_스킨부스터": "media-skin-booster",
  "언론_비만치료제": "media-obesity-treatment",
  "언론_보톡스": "media-botox",
  "언론_의료": "media-medical",
  "언론_제약": "media-pharmaceutical",
  "언론_의료기기": "media-medical-devices",
  "언론_화장품": "media-cosmetics",
  "언론_건강기능식품": "media-health-supplements",
};

// 컨텍스트별 서브카테고리 표시 이름과 매핑
export const contextualCategoryDisplay: Record<string, Record<string, string>> = {
  "industry": {
    "필러": "industry-filler",
    "스킨부스터": "industry-skin-booster",
    "비만치료제": "industry-obesity-treatment",
    "보톡스": "industry-botox",
    "의료": "industry-medical",
    "제약": "industry-pharmaceutical",
    "의료기기": "industry-medical-devices",
    "화장품": "industry-cosmetics",
    "건강기능식품": "industry-health-supplements",
    "디지털헬스케어": "industry-digital-healthcare",
  },
  "company": {
    "필러": "company-filler",
    "스킨부스터": "company-skin-booster",
    "비만치료제": "company-obesity-treatment",
    "보톡스": "company-botox",
    "의료": "company-medical",
    "제약": "company-pharmaceutical",
    "의료기기": "company-medical-devices",
    "화장품": "company-cosmetics",
    "건강기능식품": "company-health-supplements",
    "디지털헬스케어": "industry-digital-healthcare",
  },
  "policy": {
    "필러": "policy-filler",
    "스킨부스터": "policy-skin-booster",
    "비만치료제": "policy-obesity-treatment",
    "보톡스": "policy-botox",
    "의료": "policy-medical",
    "제약": "policy-pharmaceutical",
    "의료기기": "policy-medical-devices",
    "화장품": "industry-cosmetics",
    "건강기능식품": "industry-health-supplements",
    "디지털헬스케어": "industry-digital-healthcare",
  },
  "media": {
    "필러": "media-filler",
    "스킨부스터": "media-skin-booster",
    "비만치료제": "media-obesity-treatment",
    "보톡스": "media-botox",
    "의료": "industry-medical",
    "제약": "industry-pharmaceutical",
    "의료기기": "industry-medical-devices",
    "화장품": "industry-cosmetics",
    "건강기능식품": "industry-health-supplements",
    "디지털헬스케어": "industry-digital-healthcare",
  }
};

// 부모 카테고리별 동일한 이름의 서브카테고리를 처리하기 위한 매핑
export const contextualCategoryMappings: Record<string, Record<string, string>> = {
  "industry": {
    "필러": "industry-filler",
    "스킨부스터": "industry-skin-booster",
    "비만치료제": "industry-obesity-treatment",
    "보톡스": "industry-botox",
    "의료": "industry-medical",
    "제약": "industry-pharmaceutical",
    "의료기기": "industry-medical-devices",
    "화장품": "industry-cosmetics",
    "건강기능식품": "industry-health-supplements",
    "디지털헬스케어": "industry-digital-healthcare",
  },
  "company": {
    "필러": "company-filler",
    "스킨부스터": "company-skin-booster",
    "비만치료제": "company-obesity-treatment",
    "보톡스": "company-botox",
    "의료": "company-medical",
    "제약": "company-pharmaceutical",
    "의료기기": "company-medical-devices",
    "화장품": "industry-cosmetics",
    "건강기능식품": "industry-health-supplements",
    "디지털헬스케어": "industry-digital-healthcare",
  },
  "policy": {
    "필러": "policy-filler",
    "스킨부스터": "policy-skin-booster",
    "비만치료제": "industry-obesity-treatment",
    "보톡스": "policy-botox",
    "의료": "industry-medical",
    "제약": "industry-pharmaceutical",
    "의료기기": "industry-medical-devices",
    "화장품": "industry-cosmetics",
    "건강기능식품": "industry-health-supplements",
    "디지털헬스케어": "industry-digital-healthcare",
  },
  "media": {
    "필러": "media-filler",
    "스킨부스터": "media-skin-booster",
    "비만치료제": "media-obesity-treatment",
    "보톡스": "media-botox",
    "의료": "industry-medical",
    "제약": "industry-pharmaceutical",
    "의료기기": "industry-medical-devices",
    "화장품": "industry-cosmetics",
    "건강기능식품": "industry-health-supplements",
    "디지털헬스케어": "industry-digital-healthcare",
  }
};

// 컨텍스트가 있을 때 올바른 카테고리 매핑 가져오기
export function getCategoryMapping(category: string, parentCategory?: string): string {
  // 동일한 이름의 카테고리가 있는 경우 (의료, 제약 등)
  if (parentCategory && contextualCategoryMappings[parentCategory] && 
      contextualCategoryMappings[parentCategory][category]) {
    return contextualCategoryMappings[parentCategory][category];
  }
  
  // 일반적인 경우
  return categoryMappings[category] || category.toLowerCase().replace(/\s+/g, "-");
}

// 역방향 매핑 (영문 -> 한글) - 필요시 사용
export const reverseCategoryMappings: Record<string, string> = 
  Object.fromEntries(Object.entries(categoryMappings).map(([k, v]) => [v, k]));
