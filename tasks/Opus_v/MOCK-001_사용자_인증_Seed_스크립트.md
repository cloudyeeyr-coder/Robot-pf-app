---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-001: Prisma Seed 스크립트 — 수요기업 10사 / SI 파트너 20사 / 제조사 3사 샘플 데이터"
labels: 'feature, backend, mock, seed, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-001] User & Auth 도메인 Seed 스크립트 (수요기업 10 / SI 파트너 20 / 제조사 3)
- 목적: 프론트엔드·CQRS Query·UI 컴포넌트 태스크(UI-001~015)가 백엔드 Command 로직 완성 이전에도 독립적으로 개발·테스트될 수 있도록, **재현 가능하고 관계 무결성이 보장된 기준 사용자 데이터셋**을 제공한다. 특히 CON-05(제조사 최소 3사 뱃지 참여) 제약과 KPI(SI 30사 매칭, 수요기업 300사 확장성)를 검증할 수 있는 최소 모집단을 구축하여, 후행 MOCK-002~007 Seed 스크립트의 참조 무결성(FK) 기반이 된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.1 BUYER_COMPANY`](../06_SRS-v1.md) — 수요기업 테이블 스키마
- SRS 문서: [`06_SRS-v1.md#6.2.2 SI_PARTNER`](../06_SRS-v1.md) — SI 파트너 테이블 스키마
- SRS 문서: [`06_SRS-v1.md#6.2.3 MANUFACTURER`](../06_SRS-v1.md) — 제조사 테이블 스키마
- SRS 문서: [`06_SRS-v1.md#CON-05`](../06_SRS-v1.md) — 제조사 최소 3사 뱃지 프로그램 참여 제약
- SRS 문서: [`06_SRS-v1.md#REQ-NF-021`](../06_SRS-v1.md) — SI 120사 + 수요기업 300사 수평 확장 요구사항
- 태스크 리스트: [`07_TASK-LIST-v1.md#MOCK-001`](../TASKS/07_TASK-LIST-v1.md)
- 선행 DB 스키마: `DB-002` (BUYER_COMPANY), `DB-003` (SI_PARTNER), `DB-004` (MANUFACTURER)
- 후행 Seed 스크립트: `MOCK-002` ~ `MOCK-007` (모두 본 데이터셋의 FK 참조)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Seed 스크립트 인프라 구성
- [ ] `prisma/seed/` 디렉토리 구조 생성 및 `package.json`에 `"prisma": { "seed": "tsx prisma/seed/index.ts" }` 설정
- [ ] Seed 엔트리포인트(`prisma/seed/index.ts`) 작성 — 순차 실행 순서: `manufacturers → buyers → siPartners`
- [ ] `@faker-js/faker` (ko 로케일) 및 `uuid` 의존성 추가
- [ ] 공통 유틸 `prisma/seed/lib/fixtures.ts` — 고정 샘플 배열(한국 지역, 세그먼트, 역량 태그 마스터)

### 2단계: 수요기업(BUYER_COMPANY) 10사 생성
- [ ] `prisma/seed/buyers.ts` 파일 작성
- [ ] **지역 분포**: 서울 3사, 경기 3사, 부산 2사, 대구 1사, 인천 1사 (수도권 60% 집중 현실 반영)
- [ ] **세그먼트 분포 (AOS-DOS 분류)**: Q1 4사, Q2 3사, Q3 2사, Q4 1사 (MVP 타겟 Q1/Q2 편중)
- [ ] **필수 필드 채우기**: `company_name`(한국식 제조업체명), `biz_registration_no`(XXX-XX-XXXXX 포맷, UNIQUE), `contact_name`, `contact_email`(도메인: example.com), `contact_phone`(010-XXXX-XXXX)
- [ ] 고정 UUID 사용 (테스트 간 참조 안정성 확보) — `BUYER_IDS` 상수 export

