---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-014: NOTIFICATION 테이블 스키마 및 마이그레이션 (내장 웹 알림함: 수신자, 유형, 채널, 읽음 여부)"
labels: 'feature, backend, db, notification, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-014] `NOTIFICATION` (내장 웹 알림함) 테이블 스키마 및 마이그레이션 작성
- 목적: **외부 알림 채널(카카오 알림톡 + SMS) 장애 시 우회 처리 인프라**(SRS 3.1 EXT-03/EXT-04). 주요 알림(결제 완료, 검수 요청, 방문 일정, 뱃지 만료 등)을 **플랫폼 내장 웹 알림함**에 DB 기반으로 저장하여, 카카오/SMS 실패 시 사용자가 로그인하여 놓친 알림을 확인 가능하게 한다. 동시에 **발송 채널 이력(`channel`)과 발송 결과(`sent_status`)를 기록**하여 카카오/SMS/이메일 3중 체인(FC-023)의 운영 감사 자료로 활용한다. 사용자별 `is_read` 플래그로 읽음 처리를 관리하며, UI-014(알림함 UI)의 데이터 소스가 된다. **SRS 6.2에 엔티티 정의가 없는 보완 엔티티** — 07_TASK-LIST-v1.md 참고 사항 및 SRS 3.1 EXT-03/04에 근거한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#3.1 EXT-03, EXT-04`](../06_SRS-v1.md) — "카카오톡 및 외부 SMS 발송망 장애 시 주요 알림은 플랫폼 내장 웹 알림함(DB 기반) 및 SMTP 비동기 이메일로 우회 처리"
- **SRS 보완 근거:** 07_TASK-LIST-v1.md 참고 사항 — "NOTIFICATION (DB-014): 외부 알림 장애 시 내장 웹 알림함(3.1)에서 요구됨"
- 연동 기능: REQ-FUNC-006 (보증서 발급 알림), REQ-FUNC-007 (AS 배정 알림), REQ-FUNC-013 (뱃지 발급 알림), REQ-FUNC-016 (뱃지 만료 D-7 알림), REQ-FUNC-024 (O2O 예약 확정 이중 알림), REQ-FUNC-030 (파트너 제안 알림)
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-014`](../TASKS/07_TASK-LIST-v1.md)
- 연동 API: `API-025` (POST /api/notifications/send)
- 연동 로직: `FC-023` (발송 체인 — 카카오 → SMS → 이메일), `FC-024` (내장 웹 알림함 생성·읽음 처리·목록 조회)
- 연동 UI: `UI-014` (알림함 UI — 실시간 업데이트)
- 선행 태스크: `DB-001` (Prisma ORM 초기 설정)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 수신자 역할 및 알림 유형 ENUM 정의
- [ ] `RecipientRole` enum (수신자 분류 — API-027 RBAC 역할과 일치):
  ```prisma
  enum RecipientRole {
    buyer
    si_partner
    manufacturer
    admin
  }
  ```
- [ ] `NotificationType` enum (알림 유형 — 기능별 카테고리):
  ```prisma
  enum NotificationType {
    // F-01 에스크로
    escrow_deposit_confirmed     // 예치 완료 안내
    escrow_released              // 방출 완료 안내
    inspection_request           // 검수 요청
    dispute_initiated            // 분쟁 개시 알림

    // F-02 AS/보증
    warranty_issued              // 보증서 발급
    as_ticket_assigned           // AS 엔지니어 배정
    as_ticket_resolved           // AS 완료

    // F-04 뱃지/파트너십
    badge_issued                 // 뱃지 발급
    badge_expiring_soon          // 뱃지 만료 D-7
    badge_revoked                // 뱃지 철회
    partner_proposal_received    // SI가 제안 수신
    partner_proposal_reminder    // D+3 리마인더
    partner_proposal_accepted    // 제조사가 수락 통보 수신
    partner_proposal_expired     // D+5 만료 (제조사)

    // F-05 견적
    quote_lead_received          // Admin 수신
    quote_response_ready         // 견적 응답 완료

    // F-06 O2O (Phase 2)
    o2o_booking_confirmed
    o2o_visit_report_ready

    // 공통/Ops
    system_alert                 // 운영 공지
    other                        // 기타 (최소 1개 fallback)
  }
  ```
- [ ] `NotificationChannel` enum (발송 채널):
  ```prisma
  enum NotificationChannel {
    kakao         // 카카오 알림톡 (1차)
    sms           // SMS (Fallback)
    email         // SMTP 이메일 (2차 Fallback)
    internal      // 내장 웹 알림함 전용 (항상 INSERT)
  }
  ```
- [ ] `NotificationSentStatus` enum:
  ```prisma
  enum NotificationSentStatus {
    pending       // 발송 대기
    sent          // 발송 성공
    failed        // 발송 실패
    fallback_used // 주 채널 실패로 Fallback 채널 사용됨
  }
  ```

### 2단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `Notification` 모델:
  ```prisma
  model Notification {
    id              String                  @id @default(cuid())
    recipientId     String                                        // 수신자 ID (BuyerCompany/SiPartner/Manufacturer/Admin User의 ID)
    recipientRole   RecipientRole                                 // 수신자 역할 (recipientId 해석 기준)
    type            NotificationType
    title           String                  @db.VarChar(255)
    body            String                  @db.Text
    payload         Json?                                         // 추가 컨텍스트 (예: contractId, badgeId 등 딥링크용)
    channel         NotificationChannel
    sentStatus      NotificationSentStatus  @default(pending)
    sentAt          DateTime?
    failureReason   String?                 @db.Text
    isRead          Boolean                 @default(false)       // 내장 웹 알림함 읽음 여부
    readAt          DateTime?
    createdAt       DateTime                @default(now())

    @@index([recipientId, recipientRole, isRead])                 // UI-014 핵심 쿼리: "내 미읽음 알림"
    @@index([recipientId, recipientRole, createdAt(sort: Desc)])  // 전체 알림 목록 최신순
    @@index([sentStatus, createdAt])                              // 발송 실패 감지 운영 쿼리
    @@index([type, createdAt])                                    // 유형별 집계 (KPI/감사)
    @@map("notification")
  }
  ```
- [ ] **FK 미설정 이유:** `recipientId`는 4개 역할 테이블(BuyerCompany/SiPartner/Manufacturer/Admin)을 polymorphic하게 참조 — Prisma는 polymorphic FK를 네이티브 지원하지 않음. `recipientRole`로 구분하는 관례적 패턴 채택. 대신 **FC-024에서 INSERT 전 해당 recipientId 존재 검증** 필수
- [ ] **Polymorphic 결정 대안:** 4개 역할 각각의 FK 컬럼(`buyerCompanyId String?`, `siPartnerId String?`, ...)을 모두 두는 방식도 가능하나, NULL 관리 복잡성 대비 이점이 크지 않아 **단일 `recipientId + recipientRole` 패턴 채택**

### 3단계: 인덱스 전략
- [ ] `[recipientId, recipientRole, isRead]` — **UI-014 핵심 쿼리**: 사용자별 미읽음 알림 목록, 배지 카운트
- [ ] `[recipientId, recipientRole, createdAt DESC]` — 전체 알림 목록 최신순 페이지네이션
- [ ] `[sentStatus, createdAt]` — 운영 팀이 발송 실패 추적
- [ ] `[type, createdAt]` — 알림 유형별 집계 (예: 지난 30일 뱃지 만료 알림 발송 건수)

### 4단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_notification` 실행, SQL 검토:
  - 4개 ENUM 타입 생성
  - `payload JSONB` (PostgreSQL) / TEXT (SQLite)
  - `is_read BOOLEAN DEFAULT FALSE`, `sent_status ... DEFAULT 'pending'`
  - FK 없음 (polymorphic)
  - 4개 인덱스 생성 확인
