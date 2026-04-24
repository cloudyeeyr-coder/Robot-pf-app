---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DB-001: Prisma ORM 초기 설정 및 SQLite/PostgreSQL 이중 환경 구성"
labels: 'feature, backend, db, infra, priority:critical'
assignees: ''
---

## :dart: Summary
- 기능명: [DB-001] Prisma ORM 초기 설정 및 SQLite(로컬) / PostgreSQL(배포) 이중 환경 구성
- 목적: 모든 도메인 테이블(DB-002~017) 및 DB 연동 로직(FQ, FC, CRON 전 계열)의 기반이 되는 **데이터 액세스 레이어의 단일 진실 공급원(SSOT)** 을 확립한다. CON-13에 따라 로컬 개발은 SQLite, 배포 환경은 Supabase(PostgreSQL)로 이원화하되, 하나의 `schema.prisma`로 두 환경을 모두 지원할 수 있도록 ORM 매핑 규약(ENUM/JSONB/TEXT[]/DECIMAL/UUID 호환성)을 확정한다. 이후 모든 DB 태스크는 이 설정을 전제로 마이그레이션 스크립트와 모델 정의를 수행한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2 Entity & Data Model`](../06_SRS-v1.md) — ORM 매핑 노트 (Prisma + SQLite/PostgreSQL 호환성 규약)
- SRS 제약사항: [`06_SRS-v1.md#CON-11`](../06_SRS-v1.md) — Next.js App Router 단일 풀스택 프레임워크
- SRS 제약사항: [`06_SRS-v1.md#CON-12`](../06_SRS-v1.md) — Server Actions / Route Handlers 기반 서버 로직
- SRS 제약사항: [`06_SRS-v1.md#CON-13`](../06_SRS-v1.md) — Prisma ORM + 로컬 SQLite / 배포 Supabase(PostgreSQL) 이중 환경
- SRS 제약사항: [`06_SRS-v1.md#CON-16`](../06_SRS-v1.md) — Vercel 배포, Git Push 자동 배포
- System Component Diagram: [`06_SRS-v1.md#3.1.1`](../06_SRS-v1.md) — `Prisma ORM → Supabase / SQLite` 데이터 계층 구조
- 태스크 리스트: [`07_TASK-LIST-v1.md#DB-001`](../TASKS/07_TASK-LIST-v1.md)
- 후행 태스크: DB-002~017 (전 도메인 테이블 스키마), NFR-003 (Supabase 배포 환경 설정), NFR-006 (환경변수 표준화)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 프로젝트 의존성 및 패키지 설치
- [ ] `prisma` (devDependency) 및 `@prisma/client` (dependency) 설치 — 최신 안정 버전(≥ 5.x) 고정
- [ ] `pnpm` 또는 `npm` 스크립트 등록: `db:generate`, `db:migrate:dev`, `db:migrate:deploy`, `db:studio`, `db:seed`
- [ ] `.gitignore` 업데이트: `prisma/dev.db`, `prisma/*.db-journal`, `.env.local` 제외 처리

### 2단계: Prisma 스키마 초기 구조 작성 (`prisma/schema.prisma`)
- [ ] `generator client` 블록 정의: `provider = "prisma-client-js"`, `previewFeatures = []`
- [ ] `datasource db` 블록 정의:
  - `provider = "postgresql"` (배포 환경 기준, 단일 provider 선언)
  - `url = env("DATABASE_URL")`
  - `directUrl = env("DIRECT_URL")` (Supabase Connection Pooling 대응)
- [ ] 로컬 개발용 SQLite 전환 전략 수립:
  - 옵션 A (권장): `schema.prisma` 단일 유지 + 환경변수(`DATABASE_URL`)로 DB 스위칭, 로컬은 `file:./dev.db` 사용 시 provider 재정의 불가 → **`schema.local.prisma` 분리 유지 스크립트 작성**
  - 옵션 B: 로컬도 Dockerized PostgreSQL 사용 (팀 협의 필요)
  - → 본 태스크에서는 **옵션 A**를 채택, `pnpm db:use:local` / `pnpm db:use:prod` 스크립트로 스키마 파일 심볼릭 스위칭 구현

### 3단계: ORM 매핑 규약 문서화 및 타입 규칙 확정 (SRS 6.2 ORM 매핑 노트 준수)
- [ ] `JSONB` → Prisma `Json` 타입 매핑 규칙 정의 (SQLite는 JSON 문자열 직렬화)
- [ ] `TEXT[]` → Prisma `Json` 타입 대체 규칙 정의 (SQLite 배열 미지원 대응)
- [ ] `ENUM` → Prisma `enum` 정의 규칙 및 SQLite 매핑 시 `String` 폴백 주석 처리
- [ ] `DECIMAL(15,2)` → Prisma `Decimal` 매핑 및 SQLite `REAL` 정밀도 차이 허용 정책 명시
- [ ] `UUID` → `String @id @default(cuid())` 채택 (PostgreSQL 네이티브 UUID 대비 SQLite 호환성 우선)
- [ ] `TIMESTAMP` → `DateTime @default(now())` / `@updatedAt` 매핑 규칙 정의
- [ ] `/docs/prisma-mapping-convention.md` 문서 작성 — 후행 DB 태스크 참조용