### 3단계: SI 파트너(SI_PARTNER) 20사 생성
- [ ] `prisma/seed/siPartners.ts` 파일 작성
- [ ] **등급(tier) 분포**: Silver 10사, Gold 7사, Diamond 3사 (현실적 피라미드 구조)
- [ ] **재무등급(financial_grade) 분포**: A+ 3사, A 7사, B+ 6사, B 3사, NULL 1사(미평가 케이스)
- [ ] **시공성공률(success_rate) 분포**: Diamond 95~99%, Gold 85~94%, Silver 70~84%
- [ ] **지역 분포**: 수도권(서울/경기/인천) 14사, 영남권(부산/대구/울산) 4사, 호남권(광주) 1사, 충청권(대전) 1사
- [ ] `biz_registration_no` UNIQUE 제약 준수, `financial_grade_updated_at`은 최근 90일 이내 랜덤 분포
- [ ] 고정 UUID 사용 — `SI_PARTNER_IDS` 상수 export

### 4단계: 제조사(MANUFACTURER) 3사 생성
- [ ] `prisma/seed/manufacturers.ts` 파일 작성
- [ ] **CON-05 준수**: 정확히 3사 생성 (뱃지 프로그램 최소 참여 제약)
- [ ] **Brand-Agnostic(CON-03, REQ-NF-022) 검증용 다양성 확보**: 대기업 협동로봇사 1 / 중견 물류로봇사 1 / 글로벌 외산 국내법인 1
- [ ] 테스트 전용 익명 코드 사용 권장: `MFG-A`, `MFG-B`, `MFG-C` (실제 기업명은 LOI 완료 후 재검토)
- [ ] 고정 UUID 사용 — `MANUFACTURER_IDS` 상수 export

### 5단계: 재현성(Idempotency) 및 초기화 로직
- [ ] Upsert 패턴 적용: `prisma.buyerCompany.upsert({ where: { id }, update: {}, create: {...} })` — 중복 실행 시에도 안전
- [ ] 개발 환경 전용 `prisma/seed/reset.ts` 작성 — 역방향 순서로 `deleteMany` 실행 (FK 제약 준수)
- [ ] `NODE_ENV === 'production'` 체크 가드 — Production 환경에서는 Seed 실행 차단
- [ ] `tsx prisma/seed/index.ts --reset` 옵션으로 초기화 후 재생성 지원

### 6단계: 검증 및 문서화
- [ ] `npx prisma db seed` 실행 후 각 테이블 COUNT 검증 (10 / 20 / 3)
- [ ] `biz_registration_no` UNIQUE 제약 위반 없음 확인
- [ ] `prisma/seed/README.md` 작성 — 고정 UUID 목록, 데이터 분포, 재실행 방법 명시

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 초기 Seed 실행 (clean DB 기준)**
- **Given:** 마이그레이션이 완료된 빈 데이터베이스가 주어짐
- **When:** `npx prisma db seed` 명령을 실행함
- **Then:** `BUYER_COMPANY` 10건, `SI_PARTNER` 20건, `MANUFACTURER` 3건이 생성되고, 스크립트는 exit code 0으로 종료됨

**Scenario 2: 재실행 시 Idempotency 보장**
- **Given:** 이미 Seed 데이터가 존재하는 데이터베이스가 주어짐
- **When:** `npx prisma db seed`를 다시 실행함
- **Then:** 중복 레코드나 UNIQUE 제약 위반 없이 정상 종료되며, 각 테이블 COUNT는 여전히 10 / 20 / 3을 유지함

**Scenario 3: CON-05 제조사 최소 3사 제약 충족**
- **Given:** Seed 실행이 완료된 상태가 주어짐
- **When:** `SELECT COUNT(*) FROM manufacturer`를 조회함
- **Then:** 결과가 정확히 3이며, 각 제조사의 `brand_name`이 서로 다름 (Brand-Agnostic 다양성 검증)

**Scenario 4: SI 등급 분포 현실성**
- **Given:** Seed 실행이 완료된 상태가 주어짐
- **When:** `tier`별로 `GROUP BY`하여 집계함
- **Then:** Silver 10 / Gold 7 / Diamond 3의 피라미드 분포를 보이며, `success_rate`가 등급별 범위(Silver 70~84, Gold 85~94, Diamond 95~99)에 속함

**Scenario 5: 고정 UUID 기반 후행 Seed 참조 가능성**
- **Given:** MOCK-001 완료 상태가 주어짐
- **When:** `MOCK-002`(계약 Seed)에서 `BUYER_IDS[0]`과 `SI_PARTNER_IDS[0]`을 FK로 사용하여 계약을 생성함
- **Then:** FK 참조 에러 없이 계약이 정상 삽입됨

