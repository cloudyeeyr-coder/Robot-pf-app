// MOCK-001: Realistic Korean Buyer Companies

export interface BuyerCompany {
  id: string;
  company_name: string;
  registration_number: string;
  region: string;
  city: string;
  segment: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}

export const MOCK_BUYER_COMPANIES: BuyerCompany[] = [
  {
    id: 'buyer-001',
    company_name: '(주)한빛정밀',
    registration_number: '214-81-12345',
    region: '서울특별시',
    city: '강남구',
    segment: 'Q2',
    contact_name: '김민수',
    contact_email: 'minsu.kim@hanbitmfg.co.kr',
    contact_phone: '010-2341-5678',
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-002',
    company_name: '(주)동양산업',
    registration_number: '134-81-23456',
    region: '경기도',
    city: '성남시',
    segment: 'Q3',
    contact_name: '이정희',
    contact_email: 'jeonghee.lee@dongyangind.com',
    contact_phone: '010-3452-6789',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-003',
    company_name: '(주)미래자동화',
    registration_number: '456-81-34567',
    region: '인천광역시',
    city: '남동구',
    segment: 'Q2',
    contact_name: '박성우',
    contact_email: 'sungwoo.park@miraeauto.kr',
    contact_phone: '010-4563-7890',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-004',
    company_name: '디지털테크(주)',
    registration_number: '567-81-45678',
    region: '부산광역시',
    city: '해운대구',
    segment: 'Q1',
    contact_name: '최수진',
    contact_email: 'sujin.choi@digitaltech.co.kr',
    contact_phone: '010-5674-8901',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-005',
    company_name: '(주)스마트팩토리코리아',
    registration_number: '678-81-56789',
    region: '대구광역시',
    city: '달서구',
    segment: 'Q2',
    contact_name: '정현우',
    contact_email: 'hyunwoo.jung@smartfactory.kr',
    contact_phone: '010-6785-9012',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-006',
    company_name: '(주)신화제조',
    registration_number: '789-81-67890',
    region: '광주광역시',
    city: '북구',
    segment: 'Q3',
    contact_name: '강지은',
    contact_email: 'jieun.kang@shinhwamfg.com',
    contact_phone: '010-7896-0123',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-007',
    company_name: '(주)태평양전자',
    registration_number: '890-81-78901',
    region: '경기도',
    city: '화성시',
    segment: 'Q1',
    contact_name: '윤서연',
    contact_email: 'seoyeon.yoon@pacificelec.kr',
    contact_phone: '010-8907-1234',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-008',
    company_name: '(주)대한정공',
    registration_number: '901-81-89012',
    region: '서울특별시',
    city: '금천구',
    segment: 'Q4',
    contact_name: '임도현',
    contact_email: 'dohyun.lim@daehanprecision.com',
    contact_phone: '010-9018-2345',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-009',
    company_name: '(주)글로벌테크',
    registration_number: '012-81-90123',
    region: '경기도',
    city: '평택시',
    segment: 'Q2',
    contact_name: '한민지',
    contact_email: 'minji.han@globaltech.kr',
    contact_phone: '010-0129-3456',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'buyer-010',
    company_name: '(주)유니온산업',
    registration_number: '123-81-01234',
    region: '부산광역시',
    city: '강서구',
    segment: 'Q3',
    contact_name: '서준호',
    contact_email: 'junho.seo@unionind.co.kr',
    contact_phone: '010-1230-4567',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getBuyerCompanyById(id: string): BuyerCompany | undefined {
  return MOCK_BUYER_COMPANIES.find((c) => c.id === id);
}

export function getBuyerCompaniesByRegion(region: string): BuyerCompany[] {
  return MOCK_BUYER_COMPANIES.filter((c) => c.region === region);
}

export function getBuyerCompaniesBySegment(segment: BuyerCompany['segment']): BuyerCompany[] {
  return MOCK_BUYER_COMPANIES.filter((c) => c.segment === segment);
}