### 4단계: 환경 변수 및 연결 문자열 템플릿 작성
- [ ] `.env.example` 작성:
  - `DATABASE_URL` (PostgreSQL pooled connection)
  - `DIRECT_URL` (PostgreSQL direct connection — 마이그레이션용)
  - `DATABASE_URL_LOCAL="file:./dev.db"` (로컬 SQLite 전환용 참고값)
- [ ] `.env.local`은 절대 커밋 금지 — `.gitignore` 확인
- [ ] Vercel Dashboard 시크릿 등록 가이드 문서화 (`/docs/env-setup.md`)

### 5단계: 초기 Migration 및 Prisma Client 생성 검증
- [ ] `schema.prisma`에 임시 dummy 모델 1개 정의 (예: `HealthCheck { id String @id @default(cuid()) ; createdAt DateTime @default(now()) }`)
- [ ] `pnpm prisma migrate dev --name init` 실행 → `prisma/migrations/` 디렉토리 및 초기 마이그레이션 파일 생성 확인
- [ ] `pnpm prisma generate` 실행 → `@prisma/client` 타입 생성 및 import 동작 검증
- [ ] Next.js Server Component에서 `prisma.healthCheck.create({})` 호출 샘플 → 정상 동작 검증 후 dummy 모델은 PR 머지 전 제거

### 6단계: Prisma Client 싱글톤 래퍼 구현
- [ ] `/lib/prisma.ts` 파일 생성 — Next.js dev 모드 HMR에서 Client 다중 인스턴스화 방지
  ```ts
  import { PrismaClient } from '@prisma/client'
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
  export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```
- [ ] 모든 Server Action/Component에서 위 싱글톤만 import하도록 ESLint rule 또는 PR 리뷰 가이드 명시

### 7단계: CI/CD 파이프라인 통합
- [ ] GitHub Actions 워크플로우 또는 Vercel Build Step에 `prisma generate` 자동 실행 추가
- [ ] Vercel Production 배포 시 `prisma migrate deploy` 실행 훅 등록 (NFR-002 연계)
- [ ] Build 실패 시 롤백 가능하도록 마이그레이션 전략 문서화

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 로컬 개발 환경에서 SQLite 기반 Prisma 초기화 성공**
- **Given:** 신규 개발자가 저장소를 클론하고 `pnpm install`을 완료함
- **When:** `pnpm db:use:local && pnpm prisma migrate dev --name init`을 실행함
- **Then:** `prisma/dev.db` SQLite 파일이 생성되고, 초기 마이그레이션이 오류 없이 적용되며, `@prisma/client` 타입이 정상 생성된다.

**Scenario 2: 배포 환경에서 Supabase PostgreSQL 연결 및 마이그레이션 성공**
- **Given:** Vercel 환경변수에 유효한 `DATABASE_URL`, `DIRECT_URL` (Supabase Connection Pooling/Direct URL)이 설정됨
- **When:** `pnpm prisma migrate deploy` 명령이 CI/CD 파이프라인에서 실행됨
- **Then:** Supabase PostgreSQL에 마이그레이션이 적용되고, Vercel Preview/Production 빌드가 성공한다.

**Scenario 3: Prisma Client 싱글톤이 Next.js dev 서버 HMR에서 다중 인스턴스를 생성하지 않음**
- **Given:** 개발자가 `pnpm dev`로 Next.js 개발 서버를 실행 중임
- **When:** Server Action 파일을 10회 이상 수정하며 HMR을 트리거함
- **Then:** PostgreSQL/SQLite 커넥션 수가 지속적으로 증가하지 않고 일정하게 유지된다 (Connection leak 없음).

**Scenario 4: 환경변수 누락 시 명확한 에러 메시지 출력**
- **Given:** `.env.local`에 `DATABASE_URL`이 미설정된 상태
- **When:** `pnpm prisma migrate dev`를 실행함
- **Then:** `Error: P1012: Environment variable not found: DATABASE_URL` 형태의 명확한 에러 메시지가 출력되고, 프로세스가 비정상 종료(exit code ≠ 0)된다.

**Scenario 5: ORM 매핑 규약이 문서화되고 팀 공유됨**
- **Given:** 후행 DB 태스크(DB-002 등) 담당 에이전트/개발자가 작업에 착수함
- **When:** `/docs/prisma-mapping-convention.md`를 참조함
- **Then:** ENUM/JSONB/TEXT[]/DECIMAL/UUID 5개 유형에 대한 SQLite↔PostgreSQL 매핑 규칙이 명확히 정의되어 있어, 별도 질의 없이 스키마 작성이 가능하다.

## :gear: Technical & Non-Functional Constraints