- [ ] `pnpm prisma generate` → 4개 ENUM 타입 + `Notification` 타입 export 확인

### 5단계: TypeScript 타입 유틸 (`/lib/types/notification.ts`)
- [ ] Payload 구조 정의 (type별 분기):
  ```ts
  export type NotificationPayload =
    | { type: 'escrow_deposit_confirmed'; contractId: string; amount: number }
    | { type: 'badge_expiring_soon'; badgeId: string; daysUntilExpiry: number }
    | { type: 'partner_proposal_received'; proposalId: string; manufacturerName: string }
    | { type: 'other'; [key: string]: unknown }
    // ... 전체 NotificationType enum 별로 매핑

  // 런타임 검증은 type 별 개별 Zod 스키마로 (FC-024에서 활용)
  ```
- [ ] DTO:
  ```ts
  import type { Notification as PrismaNotification } from '@prisma/client'
  export type Notification = PrismaNotification

  // UI-014 알림함 표시용
  export type NotificationListItem = Pick<
    Notification,
    'id' | 'type' | 'title' | 'body' | 'payload' | 'isRead' | 'createdAt'
  >
  ```

### 6단계: 발송 전략 유틸 (`/lib/notification/delivery-strategy.ts`)
- [ ] 발송 체인 문서화 (FC-023 참조):
  ```ts
  // 발송 우선순위 결정 유틸 (FC-023에서 활용)
  export function getDeliveryChain(type: NotificationType): NotificationChannel[] {
    // 기본: 카카오 → SMS → 이메일
    // 예외: 'other'는 internal만 / 'system_alert'는 email만 등
    // internal은 항상 모든 알림에 대해 INSERT (웹 알림함 보존)
  }
  ```
