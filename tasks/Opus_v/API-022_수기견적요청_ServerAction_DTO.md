---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-022: Quote 도메인 — 수기 견적 요청 (requestManualQuote) Server Action DTO, 리드 상태 전이 규칙 정의"
labels: 'feature, backend, api-contract, raas, quote, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [API-022] 수기 견적 요청 (`requestManualQuote`) Server Action DTO 및 리드 상태 전이 규칙 정의
- 목적: 자동 견적이 어려운 복잡한 로봇 도입 건에 대해 수요기업이 **수기 견적을 요청**하는 Server Action의 DTO, 리드(QUOTE_LEAD) 상태 전이 규칙, 에러 코드를 정의한다. Admin이 수동으로 견적을 작성하여 응답하는 워크플로우의 시작점이다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-FUNC-023`](../../docs/06_SRS-v1.md) — 수기 견적 요청 프로세스
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #19`](../../docs/06_SRS-v1.md) — `action: requestManualQuote`
- 데이터 모델: [`06_SRS-v1.md#6.2.11 QUOTE_LEAD`](../../docs/06_SRS-v1.md)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-022`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO
- [ ] `RequestManualQuoteRequest` 정의 (`lib/contracts/quote/request-manual-quote.ts`)
  ```typescript
  export interface RequestManualQuoteRequest {
    robotModel: string;          // 로봇 모델명 (1~255자)
    quantity: number;             // 수량 (≥ 1)
    termMonths: number;           // 희망 계약 기간 (≥ 1)
    contactName: string;          // 담당자 이름 (1~100자)
    contactEmail: string;         // 담당자 이메일
    contactPhone: string;         // 담당자 전화번호
    additionalNote?: string;      // 추가 요청사항 (선택, 최대 2000자)
    buyerCompanyId?: string;      // 로그인 시 자동 매핑 (선택)
  }
  ```

### 2단계: Zod 스키마
  ```typescript
  export const requestManualQuoteSchema = z.object({
    robotModel: z.string().min(1).max(255),
    quantity: z.number().int().min(1, '최소 1대 이상'),
    termMonths: z.number().int().min(1, '최소 1개월 이상'),
    contactName: z.string().min(1).max(100),
    contactEmail: z.string().email(),
    contactPhone: z.string().regex(/^01[016789]-\d{3,4}-\d{4}$/),
    additionalNote: z.string().max(2000).optional(),
    buyerCompanyId: z.string().optional(),
  });
  ```

### 3단계: 리드 상태 전이 규칙
  ```typescript
  export enum QuoteLeadStatus {
    PENDING      = 'pending',       // 접수됨
    IN_PROGRESS  = 'in_progress',   // Admin 검토 중
    RESPONDED    = 'responded',     // Admin 견적 응답 완료
    CLOSED       = 'closed',        // 종료 (수요기업 확인 또는 만료)
  }

  export const QUOTE_LEAD_TRANSITIONS: Record<QuoteLeadStatus, QuoteLeadStatus[]> = {
    [QuoteLeadStatus.PENDING]:     [QuoteLeadStatus.IN_PROGRESS],
    [QuoteLeadStatus.IN_PROGRESS]: [QuoteLeadStatus.RESPONDED],
    [QuoteLeadStatus.RESPONDED]:   [QuoteLeadStatus.CLOSED],
    [QuoteLeadStatus.CLOSED]:      [],
  };
  ```

### 4단계: Response DTO
  ```typescript
  export interface RequestManualQuoteSuccessResponse {
    success: true;
    data: {
      quoteLeadId: string;
      status: 'pending';
      robotModel: string;
      quantity: number;
      createdAt: string;
      estimatedResponseDays: number;  // 예상 응답 소요일 (3~5영업일)
      message: string;
    };
  }
  ```

### 5단계: 에러 코드
  ```typescript
  export enum RequestManualQuoteErrorCode {
    VALIDATION_ERROR   = 'QOT_022_VALIDATION',      // 400
    DUPLICATE_PENDING  = 'QOT_022_DUPLICATE',        // 409 (동일 모델 pending 존재)
    INTERNAL_ERROR     = 'QOT_022_INTERNAL',         // 500
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 견적 요청 접수**
- **Given:** 유효한 모델·수량·연락처 입력
- **When:** `requestManualQuote` 호출
- **Then:** QUOTE_LEAD INSERT (status=pending), 예상 응답 3~5영업일 안내

**Scenario 2: 비로그인 사용자 견적 요청**
- **Given:** 비로그인 상태, `buyerCompanyId` 미입력
- **When:** 견적 요청
- **Then:** 정상 접수 (buyerCompanyId=null 허용)

**Scenario 3: 동일 모델 중복 pending 요청**
- **Given:** 동일 contactEmail로 동일 robotModel pending 건 존재
- **When:** 재요청
- **Then:** `QOT_022_DUPLICATE` 에러 409

## :gear: Technical & Non-Functional Constraints
- **구현:** Next.js Server Action — CON-12
- **인증:** 비로그인 사용자 허용 (buyerCompanyId nullable)
- **성능:** p95 ≤ 300ms
- **보안:** contactPhone, contactEmail 서버 로그 마스킹

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO 정의 완료
- [ ] `QuoteLeadStatus` ENUM 및 상태 전이 규칙 정의
- [ ] 에러 코드 정의, ESLint 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-012 | `QUOTE_LEAD` 테이블 스키마 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FC-022 | 수기 견적 요청 Command 로직 |
| UI-010 | RaaS 계산기 — "수기 견적 요청" 버튼 |
