---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-004: MANUFACTURER 테이블 스키마 및 마이그레이션"
labels: 'feature, backend, db, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-004] `MANUFACTURER` (제조사) 테이블 스키마 및 마이그레이션 작성
- 목적: 로봇 제조사(예: UR, 두산로보틱스, 레인보우로보틱스)의 기본 정보를 저장하는 핵심 사용자 엔티티를 정의한다. **뱃지 발급 주체(DB-008)**, **파트너 제안 발송 주체(DB-013)**, **로봇 모델 마스터의 제조사 FK(DB-016)** 로 참조된다. CON-05(제조사 최소 3사 LOI 확보 목표) 요건을 스키마 레벨에서 수용한다. BUYER_COMPANY/SI_PARTNER 대비 필드가 간결한 이유는, 제조사는 **플랫폼 관리자 협의 하에 수동 등록되는 소수 B2B 파트너**이기 때문이다 (자가 회원가입 플로우 없음).

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.3 MANUFACTURER`](../06_SRS-v1.md) — 제조사 테이블 스키마 정의 (5개 필드)
- SRS 문서: [`06_SRS-v1.md#6.2.12 ER Diagram`](../06_SRS-v1.md) — MANUFACTURER 관계 (BADGE 발급 주체, ROBOT_MODEL의 FK)
- SRS 문서: [`06_SRS-v1.md#CON-05`](../06_SRS-v1.md) — 제조사 최소 3사가 뱃지 프로그램에 참여 (D-90일 LOI 완료 목표)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-013~017`](../06_SRS-v1.md) — 뱃지 발급/철회/만료 관리 (제조사 주도)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-030`](../06_SRS-v1.md) — 파트너 제안 발송 (제조사 → SI)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-031`](../06_SRS-v1.md) — 제조사 대시보드 (파트너 현황)
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-004`](../TASKS/07_TASK-LIST-v1.md)
- 연동 DB: `DB-008` (BADGE), `DB-013` (PARTNER_PROPOSAL), `DB-016` (ROBOT_MODEL)
- 연동 API: `API-016` (issueBadge), `API-017` (revokeBadge), `API-018` (sendPartnerProposal)
- 선행 태스크: `DB-001` (Prisma ORM 초기 설정)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Prisma 모델 정의 (`prisma/schema.prisma`)
- [ ] `Manufacturer` 모델 정의 (SRS 6.2.3 5개 필드 반영):
  ```prisma
  model Manufacturer {
    id             String    @id @default(cuid())
    companyName    String    @db.VarChar(255)
    brandName      String    @db.VarChar(255)
    contactEmail   String    @db.VarChar(255)
    createdAt      DateTime  @default(now())

    // 역방향 관계 (DB-008, DB-013, DB-016에서 FK 설정)
    badges         Badge[]
    partnerProposals PartnerProposal[]
    robotModels    RobotModel[]

    @@index([brandName])
    @@map("manufacturer")
  }
  ```
- [ ] SRS 명세에 UNIQUE 제약은 없으나, **실무적으로 `brandName` 또는 `contactEmail`의 UNIQUE 제약 필요성** 검토:
  - 옵션 A (보수): SRS 명세 그대로 UNIQUE 없음 (동일 브랜드의 복수 법인 대응)
  - 옵션 B (실무): `brandName` UNIQUE 추가 (브랜드 혼동 방지) — **Admin 팀과 협의 후 확정**
  - → 본 태스크에서는 **옵션 A 채택**, 필요 시 후속 마이그레이션으로 추가 (API-016 뱃지 발급 시 중복 brand 혼동 이슈 발생하면 재평가)

### 2단계: 인덱스 전략 수립
- [ ] `brandName` → `@@index([brandName])` — FQ-003(뱃지 보유 SI 필터), UI-009(제조사 포털) 등 브랜드명 기반 조회 대응
- [ ] `id`(PK) 단독으로 FK 참조는 충분 — 추가 인덱스 최소화

### 3단계: Migration 파일 생성 및 검증
- [ ] `pnpm prisma migrate dev --name add_manufacturer` 실행
- [ ] 생성된 SQL 검토:
  - `CREATE TABLE "manufacturer" (...)` — 5개 필드, 모두 NOT NULL
  - PK(id), INDEX(brand_name) 확인
- [ ] `pnpm prisma generate` → `Manufacturer` 타입 export 검증

### 4단계: Admin 주도 등록 운영 프로세스 문서화
- [ ] `/docs/manufacturer-onboarding-ops.md` 작성:
  - 제조사는 **자가 회원가입 UI 없음** — Admin이 계약/LOI 체결 후 직접 등록
  - 등록 시 `contactEmail`은 해당 제조사 담당자 이메일(뱃지 발급/파트너 제안 알림 수신용)
  - `brandName`은 플랫폼 UX 전반(뱃지 인증마크, 검색 필터)에서 표시되는 공개 브랜드명
  - CON-05 조항: MVP 런칭 전 최소 3사 등록 완료 목표