- [ ] **핵심 원칙:** **모든 알림은 반드시 `channel='internal'` 레코드를 1건 INSERT** (외부 채널 실패와 무관하게 웹 알림함에 항상 표시)

### 7단계: 간이 Integration 검증 및 문서
- [ ] `scripts/verify-notification-schema.ts` (PR 머지 전 제거):
  - 정상 INSERT (recipientRole='buyer', type='escrow_deposit_confirmed', channel='internal') → 성공
  - 동일 recipientId에 대해 4개 채널(카카오/SMS/이메일/internal) 4건 INSERT → 성공
  - 읽음 처리 UPDATE (isRead=true, readAt=now) → 성공
  - UI-014 쿼리 시뮬레이션 `WHERE recipient_id=? AND recipient_role=? AND is_read=false` → 인덱스 활용 확인
  - sentStatus 필터 운영 쿼리 `WHERE sent_status='failed'` → 인덱스 활용
- [ ] `/docs/erd.md` 반영 (Polymorphic 표기)
- [ ] `/docs/notification-delivery-chain.md` — 카카오 → SMS → 이메일 + internal 항상 INSERT 규칙
- [ ] `/docs/notification-polymorphic-pattern.md` — recipientId + recipientRole 패턴 근거 및 무결성 검증 방식

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 내장 웹 알림 정상 생성**
- **Given:** BuyerCompany B1 존재
- **When:** `prisma.notification.create({ data: { recipientId: 'B1', recipientRole: 'buyer', type: 'escrow_deposit_confirmed', title: '예치가 완료되었습니다', body: '...', channel: 'internal', payload: { contractId: 'C1', amount: 10000000 } } })`
- **Then:** 생성 성공, `sentStatus=pending`, `isRead=false` 초기값.

**Scenario 2: 외부 채널 발송 성공 기록**
- **Given:** 카카오 알림톡 발송 성공
- **When:** `prisma.notification.create({ data: { ..., channel: 'kakao', sentStatus: 'sent', sentAt: new Date() } })`
- **Then:** 레코드 생성 + 발송 이력 기록.

**Scenario 3: 외부 채널 실패 + Fallback 기록**
- **Given:** 카카오 발송 실패 → SMS 재시도
- **When:** 카카오 실패 레코드(sentStatus='failed', failureReason='network timeout') + SMS 성공 레코드(sentStatus='fallback_used')를 각각 INSERT
- **Then:** 두 레코드 모두 저장, 운영팀이 채널별 실패율 추적 가능.

**Scenario 4: 사용자 읽음 처리 (FC-024)**
- **Given:** Notification (isRead=false)
- **When:** `prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } })`
- **Then:** isRead=true, readAt 기록.

**Scenario 5: UI-014 미읽음 배지 카운트 쿼리 성능**
- **Given:** 사용자 B1의 Notification 500건 (500건 중 10건 internal+unread)
- **When:** `prisma.notification.count({ where: { recipientId: 'B1', recipientRole: 'buyer', isRead: false, channel: 'internal' } })`
- **Then:** `[recipientId, recipientRole, isRead]` 인덱스 활용 p95 ≤ 100ms.

**Scenario 6: Polymorphic 무결성 (FC-024 책임)**
- **Given:** recipientId='nonexistent-id', recipientRole='buyer'
- **When:** 스키마 레벨 INSERT는 허용됨 (FK 없음)
- **Then:** **FC-024 구현 시 BuyerCompany 존재 확인 후 INSERT** — 이 검증 누락 시 고아 알림 발생 리스크

**Scenario 7: payload JSON 타입 안전성**
- **Given:** `type: 'badge_expiring_soon'`, `payload: { badgeId: 'B1', daysUntilExpiry: 7 }`
- **When:** 저장 후 조회
- **Then:** Prisma Json 반환 → type별 Zod 파싱으로 타입 안전성 확보.

**Scenario 8: 운영 모니터링 쿼리 (sentStatus=failed)**
- **Given:** 1000건의 Notification 중 10건 failed
- **When:** `prisma.notification.findMany({ where: { sentStatus: 'failed', createdAt: { gte: now - 1h } } })`
- **Then:** `[sentStatus, createdAt]` 인덱스 활용 p95 ≤ 200ms.

**Scenario 9: 유형별 집계 (KPI)**
- **When:** `groupBy({ by: ['type'], _count: true, where: { createdAt: { gte: monthStart } } })`
- **Then:** `[type, createdAt]` 인덱스 활용, 월별 유형별 발송 건수 집계 가능.

