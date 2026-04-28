// Mock data for SI Partners

export interface SiPartner {
  id: string;
  company_name: string;
  region: string;
  tier: 'Silver' | 'Gold' | 'Diamond';
  success_rate: number;
  completed_projects: number;
  failed_projects: number;
  capability_tags: string[];
  badges: Badge[];
  average_rating: number;
  review_count: number;
  financial_grade: string;
  financial_grade_updated_at: string;
  registered_at: string;
  updated_at: string;
  review_summary?: {
    positive: string[];
    negative: string[];
    overall: string;
  };
}

export interface Badge {
  id: string;
  manufacturer_name: string;
  manufacturer_logo?: string;
  issued_at: string;
  expires_at: string;
  is_active: boolean;
}

const MANUFACTURERS = ['UR', '두산로보틱스', '레인보우로보틱스', 'ABB', 'KUKA', 'FANUC'];
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전'];
const TIERS: ('Silver' | 'Gold' | 'Diamond')[] = ['Silver', 'Gold', 'Diamond'];
const TAGS = ['용접', '조립', '도장', '검사', '팔레타이징', '픽앤플레이스', 'CNC 로딩', 'AGV', '협동로봇', '비전검사'];

function generateBadges(count: number): Badge[] {
  const badges: Badge[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const issuedDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const expiresDate = new Date(issuedDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    const isActive = expiresDate > now && Math.random() > 0.2;

    badges.push({
      id: `badge-${i}`,
      manufacturer_name: MANUFACTURERS[Math.floor(Math.random() * MANUFACTURERS.length)],
      issued_at: issuedDate.toISOString(),
      expires_at: expiresDate.toISOString(),
      is_active: isActive,
    });
  }

  return badges;
}

function generateSiPartner(index: number): SiPartner {
  const completed = Math.floor(Math.random() * 150) + 10;
  const failed = Math.floor(Math.random() * 20);
  const success_rate = Math.round((completed / (completed + failed)) * 100 * 10) / 10;

  const tagCount = Math.floor(Math.random() * 5) + 3;
  const capability_tags = [...TAGS]
    .sort(() => 0.5 - Math.random())
    .slice(0, tagCount);

  const badgeCount = Math.floor(Math.random() * 4) + 1;
  const badges = generateBadges(badgeCount);

  const tier = TIERS[Math.floor(Math.random() * TIERS.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];

  const review_count = Math.floor(Math.random() * 50) + 5;
  const average_rating = Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 - 5.0

  const now = new Date();
  const registered = new Date(now.getTime() - Math.random() * 730 * 24 * 60 * 60 * 1000);

  return {
    id: `si-${index.toString().padStart(4, '0')}`,
    company_name: `${region} ${['테크', '로보틱스', '자동화', '시스템', '엔지니어링'][Math.floor(Math.random() * 5)]} ${index}`,
    region,
    tier,
    success_rate,
    completed_projects: completed,
    failed_projects: failed,
    capability_tags,
    badges,
    average_rating,
    review_count,
    financial_grade: ['AAA', 'AA', 'A', 'BBB', 'BB'][Math.floor(Math.random() * 5)],
    financial_grade_updated_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    registered_at: registered.toISOString(),
    updated_at: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    review_summary: Math.random() > 0.3 ? {
      positive: ['응답이 빠릅니다', '기술력이 우수합니다', '일정을 잘 지킵니다'],
      negative: ['견적이 다소 높습니다'],
      overall: '전반적으로 만족스러운 파트너입니다. 기술력과 일정 준수 면에서 신뢰할 수 있습니다.',
    } : undefined,
  };
}

// Generate 50 mock SI partners
export const MOCK_SI_PARTNERS: SiPartner[] = Array.from({ length: 50 }, (_, i) => generateSiPartner(i + 1));

// Filter function
export function filterSiPartners(
  partners: SiPartner[],
  filters: {
    regions?: string[];
    brands?: string[];
    tags?: string[];
    has_badge?: boolean;
    tiers?: string[];
  }
): SiPartner[] {
  return partners.filter((partner) => {
    // Region filter
    if (filters.regions && filters.regions.length > 0) {
      if (!filters.regions.includes(partner.region)) return false;
    }

    // Brand filter (check badges)
    if (filters.brands && filters.brands.length > 0) {
      const partnerBrands = partner.badges
        .filter(b => b.is_active)
        .map(b => b.manufacturer_name);
      const hasMatchingBrand = filters.brands.some(brand => partnerBrands.includes(brand));
      if (!hasMatchingBrand) return false;
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => partner.capability_tags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    // Badge filter
    if (filters.has_badge === true) {
      const hasActiveBadge = partner.badges.some(b => {
        const now = new Date();
        const expiresAt = new Date(b.expires_at);
        return b.is_active && expiresAt > now;
      });
      if (!hasActiveBadge) return false;
    }

    // Tier filter
    if (filters.tiers && filters.tiers.length > 0) {
      if (!filters.tiers.includes(partner.tier)) return false;
    }

    return true;
  });
}

// Pagination
export function paginateSiPartners(
  partners: SiPartner[],
  page: number,
  perPage: number = 10
): { data: SiPartner[]; total: number; totalPages: number } {
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    data: partners.slice(start, end),
    total: partners.length,
    totalPages: Math.ceil(partners.length / perPage),
  };
}
