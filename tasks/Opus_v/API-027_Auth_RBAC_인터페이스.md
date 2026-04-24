---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-027: Auth 도메인 — NextAuth.js/Supabase Auth 설정 및 RBAC 역할(buyer/si_partner/manufacturer/admin) 인터페이스 정의"
labels: 'feature, backend, api-contract, auth, priority:critical'
assignees: ''
---

## :dart: Summary
- 기능명: [API-027] NextAuth.js / Supabase Auth OAuth 2.0 설정 및 RBAC 역할 인터페이스 정의
- 목적: 플랫폼 전체 인증·인가 체계의 **기반 인터페이스**를 정의한다. NextAuth.js 또는 Supabase Auth 기반의 OAuth 2.0 인증 설정, 4종 RBAC 역할(`buyer` / `si_partner` / `manufacturer` / `admin`), 세션 DTO, 역할별 접근 제어 규칙을 확정한다. 모든 Server Action과 Route Handler의 인증·인가 검증이 이 인터페이스에 의존하는 최상위 인프라 태스크이다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-NF-016`](../../docs/06_SRS-v1.md) — 인증·인가, RBAC
- SRS: [`06_SRS-v1.md#CON-11`](../../docs/06_SRS-v1.md) — Next.js 기반 단일 프레임워크
- 데이터 모델: [`06_SRS-v1.md#6.2.1~4`](../../docs/06_SRS-v1.md) — BUYER, SI_PARTNER, MANUFACTURER 테이블
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-027`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: RBAC 역할 체계 정의
  ```typescript
  export enum UserRole {
    BUYER         = 'buyer',
    SI_PARTNER    = 'si_partner',
    MANUFACTURER  = 'manufacturer',
    ADMIN         = 'admin',
  }

  export const ROLE_HIERARCHY: Record<UserRole, number> = {
    [UserRole.BUYER]:        10,
    [UserRole.SI_PARTNER]:   10,
    [UserRole.MANUFACTURER]: 10,
    [UserRole.ADMIN]:        100,
  };
  ```

### 2단계: 세션 DTO 정의
  ```typescript
  export interface AuthSession {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      entityId: string;          // buyerCompanyId | siPartnerId | manufacturerId
      entityType: 'buyer_company' | 'si_partner' | 'manufacturer';
      mfaEnabled: boolean;
    };
    accessToken: string;
    expiresAt: string;
  }
  ```

### 3단계: 역할별 접근 제어 매트릭스
  ```typescript
  export const RBAC_MATRIX: Record<string, UserRole[]> = {
    // === Auth ===
    'signupBuyer':           [],  // 비인증
    'signupSiPartner':       [],  // 비인증

    // === Escrow (Admin 전용) ===
    'updateEscrowStatus':    [UserRole.ADMIN],
    'confirmRelease':        [UserRole.ADMIN],

    // === Escrow (Buyer) ===
    'createContract':        [UserRole.BUYER],
    'submitInspection':      [UserRole.BUYER],

    // === Escrow (Buyer/SI) ===
    'getEscrowStatus':       [UserRole.BUYER, UserRole.SI_PARTNER, UserRole.ADMIN],
    'createDispute':         [UserRole.BUYER],

    // === AS ===
    'createAsTicket':        [UserRole.BUYER],
    'assignEngineer':        [UserRole.ADMIN],
    'resolveTicket':         [UserRole.ADMIN],

    // === Badge ===
    'issueBadge':            [UserRole.MANUFACTURER],
    'revokeBadge':           [UserRole.MANUFACTURER],

    // === Partnership ===
    'sendPartnerProposal':   [UserRole.MANUFACTURER],
    'respondProposal':       [UserRole.SI_PARTNER],

    // === RaaS ===
    'calculateRaasOptions':  [],  // 비인증 허용
    'requestManualQuote':    [],  // 비인증 허용

    // === O2O ===
    'createO2oBooking':      [UserRole.BUYER],
    'submitVisitReport':     [UserRole.ADMIN],

    // === Notification ===
    'sendNotification':      [UserRole.ADMIN],
  };
  ```

### 4단계: 인증 미들웨어 인터페이스
  ```typescript
  export interface AuthGuardOptions {
    requiredRoles?: UserRole[];
    requireMfa?: boolean;
    allowUnauthenticated?: boolean;
  }

  export function withAuth(options: AuthGuardOptions) {
    // Server Action / Route Handler 래퍼 함수
    // 1. 세션 확인 (NextAuth getServerSession)
    // 2. 역할 검증 (RBAC_MATRIX 기반)
    // 3. MFA 검증 (Admin 금융 액션 시)
    // 4. 인증 실패 시 401/403 반환
  }
  ```

### 5단계: Auth Provider 설정 인터페이스
  ```typescript
  export interface AuthProviderConfig {
    provider: 'nextauth' | 'supabase';
    oauth: {
      google?: { clientId: string; clientSecret: string; };
      kakao?: { clientId: string; clientSecret: string; };
    };
    session: {
      strategy: 'jwt';
      maxAge: 24 * 60 * 60;      // 24시간
      updateAge: 60 * 60;        // 1시간마다 갱신
    };
    callbacks: {
      signIn: 'validateUserRole';
      jwt: 'attachRoleToToken';
      session: 'exposeRoleInSession';
    };
  }
  ```

### 6단계: 에러 코드
  ```typescript
  export enum AuthErrorCode {
    UNAUTHENTICATED    = 'AUTH_027_UNAUTHENTICATED',    // 401
    FORBIDDEN          = 'AUTH_027_FORBIDDEN',           // 403
    MFA_REQUIRED       = 'AUTH_027_MFA_REQUIRED',        // 403
    SESSION_EXPIRED    = 'AUTH_027_SESSION_EXPIRED',      // 401
    INVALID_TOKEN      = 'AUTH_027_INVALID_TOKEN',       // 401
    PROVIDER_ERROR     = 'AUTH_027_PROVIDER_ERROR',      // 502
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Buyer 역할로 Admin 전용 액션 접근**
- **Given:** Buyer 역할 사용자가 로그인
- **When:** `updateEscrowStatus` (Admin 전용) 호출
- **Then:** `AUTH_027_FORBIDDEN` 에러 403

**Scenario 2: 비인증 사용자가 RaaS 계산기 접근**
- **Given:** 비로그인 상태
- **When:** `calculateRaasOptions` 호출
- **Then:** 정상 실행 (비인증 허용)

**Scenario 3: Admin MFA 미활성 상태로 금융 액션 접근**
- **Given:** Admin 역할, MFA 미활성
- **When:** `confirmRelease` 호출
- **Then:** `AUTH_027_MFA_REQUIRED` 에러 403

**Scenario 4: 세션 만료 후 요청**
- **Given:** JWT 만료된 세션
- **When:** 인증 필요 액션 호출
- **Then:** `AUTH_027_SESSION_EXPIRED` 에러 401

## :gear: Technical & Non-Functional Constraints
- **인증:** NextAuth.js v5 (App Router 호환) 또는 Supabase Auth — CON-11
- **세션:** JWT 기반, 24시간 만료, 1시간 갱신
- **MFA:** Admin의 금융 관련 액션(에스크로 예치/방출) 시 TOTP MFA 필수 — REQ-NF-016
- **RBAC:** 역할은 회원가입 시 결정, Admin은 수동 부여
- **보안:** JWT에 role 포함, 서버 사이드에서 항상 재검증

## :checkered_flag: Definition of Done (DoD)
- [ ] `UserRole` ENUM 및 `ROLE_HIERARCHY` 정의 완료
- [ ] `AuthSession` 세션 DTO 정의 완료
- [ ] `RBAC_MATRIX` 역할별 접근 제어 매트릭스 정의 완료
- [ ] `withAuth` 미들웨어 인터페이스 시그니처 정의
- [ ] `AuthProviderConfig` 설정 인터페이스 정의
- [ ] 에러 코드 정의, ESLint 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-002 | `BUYER_COMPANY` 테이블 | 필수 |
| DB-003 | `SI_PARTNER` 테이블 | 필수 |
| DB-004 | `MANUFACTURER` 테이블 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| API-001~027 전체 | 모든 Server Action/Route Handler의 인증 검증 의존 |
| FC-001~027 전체 | 모든 Command/Query의 세션·역할 참조 |
| UI-001~015 전체 | 프론트엔드 세션·역할 기반 UI 분기 |