**Scenario 6: Production 환경 차단**
- **Given:** `NODE_ENV=production` 환경변수가 설정됨
- **When:** `npx prisma db seed`를 실행함
- **Then:** "Production 환경에서 Seed 실행이 차단되었습니다" 에러 메시지와 함께 exit code 1로 종료됨

## :gear: Technical & Non-Functional Constraints

### 데이터 일관성
- 모든 ID는 **고정 UUID v4**로 선언 (faker.datatype.uuid() 사용 금지) — 테스트 간 참조 안정성 확보
- `biz_registration_no`는 실제 유효한 체크섬을 갖지 않아도 되나, **테스트 전용 마커**(예: 앞자리 `999-XX-XXXXX` 고정)로 실데이터와 충돌 방지
- `contact_email` 도메인은 `example.com`으로 통일 (실제 이메일 발송 사고 차단)

### 재현성 및 이식성
- SQLite (개발) / PostgreSQL (스테이징·운영) 이중 환경에서 동일하게 동작해야 함 (DB-001 전제)
- `prisma.$transaction()`으로 3개 테이블 원자적 삽입 — 중간 실패 시 롤백

### 성능 및 확장성 Hook
- `SEED_SCALE` 환경변수 지원 (예: `SEED_SCALE=10`이면 100사/200사/3사 생성) — NFR-023(300사 수평 확장) 시뮬레이션 기반
- 기본값(SEED_SCALE=1)은 본 태스크 요구 수치(10/20/3) 유지

### 보안 및 개인정보
- 실제 개인정보/실제 기업명 사용 금지 — faker 또는 명시적 가상 데이터만 사용
- `.env.local`의 DB URL은 절대 하드코딩 금지

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `npx prisma db seed` 실행 시간이 로컬 환경에서 ≤ 10초인가?
- [ ] 3개 테이블 생성 건수, 분포(지역/세그먼트/tier), UNIQUE 제약 위반 여부를 검증하는 **Seed 검증 스크립트**(`prisma/seed/verify.ts`)가 작성되었는가?
- [ ] `prisma/seed/README.md`에 고정 UUID 목록과 데이터 분포표가 문서화되었는가?
- [ ] `SEED_SCALE` 환경변수가 동작하며, `SEED_SCALE=3` 실행 시 30/60/9건이 생성되는가?
- [ ] TypeScript 타입 에러 및 ESLint 경고가 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-001 | Prisma ORM 초기 설정 및 SQLite/PostgreSQL 이중 환경 구성 | 필수 |
| DB-002 | `BUYER_COMPANY` 테이블 스키마 및 마이그레이션 | 필수 |
| DB-003 | `SI_PARTNER` 테이블 스키마 및 마이그레이션 | 필수 |
| DB-004 | `MANUFACTURER` 테이블 스키마 및 마이그레이션 | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| MOCK-002 | 계약·에스크로 Seed (BUYER_IDS / SI_PARTNER_IDS FK 참조) |
| MOCK-003 | 뱃지·파트너 제안 Seed (SI_PARTNER_IDS / MANUFACTURER_IDS FK 참조) |
| MOCK-004 | SI 프로필 Seed (SI_PARTNER_IDS FK 참조) |
| MOCK-006 | 로봇 모델·견적 리드 Seed (MANUFACTURER_IDS / BUYER_IDS FK 참조) |
| MOCK-007 | O2O 예약 Seed (BUYER_IDS FK 참조) |
| UI-001, UI-002 | 회원가입 UI 독립 개발 (중복 사업자번호 검증 테스트) |
| FQ-001 | SI 파트너 검색 Query 로직 (필터 검증용 20사 데이터 필요) |

### 참고사항
- 본 Seed는 **MVP 검증용 최소 모집단**이며, E2E 부하 테스트(NFR-010)에는 `SEED_SCALE=6` 이상 권장
- 실제 제조사명은 **LOI 완료 시점 재검토**하여 익명 코드(`MFG-A`, `MFG-B`, `MFG-C`) 사용 권장