export interface CategoryItem {
  title: string;
  slug: string;
}

export interface CategoryOption {
  title: string;
  /** 자식 항목이 없으면 direct link로 사용 */
  href?: string;
  /** 자식 항목이 있으면 base URL (예: "/industry") */
  base?: string;
  items: CategoryItem[];
}

/**
 * Home과 주요일정은 별도로 처리하므로 여기서는 Report, 경제/산업/기업/정책/언론 동향, 인물, 미디어 리뷰만 정의
 */
export const categoryOptions = new Map<string, CategoryOption>([
  [
    "Report",
    { title: "Report", href: "/report", items: [] },
  ],
  [
    "경제 동향",
    {
      title: "경제 동향",
      base: "/economic-trends",
      items: [
        { title: "의료", slug: "medical" },
        { title: "제약", slug: "pharmaceutical" },
        { title: "의료기기", slug: "medical-devices" },
        { title: "화장품", slug: "cosmetics" },
        { title: "건강기능식품", slug: "health-supplements" },
        { title: "디지털헬스케어", slug: "digital-healthcare" },
      ],
    },
  ],
  [
    "산업 동향",
    {
      title: "산업 동향",
      base: "/industry",
      items: [
        { title: "의료", slug: "medical" },
        { title: "제약", slug: "pharmaceutical" },
        { title: "의료기기", slug: "medical-devices" },
        { title: "화장품", slug: "cosmetics" },
        { title: "건강기능식품", slug: "health-supplements" },
        { title: "디지털헬스케어", slug: "digital-healthcare" },
      ],
    },
  ],
  [
    "기업 동향",
    {
      title: "기업 동향",
      base: "/company",
      items: [
        { title: "의료", slug: "medical" },
        { title: "제약", slug: "pharmaceutical" },
        { title: "의료기기", slug: "medical-devices" },
        { title: "화장품", slug: "cosmetics" },
        { title: "건강기능식품", slug: "health-supplements" },
        { title: "디지털헬스케어", slug: "digital-healthcare" },
      ],
    },
  ],
  [
    "정책 동향",
    {
      title: "정책 동향",
      base: "/policy",
      items: [
        { title: "의료", slug: "medical" },
        { title: "제약", slug: "pharmaceutical" },
        { title: "의료기기", slug: "medical-devices" },
        { title: "화장품", slug: "cosmetics" },
        { title: "건강기능식품", slug: "health-supplements" },
        { title: "디지털헬스케어", slug: "digital-healthcare" },
      ],
    },
  ],
  [
    "언론 동향",
    {
      title: "언론 동향",
      base: "/media",
      items: [
        { title: "의료", slug: "medical" },
        { title: "제약", slug: "pharmaceutical" },
        { title: "의료기기", slug: "medical-devices" },
        { title: "화장품", slug: "cosmetics" },
        { title: "건강기능식품", slug: "health-supplements" },
        { title: "디지털헬스케어", slug: "digital-healthcare" },
      ],
    },
  ],
  [
    "인물",
    { title: "인물", href: "/people", items: [] },
  ],
  [
    "미디어 리뷰",
    {
      title: "미디어 리뷰",
      base: "/media-review",
      items: [
        { title: "뉴스", slug: "news" },
        { title: "매거진", slug: "magazine" },
        { title: "도서", slug: "books" },
      ],
    },
  ],
]);