### 기술 스택 제약
- **ORM:** Prisma ≥ 5.x (최신 안정 버전, `previewFeatures` 불필요 시 미사용)
- **로컬 DB:** SQLite (파일 기반 `prisma/dev.db`)
- **배포 DB:** Supabase (PostgreSQL 15+) — CON-13 준수
- **패키지 매니저:** pnpm (팀 표준) 또는 npm
- **Node.js:** Vercel 런타임 호환 버전 (≥ 20.x 권장)

### 성능
- 초기 마이그레이션 실행 시간 ≤ 10초 (로컬 SQLite 기준)
- Prisma Client 생성(`prisma generate`) 시간 ≤ 30초 (CI 환경 기준)
- 커넥션 풀 크기 설정: Supabase Connection Pooling 활용, 기본값 검증 후 REQ-NF-005 (500 CCU) 대응을 위한 조정 여지 확보

### 안정성
- `prisma migrate deploy` 실패 시 Vercel 빌드가 중단되어야 하며, 부분 적용 상태로 Production에 반영되지 않아야 함
- Prisma Client 싱글톤 패턴으로 Next.js dev 모드 HMR에서 커넥션 누수 방지 (`globalThis` 재사용)

### 보안
- `DATABASE_URL`, `DIRECT_URL` 등 연결 문자열은 **절대 코드/로그에 노출 금지** — Vercel Dashboard 시크릿으로만 관리 (NFR-006)
- 모든 DB 연결은 TLS 1.3 강제 적용 (REQ-NF-017) — Supabase 기본 설정 활용, `sslmode=require` 파라미터 확인
- Prisma 쿼리 로그에 민감정보(비밀번호, PII)가 포함되지 않도록 prod 환경 `log: ['error']`로 제한

### 유지보수성 (REQ-NF-022)
- Brand-Agnostic 확장성 대응: 스키마 변경 없이 데이터 레벨 확장 가능한 구조 문서화
- 마이그레이션 파일(`prisma/migrations/`)은 모두 커밋하여 이력 추적 가능해야 함

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `prisma/schema.prisma`, `/lib/prisma.ts`, `.env.example`, `/docs/prisma-mapping-convention.md` 4개 파일이 저장소에 커밋되었는가?
- [ ] 로컬 SQLite / 배포 Supabase 양쪽 환경에서 `prisma migrate dev` 및 `prisma migrate deploy`가 각각 검증되었는가?
- [ ] ORM 매핑 규약 문서가 후행 DB 태스크 담당자가 별도 질의 없이 참조 가능한 수준으로 완성되었는가?
- [ ] `pnpm db:generate`, `pnpm db:migrate:dev`, `pnpm db:migrate:deploy`, `pnpm db:studio`, `pnpm db:seed` 스크립트가 `package.json`에 등록되었는가?
- [ ] Vercel 빌드 파이프라인에서 `prisma generate` 자동 실행이 검증되었는가?
- [ ] `.env.local` 등 시크릿 파일이 `.gitignore`에 포함되어 있고 실제로 커밋되지 않았는가?
- [ ] Prisma Client 싱글톤 패턴이 적용되어 Next.js dev 서버에서 커넥션 누수가 없음을 검증했는가?
- [ ] PR 머지 전 dummy 모델(`HealthCheck`)이 제거되었는가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js App Router 프로젝트 초기 세팅 (Tailwind + shadcn/ui) | 필수 |
| NFR-006 | 환경 변수 관리 표준화 (`.env.local` / Vercel Dashboard 시크릿 분리) | 권장 (병렬 가능) |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| DB-002~017 | 전체 도메인 테이블 스키마 및 마이그레이션 — **모두 본 태스크를 전제로 작성됨** |
| NFR-003 | Supabase PostgreSQL 배포 환경 최종 설정 (Prisma 연동, SSL 연결) |
| MOCK-001~007 | 전체 Prisma Seed 스크립트 — Prisma Client 및 스키마 기반 동작 |
| API-001~027 | 전체 API/DTO 계약 — Prisma 모델 타입 기반 Zod/TypeScript 타입 추론 |

### 참고사항
- **Critical Path:** 본 태스크는 전체 태스크 트리의 루트 노드 중 하나이므로, **Sprint 0 최우선 처리** 필요
- **의사결정 필요 포인트:**
  - (1) 로컬 SQLite 유지 vs Dockerized PostgreSQL 전환 — 초기 SRS는 SQLite를 명시했으나, `JSONB`/`TEXT[]` 매핑의 런타임 동작 차이가 디버깅 부담이 될 수 있음. 팀 논의 후 확정 권장
  - (2) `@default(cuid())` vs `@default(uuid())` — SRS에는 UUID 명시되어 있으나, cuid가 URL-safe하고 성능상 유리. 팀 컨벤션 확정 필요
- **Phase 2 확장 대비:** 향후 Read Replica 분리, Connection Pooling 세부 튜닝(PgBouncer), Prisma Accelerate 도입 여지 확보
