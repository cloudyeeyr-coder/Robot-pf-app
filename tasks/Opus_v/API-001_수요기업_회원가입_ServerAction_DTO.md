---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-001: Auth 도메인 — 수요기업 회원가입 (signupBuyer) Server Action DTO, 유효성 규칙, 에러 코드 정의"
labels: 'feature, backend, api-contract, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-001] 수요기업 회원가입 (`signupBuyer`) Server Action DTO 및 유효성·에러 코드 정의
- 목적: 수요기업(Buyer) 회원가입 Server Action의 **Request/Response DTO 스키마**, **Zod 유효성 규칙**, **에러 코드 체계**를 확정하여 프론트엔드(UI-001)와 비즈니스 로직(FC-001) 간의 **단일 진실 공급원(SSOT)** 계약을 확립한다. 이 계약이 확정되어야 UI 개발과 서버 로직 개발이 병렬로 진행 가능하다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-027`](../../docs/06_SRS-v1.md) — 수요 기업 회원가입 및 온보딩 프로세스 요구사항
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #25`](../../docs/06_SRS-v1.md) — `action: signupBuyer` Server Action 정의
- 데이터 모델: [`06_SRS-v1.md#6.2.1 BUYER_COMPANY`](../../docs/06_SRS-v1.md) — 수요기업 테이블 스키마
- Use Case: [`06_SRS-v1.md#UC-01`](../../docs/06_SRS-v1.md) — 회원가입 및 온보딩
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-001`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO (입력 스키마) 정의
- [ ] `SignupBuyerRequest` 타입 정의 (`lib/contracts/auth/signup-buyer.ts`)
  ```typescript
  export interface SignupBuyerRequest {
    companyName: string;          // 회사명 (1~255자)
    bizRegistrationNo: string;    // 사업자등록번호 (XXX-XX-XXXXX)
    region: string;               // 소재 지역 (시/도 코드)
    segment: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // AOS-DOS 세그먼트
    contactName: string;          // 담당자 이름 (1~100자)
    contactEmail: string;         // 담당자 이메일
    contactPhone: string;         // 담당자 전화번호 (010-XXXX-XXXX)
  }
  ```
- [ ] 각 필드의 데이터 타입, 최소/최대 길이, 포맷 명시

### 2단계: Zod 유효성 스키마 정의
- [ ] `signupBuyerSchema` Zod 스키마 작성 (`lib/contracts/auth/signup-buyer.ts`)
  ```typescript
  import { z } from 'zod';

  export const signupBuyerSchema = z.object({
    companyName: z.string()
      .min(1, '회사명을 입력해주세요')
      .max(255, '회사명은 255자 이내로 입력해주세요'),
    bizRegistrationNo: z.string()
      .regex(/^\d{3}-\d{2}-\d{5}$/, '올바른 사업자등록번호 형식(XXX-XX-XXXXX)을 입력해주세요'),
    region: z.string()
      .min(1, '소재 지역을 선택해주세요'),
    segment: z.enum(['Q1', 'Q2', 'Q3', 'Q4'], {
      errorMap: () => ({ message: '유효한 세그먼트를 선택해주세요' })
    }),
    contactName: z.string()
      .min(1, '담당자 이름을 입력해주세요')
      .max(100, '담당자 이름은 100자 이내로 입력해주세요'),
    contactEmail: z.string()
      .email('올바른 이메일 형식을 입력해주세요'),
    contactPhone: z.string()
      .regex(/^01[016789]-\d{3,4}-\d{4}$/, '올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요'),
  });

  export type SignupBuyerRequest = z.infer<typeof signupBuyerSchema>;
  ```

### 3단계: Response DTO (출력 스키마) 정의
- [ ] 성공 응답 DTO 정의
  ```typescript
  export interface SignupBuyerSuccessResponse {
    success: true;
    data: {
      id: string;               // 생성된 BUYER_COMPANY PK (cuid)
      companyName: string;      // 등록된 회사명
      createdAt: string;        // ISO 8601 타임스탬프
    };
  }
  ```
- [ ] 실패 응답 DTO 정의
  ```typescript
  export interface SignupBuyerErrorResponse {
    success: false;
    error: {
      code: SignupBuyerErrorCode;
      message: string;
      details?: Record<string, string[]>; // 필드별 에러 메시지 맵
    };
  }
  ```

### 4단계: 에러 코드 체계 정의
- [ ] `SignupBuyerErrorCode` 열거형 정의
  ```typescript
  export enum SignupBuyerErrorCode {
    VALIDATION_ERROR = 'AUTH_001_VALIDATION',       // 입력값 유효성 검증 실패
    DUPLICATE_BIZ_NO = 'AUTH_001_DUPLICATE_BIZ_NO', // 사업자등록번호 중복 (409 Conflict)
    DUPLICATE_EMAIL  = 'AUTH_001_DUPLICATE_EMAIL',  // 이메일 중복
    INTERNAL_ERROR   = 'AUTH_001_INTERNAL',         // 서버 내부 오류 (500)
  }
  ```
- [ ] HTTP 상태 코드 매핑 테이블 작성:
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `AUTH_001_VALIDATION` | 400 | 필수 필드 누락 또는 포맷 오류 |
  | `AUTH_001_DUPLICATE_BIZ_NO` | 409 | 사업자등록번호 UNIQUE 제약 위반 |
  | `AUTH_001_DUPLICATE_EMAIL` | 409 | 이메일 중복 |
  | `AUTH_001_INTERNAL` | 500 | 예기치 않은 서버 오류 |

### 5단계: Server Action 인터페이스 정의
- [ ] Server Action 함수 시그니처 확정
  ```typescript
  // app/actions/auth/signup-buyer.ts
  'use server';

  export async function signupBuyer(
    prevState: SignupBuyerResponse | null,
    formData: FormData
  ): Promise<SignupBuyerResponse> {
    // 1. FormData → 객체 변환
    // 2. signupBuyerSchema.safeParse() 유효성 검증
    // 3. 사업자등록번호 중복 검사 (Prisma findUnique)
    // 4. BUYER_COMPANY INSERT (Prisma create)
    // 5. signup_complete 이벤트 로깅 (EVENT_LOG INSERT)
    // 6. 성공/실패 응답 반환
  }

  export type SignupBuyerResponse =
    | SignupBuyerSuccessResponse
    | SignupBuyerErrorResponse;
  ```

### 6단계: 단위 테스트 및 문서화
- [ ] Zod 스키마 단위 테스트 작성 (`__tests__/contracts/auth/signup-buyer.test.ts`)
  - 유효 입력 7건 이상: 정상 케이스, 경계값 (1자 회사명, 255자 회사명 등)
  - 무효 입력 7건 이상: 빈 회사명, 잘못된 사업자번호 포맷, 유효하지 않은 세그먼트 등
- [ ] DTO 타입 및 에러 코드를 API 문서(README 또는 Swagger 주석)에 반영

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 유효한 입력에 대한 DTO 유효성 검증 통과**
- **Given:** 모든 필수 필드가 정상 포맷으로 채워진 `SignupBuyerRequest` 객체가 주어짐 (`companyName: "테스트기업"`, `bizRegistrationNo: "123-45-67890"`, `region: "서울"`, `segment: "Q1"`, `contactName: "홍길동"`, `contactEmail: "test@example.com"`, `contactPhone: "010-1234-5678"`)
- **When:** `signupBuyerSchema.safeParse(input)`를 실행함
- **Then:** `success: true`를 반환하고, 파싱된 데이터가 입력과 일치함

**Scenario 2: 사업자등록번호 포맷 오류 시 유효성 에러**
- **Given:** `bizRegistrationNo`가 `"12345"` (잘못된 포맷)인 입력이 주어짐
- **When:** `signupBuyerSchema.safeParse(input)`를 실행함
- **Then:** `success: false`를 반환하고, `bizRegistrationNo` 필드에 대한 에러 메시지 `"올바른 사업자등록번호 형식(XXX-XX-XXXXX)을 입력해주세요"`가 포함됨

**Scenario 3: 필수 필드 누락 시 에러 코드 반환**
- **Given:** `companyName`이 빈 문자열(`""`)인 입력이 주어짐
- **When:** Server Action이 유효성 검증을 수행함
- **Then:** `AUTH_001_VALIDATION` 에러 코드와 400 상태, `companyName` 필드의 에러 메시지가 `details`에 포함됨

**Scenario 4: 중복 사업자등록번호로 가입 시도**
- **Given:** DB에 `bizRegistrationNo: "123-45-67890"`인 수요기업이 이미 존재함
- **When:** 동일 사업자등록번호로 `signupBuyer` Server Action을 호출함
- **Then:** `AUTH_001_DUPLICATE_BIZ_NO` 에러 코드와 409 Conflict 상태, `"이미 가입된 사업자등록번호입니다"` 메시지가 반환됨

**Scenario 5: 성공 응답 DTO 구조 검증**
- **Given:** 유효한 입력으로 `signupBuyer` Server Action이 성공적으로 실행됨
- **When:** 응답 객체를 검사함
- **Then:** `success: true`, `data.id` (cuid 형식), `data.companyName`, `data.createdAt` (ISO 8601)이 포함됨

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Server Action (`'use server'` 디렉티브) — CON-12 준수
- **유효성 검증:** Zod 스키마 기반 (서버/클라이언트 공유 가능)
- **DTO 위치:** `lib/contracts/auth/` — 도메인별 모듈 분리 컨벤션 (CON-11)

### 성능
- Zod 유효성 검증 소요 ≤ 10ms (서버 사이드)
- Server Action 전체 응답 p95 ≤ 300ms (DB INSERT 포함)

### 보안
- 사업자등록번호, 이메일, 전화번호는 에러 응답 시 마스킹 처리 금지 (유효성 에러 메시지만 반환, 기존 값 미포함)
- Server Action 호출 시 Next.js 기본 CSRF 보호 활용
- 요청 페이로드 서버 로깅 시 `contactPhone`, `contactEmail` 마스킹 필수

### 호환성
- Zod 스키마는 프론트엔드(UI-001)의 `react-hook-form` + `@hookform/resolvers/zod`와 동일 스키마를 공유하여 클라이언트/서버 유효성 검증 일원화
- `SignupBuyerRequest` 타입은 `BUYER_COMPANY` Prisma 모델(`DB-002`)과 필드명을 camelCase로 1:1 매핑

## :checkered_flag: Definition of Done (DoD)
- [ ] `SignupBuyerRequest`, `SignupBuyerSuccessResponse`, `SignupBuyerErrorResponse` 타입이 `lib/contracts/auth/signup-buyer.ts`에 정의되었는가?
- [ ] `signupBuyerSchema` Zod 스키마가 모든 필드에 대해 유효성 규칙을 포함하는가?
- [ ] `SignupBuyerErrorCode` 열거형 및 HTTP 상태 코드 매핑이 정의되었는가?
- [ ] Zod 스키마 단위 테스트가 작성되고 통과하는가? (유효 7건 + 무효 7건 이상)
- [ ] ESLint / TypeScript 컴파일 경고가 0건인가?
- [ ] DTO 및 에러 코드 명세가 문서화되었는가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-002 | `BUYER_COMPANY` 테이블 스키마 및 마이그레이션 | 필수 (Prisma 모델 기반 DTO 필드 정의) |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FC-001 | 수요기업 회원가입 Command 로직 — 본 DTO를 Server Action 입출력으로 사용 |
| UI-001 | 수요기업 회원가입 페이지 — Zod 스키마 공유, 에러 코드 기반 에러 핸들링 |
| TEST-026 | 수요기업 회원가입 GWT 테스트 — DTO 기반 테스트 케이스 |

### 참고사항
- DB-002 Prisma 모델이 미완료 시, SRS 6.2.1 BUYER_COMPANY 스키마 기반으로 DTO를 선행 정의 가능
- `signup_complete` 이벤트 로깅은 FC-001에서 구현하며, 본 태스크에서는 이벤트 발행 인터페이스만 명시
