export interface CategoryItem {
  title: string;
  slug?: string;
  base?: string;
  items?: CategoryItem[];
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
    "리포트",
    {title: "리포트", href: "/report", items: []},
  ],
  [
    "경제 동향",
    {
      title: "경제 동향",
      href: "/economic-trends",  // 메인 카테고리에 href 추가
      items: [
        {title: "민간소비", slug: "private-consumption"},
        {
          title: "정부지출",
          base: "정부지출",
          slug: "government-spending",
          items: [
            {title: "시설투자", slug: "infrastructure-investment"},
            {title: "재고투자", slug: "inventory-investment"},
          ],
        },
        {title: "기업투자", slug: "corporate-investment"},
        {title: "수출입", slug: "trade"}
      ],
    },
  ],
  [
    "금융 동향",
    {
      title: "금융 동향",
      href: "/finance",  // 메인 카테고리에 href 추가
      items: [
        {title: "금리", slug: "interest-rate"},
        {title: "환율", slug: "exchange-rate"},
        {title: "은행", slug: "bank"},
        {title: "금융투자회사", slug: "financial-investment-company"},
        {title: "보험회사", slug: "insurance-company"},
        {title: "PE", slug: "private-equity"},
        {title: "VC", slug: "venture-capital"},
      ],
    },
  ],
  [
    "산업 동향",
    {
      title: "산업 동향",
      href: "/industry",
      items: [
        {title: "필러", slug: "industry-filler"},
        {title: "스킨부스터", slug: "industry-skin-booster"},
        {title: "비만치료제", slug: "industry-obesity-treatment"},
        {title: "보톡스", slug: "industry-botox"},
        {title: "의료", slug: "industry-medical"},
        {title: "제약", slug: "industry-pharmaceutical"},
        {title: "의료기기", slug: "industry-medical-devices"},
        {title: "화장품", slug: "industry-cosmetics"},
        {title: "건강기능식품", slug: "industry-health-supplements"},
        {title: "디지털헬스케어", slug: "industry-digital-healthcare"},
      ],
    },
  ],
  [
    "기업 동향",
    {
      title: "기업 동향",
      href: "/company",
      items: [
        {title: "필러", slug: "company-filler"},
        {title: "스킨부스터", slug: "company-skin-booster"},
        {title: "비만치료제", slug: "company-obesity-treatment"},
        {title: "보톡스", slug: "company-botox"},
        {title: "의료", slug: "company-medical"},
        {title: "제약", slug: "company-pharmaceutical"},
        {title: "의료기기", slug: "company-medical-devices"},
        {title: "화장품", slug: "company-cosmetics"},
        {title: "건강기능식품", slug: "company-health-supplements"},
        {title: "디지털헬스케어", slug: "company-digital-healthcare"},
      ],
    },
  ],
  [
    "정책 동향",
    {
      title: "정책 동향",
      href: "/policy",
      items: [
        {title: "필러", slug: "policy-filler"},
        {title: "스킨부스터", slug: "policy-skin-booster"},
        {title: "비만치료제", slug: "policy-obesity-treatment"},
        {title: "보톡스", slug: "policy-botox"},
        {title: "의료", slug: "policy-medical"},
        {title: "제약", slug: "policy-pharmaceutical"},
        {title: "의료기기", slug: "policy-medical-devices"},
        {title: "화장품", slug: "policy-cosmetics"},
        {title: "건강기능식품", slug: "policy-health-supplements"},
        {title: "디지털헬스케어", slug: "policy-digital-healthcare"},
      ],
    },
  ],
  [
    "언론 동향",
    {
      title: "언론 동향",
      href: "/media",
      items: [
        {title: "필러", slug: "media-filler"},
        {title: "스킨부스터", slug: "media-skin-booster"},
        {title: "비만치료제", slug: "media-obesity-treatment"},
        {title: "보톡스", slug: "media-botox"},
        {title: "의료", slug: "media-medical"},
        {title: "제약", slug: "media-pharmaceutical"},
        {title: "의료기기", slug: "media-medical-devices"},
        {title: "화장품", slug: "media-cosmetics"},
        {title: "건강기능식품", slug: "media-health-supplements"},
        {title: "디지털헬스케어", slug: "media-digital-healthcare"},
      ],
    },
  ],
  [
    "마케팅 동향",
    {
      title: "마케팅 동향",
      href: "/marketing",  // 메인 카테고리에 href 추가
      items: [
        {title: "ATL", slug: "atl"},
        {
          title: "BTL",
          base: "마케팅 동향/btl",
          items: [
            {title: "퍼포먼스 마케팅", slug: "performance-marketing"},
            {title: "인플루언서 마케팅", slug: "influencer-marketing"},
          ],
        },
        {title: "광고대행사", slug: "advertising-agency"},
        {title: "광고매체", slug: "advertising-media"}
      ]
    }
  ],
  [
    "인물과 동향",
    {title: "인물과 동향", href: "/people", items: []},
  ],
  [
    "미디어 리뷰",
    {
      title: "미디어 리뷰",
      href: "/media-review",  // 메인 카테고리에 href 추가
      items: [
        {title: "뉴스", slug: "news"},
        {title: "매거진", slug: "magazine"},
        {title: "도서", slug: "books"},
      ],
    },
  ],
  [
    "주요일정",
    {title: "주요일정", href: "/schedule", items: []},
  ]
]);
export async function generateStaticParams() {
  const paramsArray: { mainCategory: string; subcategory: string }[] = [];

  // 재귀적으로 카테고리 항목을 처리하는 함수
  function processCategoryItem(
    mainCategory: string,
    item: CategoryItem,
    paramsArray: {mainCategory: string; subcategory: string}[]
  ) {
    // slug가 있을 때만 경로 파라미터에 추가
    if (item.slug) {
      paramsArray.push({
        mainCategory: mainCategory,
        subcategory: item.slug,
      });
    }

    // item.items가 있으면 재귀적으로 처리
    if (item.items) {
      for (const subItem of item.items) {
        processCategoryItem(mainCategory, subItem, paramsArray);
      }
    }
  }

  // 메인 카테고리 처리
  for (const cat of categoryOptions.values()) {
    const mainPath = cat.href
      ? cat.href.replace(/^\//, "")
      : cat.base
        ? cat.base.replace(/^\//, "")
        : cat.title.toLowerCase().replace(/[\s]+/g, "-");

    if (cat.items && cat.items.length > 0) {
      for (const subCat of cat.items) {
        processCategoryItem(mainPath, subCat, paramsArray);
      }
    }
  }

  return paramsArray;
}
