# AGENTS 공통 운영 가이드 (Opus_v 통합본)

이 문서는 `tasks/Opus_v` 내 **전체 59개 태스크 문서(API 27 / DB 17 / UI 15)** 를 통합 분석해 만든, **모든 AI LLM Agent 공용 실행 기준**이다.

## 1) 범위와 역할

- 범위: `tasks/Opus_v/*.md` 전 문서
- 목적: 문서 간 충돌 없이 일관된 구현/검증/인수 기준 제공
- 원칙: 개별 태스크 문서가 상세 명세, 본 문서는 공통 운영 규약(메타 SSOT)

## 2) 공통 SSOT 규칙

1. 요구사항 우선순위는 `SRS(06_SRS-v1.md)` → `해당 Task 문서` → `연동 Task 문서` 순서로 해석한다.
2. 모든 태스크는 문서의 7개 섹션(요약, 참조, 실행계획, AC, 제약, DoD, 의존성)을 빠짐없이 반영한다.
3. API 계약은 DTO/Zod/에러코드까지 포함해 UI·비즈니스 로직과 동일 계약을 유지한다.
4. DB는 Prisma 단일 스키마 체계를 기준으로, 로컬(SQLite)·배포(PostgreSQL/Supabase) 호환을 유지한다.
5. 상태 전이가 있는 도메인(Escrow/Inspection/Proposal/AS 등)은 문서에 명시된 전이 규칙을 코드 레벨에서 강제한다.

## 3) 아키텍처 공통 기준

- 프레임워크: Next.js App Router 중심(서버 액션 + 라우트 핸들러 + 서버 컴포넌트 분리)
- 인증/인가: RBAC 4역할(`buyer`, `si_partner`, `manufacturer`, `admin`) + 인증 미들웨어
- 계약/검증: TypeScript DTO + Zod 스키마 동시 관리
- 데이터 계층: Prisma Client 싱글톤, 마이그레이션 이력 커밋
- UI 계층: Tailwind + shadcn/ui, 반응형/접근성 기본 내장

## 4) 작업 프로토콜 (모든 Agent 공통)

1. 시작 전: 대상 태스크 + `Depends on` 항목 문서부터 읽는다.
2. 구현 시: `Task Breakdown` 단계 순서를 유지하고, 임의 축약하지 않는다.
3. 검증 시: `Acceptance Criteria(Scenario)`를 테스트 케이스로 직접 매핑한다.
4. 완료 시: `Definition of Done` 체크리스트를 모두 충족해야 종료한다.
5. 연계 시: `Blocks`에 있는 후행 태스크가 바로 사용할 수 있는 인터페이스/타입/문서를 남긴다.

## 5) 의존성 기반 권장 구현 순서

1. 기반 인프라: `DB-001` → `API-027` → `UI-015`
2. 핵심 트랜잭션: 계약/에스크로/검수/보증/AS (`DB-005~011`, `API-003~012`, `UI-005~008`)
3. 파트너십/뱃지: (`DB-008, DB-013`, `API-016~019`, `UI-009, UI-013`)
4. 탐색/리포트/RaaS: (`DB-009, DB-016`, `API-013~015, API-020~022`, `UI-003, UI-004, UI-010, UI-011`)
5. O2O/알림/모니터링: (`DB-010, DB-014, DB-015, DB-017`, `API-023~026`, `UI-012, UI-014`)

## 6) 도메인별 핵심 구현 포인트

### 6.1 API (27)
- Auth: 회원가입 2종 + RBAC/Auth 인터페이스 (`API-001,002,027`)
- Escrow/Inspection: 계약, 예치, 방출, 분쟁, 상태조회, 검수 (`API-003~008`)
- AS/Warranty: 티켓 접수·배정·완료 + 보증서 (`API-009~012`)
- Search/Profile/Report: 검색·상세·PDF (`API-013~015`)
- Badge/Partnership: 발급·철회·제안·응답 (`API-016~019`)
- RaaS/Quote: 계산·PDF·수기견적 (`API-020~022`)
- O2O/Notification/Monitoring: 예약·방문보고·알림·Slack (`API-023~026`)

### 6.2 DB (17)
- 기반: Prisma 및 이중 환경 (`DB-001`)
- 핵심 엔티티: `BUYER_COMPANY`, `SI_PARTNER`, `MANUFACTURER`, `CONTRACT`, `ESCROW_TX`, `AS_TICKET`
- 확장 엔티티: `BADGE`, `SI_PROFILE`, `O2O_BOOKING`, `WARRANTY`, `QUOTE_LEAD`, `PARTNER_PROPOSAL`
- 운영 엔티티: `NOTIFICATION`, `EVENT_LOG`, `ROBOT_MODEL`, `AS_ENGINEER`

### 6.3 UI (15)
- 온보딩/탐색: 회원가입, 검색, 프로필 (`UI-001~004`)
- 거래/운영: 에스크로, 검수, AS, Admin 대시보드 (`UI-005~008`)
- 파트너/제조사: 포털, 제안, 뱃지 (`UI-009, UI-013`)
- RaaS/O2O/알림: 계산기, 수기견적, 예약, 알림함 (`UI-010~012, UI-014`)
- 공통 프레임: 역할별 네비게이션 레이아웃 (`UI-015`)

