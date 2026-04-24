---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-020: RaaS 도메인 — RaaS 옵션 계산 (calculateRaasOptions) Server Action DTO, 3옵션 비교 JSON 출력 구조, 유효성 규칙 정의"
labels: 'feature, backend, api-contract, raas, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-020] RaaS 옵션 계산 (`calculateRaasOptions`) Server Action DTO 및 3옵션 비교 JSON 구조 정의
- 목적: 수요기업이 로봇 모델·수량·기간을 입력하면 **구매/리스/RaaS 3가지 도입 방식**의 월비용·TCO·리스크를 비교하는 Server Action의 Request/Response DTO, 계산 규칙, 에러 코드를 정의한다. 계산 응답 p95 ≤ 3초를 달성해야 하며, 결과는 PDF 변환(API-021)의 입력 데이터로 활용된다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-FUNC-021`](../../docs/06_SRS-v1.md) — RaaS 비용 시뮬레이션
- SRS: [`06_SRS-v1.md#REQ-FUNC-022`](../../docs/06_SRS-v1.md) — 구매 vs 리스 vs RaaS 3옵션 비교
- API Overview: [`06_SRS-v1.md#3.3 API-08`](../../docs/06_SRS-v1.md) — RaaS 계산기 (p95 ≤ 3초)
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #17`](../../docs/06_SRS-v1.md) — `action: calculateRaasOptions`
- 데이터 모델: `DB-016` (RAAS_PRICING 테이블)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-020`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `CalculateRaasOptionsRequest` 타입 정의 (`lib/contracts/raas/calculate-options.ts`)
  ```typescript
  export interface CalculateRaasOptionsRequest {
    robotModel: string;          // 로봇 모델명 (1~255자)
    quantity: number;             // 도입 수량 (1~999)
    termMonths: number;           // 계약 기간 (개월, 12/24/36/48/60)
    includeInsurance?: boolean;   // 보험 포함 여부 (기본 true)
    includeAs?: boolean;          // AS 보증 포함 여부 (기본 true)
  }
  ```

### 2단계: Zod 유효성 스키마
- [ ] `calculateRaasOptionsSchema` 작성
  ```typescript
  export const calculateRaasOptionsSchema = z.object({
    robotModel: z.string()
      .min(1, '로봇 모델을 선택해주세요')
      .max(255),
    quantity: z.number()
      .int('수량은 정수여야 합니다')
      .min(1, '최소 1대 이상 입력해주세요')
      .max(999, '최대 999대까지 입력 가능합니다'),
    termMonths: z.number()
      .refine(v => [12, 24, 36, 48, 60].includes(v), {
        message: '계약 기간은 12, 24, 36, 48, 60개월 중 선택해주세요',
      }),
    includeInsurance: z.boolean().default(true),
    includeAs: z.boolean().default(true),
  });
  ```

### 3단계: 3옵션 비교 JSON 출력 구조 정의
- [ ] `RaasComparisonResult` 타입 정의
  ```typescript
  export interface RaasComparisonResult {
    // === 입력 요약 ===
    input: {
      robotModel: string;
      modelDisplayName: string;
      unitPrice: number;          // 단가 (원)
      quantity: number;
      termMonths: number;
    };

    // === 3옵션 비교 ===
    options: [PurchaseOption, LeaseOption, RaasOption];

    // === 추천 ===
    recommendation: {
      bestOption: 'purchase' | 'lease' | 'raas';
      reason: string;
      savingsVsPurchase: number;  // 구매 대비 절감액 (원)
      savingsPercent: number;     // 구매 대비 절감률 (%)
    };

    calculatedAt: string;         // ISO 8601
  }

  export interface PurchaseOption {
    type: 'purchase';
    label: '일시 구매';
    initialCost: number;          // 초기 투자비 (단가 × 수량)
    monthlyCost: number;          // 월 유지비 (보험+AS)
    totalCostOfOwnership: number; // TCO (기간 내 총비용)
    riskLevel: 'high';            // 리스크 (감가상각, 기술 노후화)
    riskFactors: string[];
  }

  export interface LeaseOption {
    type: 'lease';
    label: '금융 리스';
    initialCost: number;          // 보증금
    monthlyCost: number;          // 월 리스료
    totalCostOfOwnership: number;
    interestRate: number;         // 리스 이율 (%)
    riskLevel: 'medium';
    riskFactors: string[];
  }

  export interface RaasOption {
    type: 'raas';
    label: 'RaaS (Robot-as-a-Service)';
    initialCost: 0;               // 초기 비용 없음
    monthlyCost: number;          // 월 구독료
    totalCostOfOwnership: number;
    includesInsurance: boolean;
    includesAs: boolean;
    riskLevel: 'low';
    riskFactors: string[];
    advantages: string[];         // RaaS 장점 목록
  }
  ```

### 4단계: Response DTO
- [ ] 성공 응답
  ```typescript
  export interface CalculateRaasSuccessResponse {
    success: true;
    data: RaasComparisonResult;
  }
  ```
- [ ] 실패 응답
  ```typescript
  export interface CalculateRaasErrorResponse {
    success: false;
    error: {
      code: CalculateRaasErrorCode;
      message: string;
      details?: Record<string, string[]>;
    };
  }
  ```

### 5단계: 에러 코드 정의
- [ ] `CalculateRaasErrorCode`
  ```typescript
  export enum CalculateRaasErrorCode {
    VALIDATION_ERROR    = 'RAAS_020_VALIDATION',
    MODEL_NOT_FOUND     = 'RAAS_020_MODEL_NOT_FOUND',
    PRICING_UNAVAILABLE = 'RAAS_020_PRICING_UNAVAILABLE',
    CALCULATION_TIMEOUT = 'RAAS_020_TIMEOUT',
    INTERNAL_ERROR      = 'RAAS_020_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP | 설명 |
  |:---|:---:|:---|
  | `RAAS_020_MODEL_NOT_FOUND` | 404 | 로봇 모델 미존재 |
  | `RAAS_020_PRICING_UNAVAILABLE` | 404 | 해당 모델 가격 정보 미등록 |
  | `RAAS_020_TIMEOUT` | 504 | 계산 시간 초과 |

### 6단계: Server Action 시그니처 및 테스트
- [ ] Server Action 함수 시그니처
  ```typescript
  'use server';
  export async function calculateRaasOptions(
    prevState: CalculateRaasResponse | null,
    formData: FormData
  ): Promise<CalculateRaasResponse> {
    // 1. FormData → 객체 변환
    // 2. calculateRaasOptionsSchema.safeParse()
    // 3. RAAS_PRICING 조회 (모델별 단가, 리스 이율, RaaS 구독료)
    // 4. 3옵션 TCO 계산 (순수 함수)
    // 5. 최적 옵션 추천 로직 (최저 TCO 기반)
    // 6. 응답 반환
  }
  ```
- [ ] 단위 테스트: 유효 3건 (12/36/60개월), 무효 4건 (0수량, 잘못된 기간 등)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 3옵션 비교 계산**
- **Given:** 유효한 모델(`robotModel: "UR10e"`), `quantity: 5`, `termMonths: 36`
- **When:** `calculateRaasOptions`를 호출함
- **Then:** purchase/lease/raas 3옵션의 TCO가 포함된 JSON 응답, p95 ≤ 3초

**Scenario 2: RaaS 추천 로직**
- **Given:** 36개월 이상 장기 계약
- **When:** 계산 완료
- **Then:** `recommendation.bestOption`이 TCO 기준 최적 옵션, `savingsVsPurchase` 산출

**Scenario 3: 미등록 모델 조회**
- **Given:** DB에 존재하지 않는 `robotModel`
- **When:** 계산 요청
- **Then:** `RAAS_020_MODEL_NOT_FOUND` 에러와 404 반환

**Scenario 4: 유효하지 않은 계약 기간**
- **Given:** `termMonths: 18` (허용 외 값)
- **When:** 유효성 검증
- **Then:** `"계약 기간은 12, 24, 36, 48, 60개월 중 선택해주세요"` 에러

## :gear: Technical & Non-Functional Constraints
- **구현:** Next.js Server Action — CON-12
- **계산 엔진:** `lib/domain/raas/calculate-tco.ts`에 순수 함수로 구현 (테스트 용이성)
- **성능:** 계산 응답 p95 ≤ 3초 — REQ-NF-003
- **인증:** 비로그인 사용자도 이용 가능 (공개 계산기)

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO 정의 완료
- [ ] `RaasComparisonResult` 3옵션 비교 구조 정의 완료
- [ ] TCO 계산 순수 함수 인터페이스 정의
- [ ] 에러 코드 및 HTTP 매핑 정의
- [ ] Zod 스키마 단위 테스트 통과
- [ ] ESLint / TypeScript 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-016 | `RAAS_PRICING` 테이블 (모델별 단가, 리스이율, RaaS구독료) | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| API-021 | RaaS 비교 결과 PDF 생성 — 본 DTO 결과 데이터 의존 |
| FC-020 | RaaS 옵션 계산 Command 로직 |
| TEST-020 | RaaS 계산기 단위 테스트 |
| UI-010 | RaaS 계산기 UI |
