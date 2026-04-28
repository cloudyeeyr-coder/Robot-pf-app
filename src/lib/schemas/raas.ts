import { z } from 'zod';

export const raasCalcInputSchema = z.object({
  robot_model: z.string().min(1, '로봇 모델을 선택해주세요'),
  quantity: z.number({ invalid_type_error: '수량을 입력해주세요' })
    .int('수량은 정수여야 합니다')
    .min(1, '수량은 1 이상이어야 합니다'),
  term_months: z.enum(['12', '24', '36', '48', '60'], {
    errorMap: () => ({ message: '계약 기간을 선택해주세요' })
  }),
});

export type RaasCalcInput = z.infer<typeof raasCalcInputSchema>;

export const quoteRequestSchema = z.object({
  robot_model: z.string().min(1, '로봇 모델을 입력해주세요'),
  quantity: z.number({ invalid_type_error: '수량을 입력해주세요' })
    .int('수량은 정수여야 합니다')
    .min(1, '수량은 1 이상이어야 합니다'),
  term_months: z.string().min(1, '계약 기간을 선택해주세요'),
  selected_plan: z.enum(['capex', 'lease', 'raas']),
  contact_name: z.string().min(1, '담당자명을 입력해주세요').max(100, '담당자명은 최대 100자까지 입력 가능합니다'),
  contact_email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  contact_phone: z.string().regex(/^01[016789]-\d{3,4}-\d{4}$/, '올바른 휴대폰 번호 형식을 입력해주세요 (예: 010-1234-5678)'),
  additional_requests: z.string().max(500, '최대 500자까지 입력 가능합니다').optional(),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
