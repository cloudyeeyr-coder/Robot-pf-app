---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-023: O2O 도메인 — O2O 파견 예약 (createO2oBooking) Server Action DTO, 가용 슬롯 조회 인터페이스 정의"
labels: 'feature, backend, api-contract, o2o, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [API-023] O2O 파견 예약 (`createO2oBooking`) Server Action DTO 및 가용 슬롯 조회 인터페이스 정의
- 목적: 수요기업이 현장 방문 상담을 예약하는 Server Action의 DTO, 가용 슬롯 조회 Server Component 인터페이스, 예약 상태 전이 규칙을 정의한다. Phase 2 대비 설계이며 MVP에서는 기본 예약 기능만 구현한다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-FUNC-024`](../../docs/06_SRS-v1.md) — O2O 현장 파견 예약
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #22, #23`](../../docs/06_SRS-v1.md)
- 데이터 모델: [`06_SRS-v1.md#6.2.9 O2O_BOOKING`](../../docs/06_SRS-v1.md)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-023`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO
- [ ] `CreateO2oBookingRequest` 정의 (`lib/contracts/o2o/create-booking.ts`)
  ```typescript
  export interface CreateO2oBookingRequest {
    buyerCompanyId: string;
    visitDate: string;           // 방문 희망일 (YYYY-MM-DD)
    region: string;              // 방문 지역 (시/도)
    preferredTimeSlot?: string;  // 희망 시간대 (선택: 'morning'|'afternoon')
    purpose?: string;            // 방문 목적 (선택, 최대 500자)
  }
  ```

### 2단계: Zod 스키마
  ```typescript
  export const createO2oBookingSchema = z.object({
    buyerCompanyId: z.string().min(1),
    visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식')
      .refine(d => new Date(d) > new Date(), '과거 날짜는 선택할 수 없습니다'),
    region: z.string().min(1, '방문 지역을 선택해주세요'),
    preferredTimeSlot: z.enum(['morning', 'afternoon']).optional(),
    purpose: z.string().max(500).optional(),
  });
  ```

### 3단계: 가용 슬롯 조회 인터페이스
  ```typescript
  export interface AvailableSlotQuery {
    region: string;
    month: string;               // YYYY-MM
  }

  export interface AvailableSlot {
    date: string;                // YYYY-MM-DD
    morningAvailable: boolean;
    afternoonAvailable: boolean;
    assignedManagerCount: number;
  }

  export interface AvailableSlotsResponse {
    success: true;
    data: { slots: AvailableSlot[]; region: string; month: string; };
  }
  ```

### 4단계: 예약 상태 전이
  ```typescript
  export enum BookingStatus {
    REQUESTED  = 'requested',
    CONFIRMED  = 'confirmed',
    COMPLETED  = 'completed',
    CANCELLED  = 'cancelled',
  }
  ```

### 5단계: Response DTO
  ```typescript
  export interface CreateO2oBookingSuccessResponse {
    success: true;
    data: {
      bookingId: string;
      status: 'requested';
      visitDate: string;
      region: string;
      createdAt: string;
      message: string;           // "예약이 접수되었습니다. 확정 알림을 보내드립니다."
    };
  }
  ```

### 6단계: 에러 코드
  ```typescript
  export enum CreateO2oBookingErrorCode {
    VALIDATION_ERROR   = 'O2O_023_VALIDATION',      // 400
    SLOT_UNAVAILABLE   = 'O2O_023_SLOT_UNAVAILABLE', // 409
    DUPLICATE_BOOKING  = 'O2O_023_DUPLICATE',        // 409
    BUYER_NOT_FOUND    = 'O2O_023_BUYER_NOT_FOUND',  // 404
    UNAUTHORIZED       = 'O2O_023_UNAUTHORIZED',     // 401
    INTERNAL_ERROR     = 'O2O_023_INTERNAL',         // 500
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 예약 접수**
- **Given:** 유효한 방문일·지역, 해당 슬롯 가용
- **When:** `createO2oBooking` 호출
- **Then:** O2O_BOOKING INSERT (status=requested), 운영팀 알림

**Scenario 2: 가용 슬롯 없는 날짜 예약**
- **Given:** 해당 일자 슬롯 가용 매니저 0명
- **When:** 예약 시도
- **Then:** `O2O_023_SLOT_UNAVAILABLE` 에러 409

**Scenario 3: 과거 날짜 예약**
- **Given:** `visitDate`가 어제 날짜
- **When:** 유효성 검증
- **Then:** `"과거 날짜는 선택할 수 없습니다"` 에러

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Action (예약) + Server Component (슬롯 조회)
- **성능:** 예약 p95 ≤ 300ms, 슬롯 조회 p95 ≤ 500ms
- **Phase 2 대비:** 자동 매니저 배정은 Phase 2 구현, MVP는 수동 배정

## :checkered_flag: Definition of Done (DoD)
- [ ] 예약 Request/Response DTO 정의 완료
- [ ] 가용 슬롯 조회 인터페이스 정의 완료
- [ ] `BookingStatus` 상태 전이 규칙 정의
- [ ] 에러 코드 정의, ESLint 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-010 | `O2O_BOOKING` 테이블 스키마 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| API-024 | 방문 보고서 등록 (예약 존재 전제) |
| FC-023 | O2O 예약 Command 로직 |