- [ ] 향후 Admin 포털(UI-008)에서 GUI 기반 등록 기능 추가 가능 여지 명시

### 5단계: TypeScript 타입 유틸 작성 (`/lib/types/manufacturer.ts`)
- [ ] Prisma 타입 re-export:
  ```ts
  import type { Manufacturer as PrismaManufacturer } from '@prisma/client'
  export type Manufacturer = PrismaManufacturer
  export type ManufacturerPublic = Pick<Manufacturer, 'id' | 'companyName' | 'brandName'>
  // contactEmail은 Admin 전용, Public DTO에서 제외
  ```

### 6단계: 간이 Integration 검증 스크립트
- [ ] `scripts/verify-manufacturer-schema.ts` (PR 머지 전 제거):
  - 정상 INSERT 3건 (UR/두산/레인보우 시뮬레이션) → 성공
  - 동일 `brandName` INSERT → 성공 (옵션 A 채택 시 UNIQUE 없으므로)
  - NOT NULL 필드 누락 → 에러 발생 확인

### 7단계: 문서 업데이트
- [ ] `/docs/erd.md`에 Manufacturer 엔티티 반영
- [ ] 후행 태스크(DB-008/013/016) 담당자에게 FK 참조 준비 완료 공유

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Admin이 정상적으로 제조사 등록**
- **Given:** Admin이 제조사 기본 정보(companyName, brandName, contactEmail)를 수집
- **When:** `prisma.manufacturer.create({ data: { companyName: "유니버설로봇코리아", brandName: "UR", contactEmail: "kr@universal-robots.com" } })` 호출
- **Then:** 레코드가 성공 생성되고, `id`(cuid)와 `createdAt`이 자동 채워진다.

**Scenario 2: NOT NULL 제약 검증**
- **Given:** SRS 명세상 모든 필드(id, companyName, brandName, contactEmail, createdAt)가 NOT NULL
- **When:** `brandName` 또는 `contactEmail`을 누락하고 INSERT 시도
- **Then:** TypeScript 타입 에러 또는 Prisma 검증 에러 발생.

**Scenario 3: 역방향 관계(Badge/PartnerProposal/RobotModel) include 쿼리 동작**
- **Given:** DB-008, DB-013, DB-016 스키마가 후속 구현됨
- **When:** `prisma.manufacturer.findUnique({ where: { id }, include: { badges: true, partnerProposals: true, robotModels: true } })` 실행
- **Then:** 타입 오류 없이 쿼리가 작성되고, 관계 데이터가 함께 조회된다.

**Scenario 4: FK 관계에서의 Cascade 정책 확인**
- **Given:** Manufacturer가 Badge, PartnerProposal, RobotModel에서 FK로 참조됨
- **When:** Manufacturer 삭제 시도
- **Then:** 기본 Prisma 정책상 RESTRICT로 차단되어야 함 (참조 무결성 보호). Admin이 실수로 제조사 삭제 시 뱃지/제안/모델이 함께 손실되는 것을 방지. **Cascade 정책은 DB-008/013/016에서 명시적으로 `onDelete: Restrict` 지정**

**Scenario 5: CON-05 요건 대응 시드 데이터 수용성**
- **Given:** MOCK-001에서 제조사 3사(UR, 두산, 레인보우) 시드 예정
- **When:** Seed 스크립트 실행
- **Then:** 3개 레코드가 정상 생성되고, 이후 MOCK-003(뱃지 15건 = 3 × 5)의 FK 참조가 성공한다.

**Scenario 6: 인덱스 생성 검증**
- **Given:** 마이그레이션 완료된 PostgreSQL DB
- **When:** `\d manufacturer` 실행
- **Then:** PK(id), INDEX(brand_name) 인덱스 존재 확인.

## :gear: Technical & Non-Functional Constraints

### 스키마 설계
- **필드 수 준수:** SRS 6.2.3에 명시된 5개 필드 (id, company_name, brand_name, contact_email, created_at) 정확히 반영
- **모든 필드 NOT NULL** (SRS 명세)
- **`updatedAt` 미포함:** SRS 명세에 없음. 제조사 정보 변경 추적 필요 시 후속 마이그레이션으로 추가 (Admin 운영 요건 확인 후 결정)
- **UNIQUE 제약 없음 (현 단계):** 옵션 A 채택. 향후 이슈 발생 시 `brandName` UNIQUE 추가 검토
- **타입 매핑:**
  - `VARCHAR(255)`: 모든 문자열 필드 일관 적용 (PostgreSQL `@db.VarChar(255)`)

