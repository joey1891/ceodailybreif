export const categoryMappings: Record<string, string> = {
  "리포트": "report",
  "경제 동향": "economic-trends",
  "금융 동향": "financial-trends",
  "산업 동향": "industry",
  "기업 동향": "company",
  "정책 동향": "policy",
  "언론 동향": "media",
  "마케팅 동향": "marketing",
  "인물과 동향": "people",
  "미디어 리뷰": "media-review"
};

// 역방향 매핑 (영문 -> 한글) - 표시용
export const reverseCategoryMappings: Record<string, string> = 
  Object.fromEntries(Object.entries(categoryMappings).map(([k, v]) => [v, k])); 