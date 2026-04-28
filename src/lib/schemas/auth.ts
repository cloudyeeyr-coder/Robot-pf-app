import { z } from 'zod';

// 사업자등록번호 검증 (XXX-XX-XXXXX 형식)
const bizRegistrationNoRegex = /^\d{3}-\d{2}-\d{5}$/;

// 전화번호 검증 (01X-XXXX-XXXX 형식)
const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;

// 공통 회사 정보 스키마
export const companyBasicsSchema = z.object({
  company_name: z.string()
    .min(1, '회사명을 입력해주세요')
    .max(255, '회사명은 255자를 초과할 수 없습니다'),

  biz_registration_no: z.string()
    .regex(bizRegistrationNoRegex, '올바른 사업자등록번호 형식이 아닙니다 (예: 123-45-67890)'),

  region: z.enum([
    '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
    '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ], {
    errorMap: () => ({ message: '지역을 선택해주세요' })
  }),
});

// 담당자 정보 스키마
export const contactInfoSchema = z.object({
  contact_name: z.string()
    .min(1, '담당자명을 입력해주세요')
    .max(100, '담당자명은 100자를 초과할 수 없습니다'),

  contact_email: z.string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),

  contact_phone: z.string()
    .regex(phoneRegex, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
});

// 수요기업 회원가입 스키마
export const buyerSignupSchema = z.object({
  ...companyBasicsSchema.shape,

  segment: z.enum(['Q1', 'Q2', 'Q3', 'Q4'], {
    errorMap: () => ({ message: '기업 규모를 선택해주세요' })
  }),

  ...contactInfoSchema.shape,
});

// SI 파트너 회원가입 스키마
export const siPartnerSignupSchema = z.object({
  ...companyBasicsSchema.shape,
  ...contactInfoSchema.shape,

  segment: z.enum(['Q1', 'Q2', 'Q3', 'Q4'], {
    errorMap: () => ({ message: '기업 규모를 선택해주세요' })
  }),

  completed_projects: z.number()
    .int('정수를 입력해주세요')
    .min(0, '0 이상의 숫자를 입력해주세요'),

  failed_projects: z.number()
    .int('정수를 입력해주세요')
    .min(0, '0 이상의 숫자를 입력해주세요'),

  capability_tags: z.array(z.string())
    .min(1, '최소 1개의 역량 태그를 선택해주세요')
    .max(10, '역량 태그는 최대 10개까지 선택 가능합니다'),
});

export type BuyerSignupInput = z.infer<typeof buyerSignupSchema>;
export type SiPartnerSignupInput = z.infer<typeof siPartnerSignupSchema>;