### 성능
- 제조사 테이블 최대 규모: **수십 건 이내** (시장 점유율 70% 커버 목표 제조사 수 — CON-03 관련)
- 모든 쿼리가 PK 또는 brand_name INDEX 활용 → p95 ≤ 50ms
- FK 참조 성능 확보 (BADGE 수천 건 수준에서도 안정적)

### 안정성
- 제조사 삭제 시 FK 참조 테이블(BADGE, PARTNER_PROPOSAL, ROBOT_MODEL)의 Cascade 정책은 후행 태스크(DB-008/013/016)에서 `onDelete: Restrict` 명시
- 제조사 등록/수정은 Admin 전용 경로로만 허용 — RBAC 제어 (API-027)

### 보안
- `contactEmail`은 **Admin 및 해당 제조사 담당자에게만 노출** — Public API에서는 필터링 필요
- 수요기업(Buyer) 뷰의 SI 프로필에서 뱃지 표시 시, `brandName`만 노출하고 `contactEmail`은 제외 (API-014 연계)

### 유지보수성
- 필드 확장성: 제조사 로고 URL, 본사 소재지 등 추가 정보가 필요해질 경우 Nullable 필드로 후속 추가 (Migration-safe)
- Brand-Agnostic 정책(REQ-NF-022): 신규 제조사 추가는 **스키마 변경 없이 데이터 INSERT만으로 가능** — 본 설계 준수 확인

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `Manufacturer` 모델이 SRS 6.2.3 명세대로 정의되었는가?
- [ ] 마이그레이션 SQL 파일이 생성 및 커밋되었는가?
- [ ] 5개 필드가 모두 NOT NULL로 정의되어 있는가?
- [ ] `brandName` INDEX가 생성되었는가?
- [ ] `@prisma/client`가 재생성되어 `Manufacturer` 타입이 정상 export되는가?
- [ ] 로컬 SQLite와 Supabase PostgreSQL 양쪽에서 마이그레이션이 성공하는가?
- [ ] `/lib/types/manufacturer.ts`에 Public DTO 타입이 정의되었는가?
- [ ] `/docs/manufacturer-onboarding-ops.md` 운영 프로세스 문서가 작성되었는가?
- [ ] ESLint / TypeScript 컴파일 경고 0건인가?
- [ ] PR 머지 전 임시 검증 스크립트가 제거되었는가?
- [ ] 후행 태스크(DB-008/013/016) 담당자에게 FK 참조 준비 완료가 공유되었는가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-001 | Prisma ORM 초기 설정 및 SQLite/PostgreSQL 이중 환경 구성 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| DB-008 | `BADGE` — `manufacturer_id` FK 참조 (뱃지 발급 주체) |
| DB-013 | `PARTNER_PROPOSAL` — `manufacturer_id` FK 참조 (제안 발송 주체) |
| DB-016 | `ROBOT_MODEL` — `manufacturer_id` FK 참조 (모델 마스터) |
| MOCK-001 | Prisma Seed — 제조사 3사 샘플 데이터 (UR/두산/레인보우) |
| API-016 | `issueBadge` Server Action — 뱃지 발급 시 `manufacturer_id` 주체 검증 |
| API-017 | `revokeBadge` Server Action |
| API-018 | `sendPartnerProposal` Server Action |
| API-019 | `respondProposal` Server Action (SI가 수락/거절, 주체는 SI지만 상대방이 Manufacturer) |
| API-027 | NextAuth RBAC — `manufacturer` 역할 식별 |
| FQ-006 | 제조사 대시보드 — 파트너 현황 Server Component |
| UI-009 | 제조사 포털 — 뱃지 발급/철회 UI, 파트너 제안 발송 UI |

### 참고사항
- **자가 회원가입 부재:** SRS에 `signupManufacturer` 엔드포인트가 없음 (API 엔드포인트 리스트 6.1 확인). 제조사는 Admin 주도 등록 — 본 스키마는 해당 정책을 반영
- **CON-05 LOI 진행 상황 추적:** 기술 외적으로 제조사 3사 LOI 확보가 본 엔티티 활용의 전제 조건 — 사업팀과 주기적 동기화 필요
- **UNIQUE 제약 미도입 결정:** 현 단계에서 불확실성 고려하여 보수적 선택. API-016 뱃지 발급 시 혼동 이슈 발생 시 후속 마이그레이션으로 `brandName UNIQUE` 추가
- **NextAuth 연동:** 제조사 계정 로그인은 Admin이 발급한 초대 링크 기반 OAuth 가입 플로우로 구성 예상 (API-027에서 최종 확정)