**Scenario 10: 인덱스 검증**
- **When:** `\d notification`
- **Then:** PK + 4개 인덱스 존재.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **SRS 보완 엔티티:** SRS 3.1 EXT-03/04 기반 + 07_TASK-LIST-v1.md 참고 사항
- **Polymorphic 패턴 (`recipientId + recipientRole`):** 4개 역할 테이블을 단일 FK로 처리 불가하여 채택. 무결성은 FC-024에서 강제
- **발송 이력 분리:** 각 채널별로 별도 레코드 INSERT (카카오 성공/실패 + SMS 성공/실패 + internal 항상 1건) — 운영 감사 추적성 확보

### 성능
- UI-014 미읽음 카운트 p95 ≤ 100ms
- 발송 실패 모니터링 p95 ≤ 200ms
- 예상 규모: 사용자당 월 20건 × MVP+6개월 500명 = **월 10,000건** → 연 12만건. `createdAt` 기반 파티셔닝은 Phase 2 검토

### 안정성
- **핵심 원칙:** **모든 알림은 `channel='internal'` 레코드가 반드시 INSERT되어야 함** — 외부 채널 실패와 무관하게 웹 알림함 노출 보장
- Polymorphic 무결성은 FC-024에서 recipientId 존재 검증
- `payload` JSON은 type별 Zod 스키마로 런타임 검증

### 보안 (PII)
- `title`, `body`에 개인정보 직접 포함 지양 — 추상적 메시지 + 딥링크 패턴 권장 (예: "예치가 완료되었습니다. 상세 확인 →")
- 수신자 본인만 접근 가능 (FC-024에서 recipientId 필터 필수)
- 보존기간: 1년 (REQ-NF-013 로그 정책 준용) — CRON으로 오래된 알림 삭제 (Phase 2)

### 비용 (REQ-NF-020)
- 카카오 알림톡 건당 10원, SMS 건당 ≤ 20원 — 본 테이블이 비용 집계 근거
- internal 채널은 비용 0 — Fallback 활성화 시 운영 비용 증가 체크

### 유지보수성
- NotificationType enum은 **가장 자주 변경되는 ENUM** — 신규 알림 유형 추가 시 마이그레이션 필수. `other` 값을 fallback으로 유지하여 하위 호환성 확보
- 대량 발송 시 배치 INSERT 활용 (FC-023)

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 AC 충족?
- [ ] 4개 ENUM(`RecipientRole`, `NotificationType`, `NotificationChannel`, `NotificationSentStatus`) 정의?
- [ ] Polymorphic 패턴(`recipientId + recipientRole`) 적용?
- [ ] 4개 인덱스 생성?
- [ ] `@prisma/client` 재생성, 양쪽 환경 마이그레이션 성공?
- [ ] `/lib/types/notification.ts` Payload 타입 + DTO?
- [ ] `/lib/notification/delivery-strategy.ts` 발송 체인 유틸?
- [ ] `/docs/notification-delivery-chain.md`, `/docs/notification-polymorphic-pattern.md`?
- [ ] "internal 항상 INSERT" 원칙이 FC-024 담당자에게 가이드되었는가?
- [ ] ESLint / TS 경고 0건, 임시 스크립트 제거?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-001 | Prisma ORM 초기 설정 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| API-025 | 알림 발송 Route Handler DTO (채널별 에러 코드) |
| FC-023 | 알림 발송 체인 (카카오 → SMS → 이메일) |
| FC-024 | 내장 웹 알림함 CRUD + polymorphic 무결성 검증 |
| CRON-004 | 파트너 제안 D+3 리마인더 (NOTIFICATION INSERT) |
| CRON-006~009 | 모니터링 Slack 알림 (별도 채널이지만 로그 관점에서 연계 검토) |
| UI-014 | 알림함 UI — 실시간 업데이트, 읽음 처리 |

### 참고사항
- **Polymorphic vs Multi-column FK 논쟁:** 현 선택은 Polymorphic. 만약 팀이 "FK 무결성이 최우선"이라 판단하면 4개 컬럼(`buyerCompanyId?`, `siPartnerId?`, `manufacturerId?`, `adminId?`) + CHECK 제약(정확히 하나만 NOT NULL) 방식으로 전환 가능. 마이그레이션은 가능하나 조기 결정 권장
- **Admin User 엔티티 부재:** 현재 Admin은 별도 테이블 없이 NextAuth 세션으로만 관리 예상 (API-027에서 확정). `recipientRole='admin'`인 경우 `recipientId`는 Auth provider의 user ID 문자열
- **알림 폭주 방지:** 동일 recipientId에 동일 type이 1시간 내 N건 초과 시 중복 억제 로직 필요 (FC-024 범위)
- **Phase 2 확장:** 알림 그룹핑(디지털 다이제스트), 사용자 알림 설정(선호 채널/끄기), 실시간 Push (Web Push API)
- **internal 기본 INSERT 원칙의 트레이드오프:** 외부 채널 비용이 발생하지 않더라도 DB 쓰기는 발생 → 초당 100건 이상 발송 시 Connection Pool 포화 주의 (배치 INSERT 활용)
