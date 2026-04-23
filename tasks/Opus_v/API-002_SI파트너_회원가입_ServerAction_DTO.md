---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-002: Auth 도메인 — SI 파트너 회원가입 (signupSiPartner) Server Action DTO, Admin 검토 대기 상태 전환 규칙 정의"
labels: 'feature, backend, api-contract, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-002] SI 파트너 회원가입 (`signupSiPartner`) Server Action DTO 및 Admin 검토 대기 상태 전환 규칙 정의
- 목적: SI 파트너(System Integrator) 회원가입 Server Action의 **Request/Response DTO 스키마**, **Zod 유효성 규칙**, **Admin 검토 대기 상태 전환 규칙**, **에러 코드 체계**를 확정한다. SI 파트너는 수요기업과 달리 가입 즉시 활성화되지 않고 **Admin 검토 대기(pending_review)** 상태를 거쳐야 하므로, 상태 전환 규칙이 DTO 계약에 포함된다. 이 계약이 확정되어야 UI-002(SI 가입 페이지)와 FC-002(비즈니스 로직)가 병렬 개발 가능하다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-028`](../../docs/06_SRS-v1.md) — SI 파트너 회원가입 및 프로필 등록 프로세스
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #26`](../../docs/06_SRS-v1.md) — `action: signupSiPartner` Server Action 정의
- 데이터 모델 (SI_PARTNER): [`06_SRS-v1.md#6.2.2`](../../docs/06_SRS-v1.md) — SI 파트너 테이블 스키마
- 데이터 모델 (SI_PROFILE): [`06_SRS-v1.md#6.2.8`](../../docs/06_SRS-v1.md) — SI 프로필 테이블 스키마
- Use Case: [`06_SRS-v1.md#UC-01`](../../docs/06_SRS-v1.md) — 회원가입 및 온보딩
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-002`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO (입력 스키마) 정의
- [ ] `SignupSiPartnerRequest` 타입 정의 (`lib/contracts/auth/signup-si-partner.ts`)
  ```typescript
  export interface SignupSiPartnerRequest {
    // === SI_PARTNER 기본 정보 ===
    companyName: string;          // 회사명 (1~255자)
    bizRegistrationNo: string;    // 사업자등록번호 (XXX-XX-XXXXX)
    region: string;               // 주요 활동 지역 (시/도 코드)
    contactName: string;          // 담당자 이름 (1~100자)
    contactEmail: string;         // 담당자 이메일
    contactPhone: string;         // 담당자 전화번호 (010-XXXX-XXXX)

    // === SI_PROFILE 추가 정보 ===
    capabilityTags: string[];     // 역량 태그 배열 (최소 1개, 최대 20개)
    completedProjects: number;    // 완료 프로젝트 수 (≥ 0)
    companyDescription?: string;  // 회사 소개 (선택, 최대 2000자)
  }
  ```

### 2단계: Zod 유효성 스키마 정의
- [ ] `signupSiPartnerSchema` Zod 스키마 작성
  ```typescript
  import { z } from 'zod';

  export const signupSiPartnerSchema = z.object({
    companyName: z.string()
      .min(1, '회사명을 입력해주세요')
      .max(255, '회사명은 255자 이내로 입력해주세요'),
    bizRegistrationNo: z.string()
      .regex(/^\d{3}-\d{2}-\d{5}$/, '올바른 사업자등록번호 형식(XXX-XX-XXXXX)을 입력해주세요'),
    region: z.string()
      .min(1, '주요 활동 지역을 선택해주세요'),
    contactName: z.string()
      .min(1, '담당자 이름을 입력해주세요')
      .max(100, '담당자 이름은 100자 이내로 입력해주세요'),
    contactEmail: z.string()
      .email('올바른 이메일 형식을 입력해주세요'),
    contactPhone: z.string()
      .regex(/^01[016789]-\d{3,4}-\d{4}$/, '올바른 전화번호 형식을 입력해주세요'),
    capabilityTags: z.array(z.string().min(1))
      .min(1, '최소 1개의 역량 태그를 선택해주세요')
      .max(20, '역량 태그는 최대 20개까지 선택 가능합니다'),
    completedProjects: z.number()
      .int('정수를 입력해주세요')
      .min(0, '완료 프로젝트 수는 0 이상이어야 합니다'),
    companyDescription: z.string()
      .max(2000, '회사 소개는 2000자 이내로 입력해주세요')
      .optional(),
  });

  export type SignupSiPartnerRequest = z.infer<typeof signupSiPartnerSchema>;
  ```

### 3단계: Response DTO 정의
- [ ] 성공 응답 DTO
  ```typescript
  export interface SignupSiPartnerSuccessResponse {
    success: true;
    data: {
      siPartnerId: string;         // 생성된 SI_PARTNER PK (cuid)
      siProfileId: string;         // 생성된 SI_PROFILE PK (cuid)
      companyName: string;
      reviewStatus: 'pending_review'; // 초기 상태: Admin 검토 대기
      createdAt: string;           // ISO 8601
    };
  }
  ```
- [ ] 실패 응답 DTO
  ```typescript
  export interface SignupSiPartnerErrorResponse {
    success: false;
    error: {
      code: SignupSiPartnerErrorCode;
      message: string;
      details?: Record<string, string[]>;
    };
  }
  ```

### 4단계: Admin 검토 대기 상태 전환 규칙 정의
- [ ] SI 파트너 가입 시 상태 전환 규칙 문서화
  ```
  [가입 요청 제출] → SI_PARTNER.status = 'pending_review'
                   → SI_PROFILE 동시 생성 (capabilityTags, completedProjects)
                   → Admin 알림 발송 (내부 알림함 + 이메일)
  
  [Admin 승인]    → SI_PARTNER.status = 'active'
                   → SI 검색 노출 활성화
                   → SI에게 승인 알림 발송
  
  [Admin 거절]    → SI_PARTNER.status = 'rejected'
                   → SI에게 거절 사유 알림 발송
  ```
- [ ] `SiPartnerReviewStatus` 열거형 정의
  ```typescript
  export enum SiPartnerReviewStatus {
    PENDING_REVIEW = 'pending_review',
    ACTIVE = 'active',
    REJECTED = 'rejected',
    SUSPENDED = 'suspended',
  }
  ```

### 5단계: 에러 코드 체계 정의
- [ ] `SignupSiPartnerErrorCode` 열거형 정의
  ```typescript
  export enum SignupSiPartnerErrorCode {
    VALIDATION_ERROR    = 'AUTH_002_VALIDATION',
    DUPLICATE_BIZ_NO    = 'AUTH_002_DUPLICATE_BIZ_NO',
    DUPLICATE_EMAIL     = 'AUTH_002_DUPLICATE_EMAIL',
    INVALID_CAPABILITY  = 'AUTH_002_INVALID_CAPABILITY',
    INTERNAL_ERROR      = 'AUTH_002_INTERNAL',
  }
  ```
- [ ] HTTP 상태 코드 매핑:
  | 에러 코드 | HTTP Status | 설명 |
  |:---|:---:|:---|
  | `AUTH_002_VALIDATION` | 400 | 필수 필드 누락 또는 포맷 오류 |
  | `AUTH_002_DUPLICATE_BIZ_NO` | 409 | 사업자등록번호 중복 |
  | `AUTH_002_DUPLICATE_EMAIL` | 409 | 이메일 중복 |
  | `AUTH_002_INVALID_CAPABILITY` | 400 | 유효하지 않은 역량 태그 |
  | `AUTH_002_INTERNAL` | 500 | 서버 내부 오류 |

### 6단계: Server Action 인터페이스 정의 및 테스트
- [ ] Server Action 함수 시그니처 확정
  ```typescript
  'use server';
  export async function signupSiPartner(
    prevState: SignupSiPartnerResponse | null,
    formData: FormData
  ): Promise<SignupSiPartnerResponse> {
    // 1. FormData → 객체 변환 (capabilityTags: JSON parse)
    // 2. signupSiPartnerSchema.safeParse() 유효성 검증
    // 3. 사업자등록번호/이메일 중복 검사
    // 4. Prisma 트랜잭션: SI_PARTNER INSERT + SI_PROFILE INSERT
    // 5. Admin 알림 발송 (내부 알림함)
    // 6. 성공/실패 응답 반환
  }
  ```
- [ ] Zod 스키마 단위 테스트 작성 (유효 7건 + 무효 8건 이상)
  - capabilityTags 빈 배열, 21개 초과, 유효 1개~20개
  - completedProjects 음수, 소수점, 0, 양수 정수

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 유효한 SI 파트너 가입 입력에 대한 DTO 검증 통과**
- **Given:** 모든 필수 필드가 정상 포맷으로 채워진 `SignupSiPartnerRequest` 객체가 주어짐
- **When:** `signupSiPartnerSchema.safeParse(input)`를 실행함
- **Then:** `success: true`를 반환하고, 파싱된 데이터가 입력과 일치함

**Scenario 2: 역량 태그 미선택 시 유효성 에러**
- **Given:** `capabilityTags`가 빈 배열(`[]`)인 입력이 주어짐
- **When:** `signupSiPartnerSchema.safeParse(input)`를 실행함
- **Then:** `success: false`, `capabilityTags` 필드에 `"최소 1개의 역량 태그를 선택해주세요"` 에러 메시지 포함

**Scenario 3: 가입 성공 시 Admin 검토 대기 상태 응답**
- **Given:** 유효한 입력으로 `signupSiPartner` Server Action이 성공적으로 실행됨
- **When:** 응답 객체를 검사함
- **Then:** `success: true`, `data.reviewStatus`가 `'pending_review'`, `data.siPartnerId`와 `data.siProfileId`가 cuid 형식

**Scenario 4: 중복 사업자등록번호로 SI 가입 시도**
- **Given:** DB에 동일 사업자등록번호를 가진 SI 파트너가 이미 존재함
- **When:** 해당 사업자등록번호로 `signupSiPartner`를 호출함
- **Then:** `AUTH_002_DUPLICATE_BIZ_NO` 에러 코드와 409 상태 반환

**Scenario 5: SI 파트너 + SI 프로필 동시 생성 트랜잭션 명세**
- **Given:** 유효한 가입 요청이 주어짐
- **When:** Server Action이 DB 쓰기를 수행함
- **Then:** `SI_PARTNER`와 `SI_PROFILE`이 단일 Prisma 트랜잭션 내에서 동시 생성되며, 하나라도 실패 시 전체 롤백됨

## :gear: Technical & Non-Functional Constraints

### 아키텍처
- **구현 방식:** Next.js Server Action (`'use server'`) — CON-12 준수
- **유효성 검증:** Zod 스키마 기반 (클라이언트/서버 공유)
- **DTO 위치:** `lib/contracts/auth/signup-si-partner.ts`
- **트랜잭션:** SI_PARTNER + SI_PROFILE 동시 생성 시 Prisma `$transaction` 사용 필수

### 성능
- Server Action 전체 응답 p95 ≤ 500ms (2개 테이블 동시 INSERT 포함)

### 보안
- 서버 로깅 시 `contactPhone`, `contactEmail` 마스킹 필수
- CSRF 보호: Server Action 기본 메커니즘 활용

## :checkered_flag: Definition of Done (DoD)
- [ ] `SignupSiPartnerRequest`, `SignupSiPartnerSuccessResponse`, `SignupSiPartnerErrorResponse` 타입이 정의되었는가?
- [ ] `signupSiPartnerSchema` Zod 스키마가 모든 필드에 대해 유효성 규칙을 포함하는가?
- [ ] `SiPartnerReviewStatus` 열거형 및 상태 전환 규칙이 문서화되었는가?
- [ ] `SignupSiPartnerErrorCode` 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] Zod 스키마 단위 테스트가 작성되고 통과하는가? (유효 7건 + 무효 8건 이상)
- [ ] ESLint / TypeScript 컴파일 경고가 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-003 | `SI_PARTNER` 테이블 스키마 및 마이그레이션 | 필수 |
| DB-009 | `SI_PROFILE` 테이블 스키마 및 마이그레이션 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| FC-002 | SI 파트너 회원가입 Command 로직 — 본 DTO를 Server Action 입출력으로 사용 |
| UI-002 | SI 파트너 회원가입 페이지 — Zod 스키마 공유, 에러 코드 기반 핸들링 |
| TEST-027 | SI 파트너 회원가입 GWT 테스트 |

### 참고사항
- `capabilityTags`는 SRS 6.2.8에서 `TEXT[]`로 정의되어 있으나, SQLite 호환을 위해 Prisma `Json` 타입으로 대체 (ORM 매핑 노트 참조)
- Admin 승인/거절 워크플로우의 상세 구현은 별도 태스크(Admin 포털)에서 처리하며, 본 태스크에서는 상태 전환 규칙만 정의