## 7) 계약/에러/상태 관리 규약

- 에러코드는 `도메인약어_태스크번호_의미` 패턴을 따른다. (예: `AUTH_001_*`, `NTF_025_*`)
- 상태 전이와 선행 조건은 태스크 문서 정의를 코드에서 강제한다.
- 다중 도메인 동기화(예: Contract↔Escrow)는 트랜잭션 단위로 처리한다.
- 민감정보(PII, 인증 토큰, 결제/관리 메모)는 역할 기반으로 최소 노출한다.

## 8) 품질/보안/NFR 공통 기준

- 성능: 각 태스크에 명시된 p95/LCP/SLA 목표를 그대로 기준값으로 사용
- 안정성: 실패 시 오류를 명시적으로 반환하고, 상태 불일치를 남기지 않는다
- 보안: RBAC 검증, 환경변수 시크릿 관리, TLS 및 로그 마스킹 원칙 준수
- 접근성: UI 태스크는 WCAG, aria, 키보드 내비게이션 기준을 기본 충족

## 9) 분석 대상 문서 목록 (59)

### API (27)
- `API-001_수요기업_회원가입_ServerAction_DTO.md`
- `API-002_SI파트너_회원가입_ServerAction_DTO.md`
- `API-003_계약생성_ServerAction_DTO.md`
- `API-004_에스크로_예치확인_ServerAction_DTO.md`
- `API-005_자금방출확인_ServerAction_DTO.md`
- `API-006_분쟁접수_RouteHandler_DTO.md`
- `API-007_에스크로TX_상태조회_RouteHandler_DTO.md`
- `API-008_검수승인거절_ServerAction_DTO.md`
- `API-009_AS티켓접수_ServerAction_DTO.md`
- `API-010_AS엔지니어배정_ServerAction_DTO.md`
- `API-011_AS완료처리_ServerAction_DTO.md`
- `API-012_보증서발급_RouteHandler_DTO.md`
- `API-013_SI검색필터_ServerComponent_DTO.md`
- `API-014_SI프로필상세_ServerComponent_DTO.md`
- `API-015_기안리포트PDF_RouteHandler_DTO.md`
- `API-016_뱃지발급_ServerAction_DTO.md`
- `API-017_뱃지철회_ServerAction_DTO.md`
- `API-018_파트너제안발송_ServerAction_DTO.md`
- `API-019_파트너제안응답_ServerAction_DTO.md`
- `API-020_RaaS옵션계산_ServerAction_DTO.md`
- `API-021_RaaS비교PDF_RouteHandler_DTO.md`
- `API-022_수기견적요청_ServerAction_DTO.md`
- `API-023_O2O파견예약_ServerAction_DTO.md`
- `API-024_방문보고서등록_ServerAction_DTO.md`
- `API-025_알림발송_RouteHandler_DTO.md`
- `API-026_SlackWebhook_모니터링_DTO.md`
- `API-027_Auth_RBAC_인터페이스.md`

### DB (17)
- `DB-001_Prisma_ORM_초기설정.md`
- `DB-002_BUYER_COMPANY_테이블_스키마.md`
- `DB-003_SI_PARTNER_테이블_스키마.md`
- `DB-004_MANUFACTURER_테이블_스키마.md`
- `DB-005_CONTRACT_테이블_스키마.md`
- `DB-006_ESCROW_TX_테이블_스키마.md`
- `DB-007_AS_TICKET_테이블_스키마.md`
- `DB-008_BADGE_테이블_스키마.md`
- `DB-009_SI_PROFILE_테이블_스키마.md`
- `DB-010_O2O_BOOKING_테이블_스키마.md`
- `DB-011_WARRANTY_테이블_스키마.md`
- `DB-012_QUOTE_LEAD_테이블_스키마.md`
- `DB-013_PARTNER_PROPOSAL_테이블_스키마.md`
- `DB-014_NOTIFICATION_테이블_스키마.md`
- `DB-015_EVENT_LOG_테이블_스키마.md`
- `DB-016_ROBOT_MODEL_테이블_스키마.md`
- `DB-017_AS_ENGINEER_테이블_스키마.md`

### UI (15)
- `UI-001_수요기업_회원가입_페이지.md`
- `UI-002_SI파트너_회원가입_페이지.md`
- `UI-003_SI파트너_검색결과_목록페이지.md`
- `UI-004_SI프로필_상세페이지.md`
- `UI-005_에스크로_결제흐름_UI.md`
- `UI-006_검수_승인거절_UI.md`
- `UI-007_긴급AS_접수_UI.md`
- `UI-008_Admin_대시보드.md`
- `UI-009_제조사_포털.md`
- `UI-010_RaaS_비용비교_계산기UI.md`
- `UI-011_수기견적_요청팝업.md`
- `UI-012_O2O_예약캘린더_UI.md`
- `UI-013_SI파트너_포털.md`
- `UI-014_알림함_UI.md`
- `UI-015_공통_레이아웃.md`

---

본 문서를 사용하는 모든 Agent는, 실제 구현 시 반드시 해당 Task 원문(특히 AC/DoD/Dependencies)을 함께 확인하여 세부 기준을 확정한다.
