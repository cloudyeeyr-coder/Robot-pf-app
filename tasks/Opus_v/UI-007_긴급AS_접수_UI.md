---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-007: 긴급 AS 접수 UI — AS 접수 폼·배정 현황 추적 화면"
labels: 'feature, frontend, ui, as-warranty, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-007] 긴급 AS 접수 및 배정 현황 추적 UI
- 목적: SI 파트너의 부도·폐업·연락두절 상황에서 수요기업이 긴급 AS를 접수하고, 로컬 AS 엔지니어 배정 및 출동 진행 상황을 실시간으로 추적할 수 있는 UI를 제공한다. AS 접수부터 엔지니어 배정(≤4시간), 현장 출동(≤24시간), 해결 완료까지 전 과정을 4단계 Stepper로 시각화하여 수요기업의 불안감을 해소한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-007`](../06_SRS-v1.md) — SI 부도 시 로컬 AS 엔지니어 자동 매칭
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-008`](../06_SRS-v1.md) — AS 티켓 추적 및 SLA 자동 판정
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.3`](../06_SRS-v1.md) — 긴급 AS 접수 및 출동 흐름
- Use Case: [`06_SRS-v1.md#UC-08`](../06_SRS-v1.md) — 긴급 AS 티켓 접수
- 데이터 모델: `AS_TICKET` (6.2.6) — priority ENUM, 4단계 timestamp
- 연동: `API-009`/`FC-011` (AS 접수), `API-010`/`FC-012` (엔지니어 배정), `FC-013` (완료 처리)
- Mock 데이터: `MOCK-005` (AS 티켓 10건, 단계별)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 페이지 구조
- [ ] AS 접수 폼: `/app/contracts/[contractId]/as/new/page.tsx`
- [ ] AS 추적 화면: `/app/contracts/[contractId]/as/[ticketId]/page.tsx`
- [ ] AS 목록 (내 티켓): `/app/my/as-tickets/page.tsx`
- [ ] 인증 필수 (Buyer 역할) + 계약 소유권 검증

### 2단계: AS 접수 폼
- [ ] 연결 계약 정보 표시 (SI 파트너명, 계약 상태)
- [ ] 접수 필드:
  - 증상 설명 (`symptom_description`) — `Textarea` (필수, 최소 20자, 최대 2000자)
  - 긴급도 (`priority`) — `RadioGroup` (normal: 일반 / urgent: 긴급)
  - 긴급 선택 시 안내: "긴급 AS는 SI 부도·폐업·연락두절 확인 후 접수 가능합니다"
  - 현장 사진 첨부 (선택) — 파일 업로드 (최대 5장, 10MB 이하/장)
- [ ] Zod 유효성 검증: `symptom_description` 최소 20자, `priority` 필수
- [ ] 제출 중 '접수 중...' 로딩 스피너

### 3단계: AS 배정 현황 추적 Stepper
- [ ] 4단계 Stepper UI:
  - **Step 1: 접수 완료** — `reported_at` 시각, 티켓 번호
  - **Step 2: 엔지니어 배정** — `assigned_at` 시각, 엔지니어 이름/연락처 (배정 목표: ≤4시간)
  - **Step 3: 현장 출동** — `dispatched_at` 시각 (출동 목표: ≤24시간)
  - **Step 4: 해결 완료** — `resolved_at` 시각, SLA 충족 여부 표시
- [ ] 현재 단계 강조 표시 (활성 단계 색상 구분)
- [ ] 각 단계 목표 시간 대비 경과 시간 표시 (배정: "2시간 경과 / 목표 4시간")
- [ ] 목표 시간 초과 시 경고 표시 (빨간색)

### 4단계: 실시간 상태 업데이트
- [ ] 30초 간격 폴링으로 티켓 상태 갱신
- [ ] 상태 변경 시 Toast 알림 ("엔지니어가 배정되었습니다!")
- [ ] SLA 충족 여부 자동 표시: `resolved_at - reported_at ≤ 24h` → ✅ SLA 충족 / ❌ SLA 미충족

### 5단계: 에러 및 예외 처리
- [ ] SI 정상 상태(부도/폐업 아님)에서 긴급 AS 접수 시도 → "현재 SI 파트너가 정상 운영 중입니다. 먼저 SI에 직접 연락해주세요." 안내
- [ ] 존재하지 않는 계약/티켓 → 404
- [ ] 타인 계약 접근 → 403

### 6단계: 반응형 및 접근성
- [ ] Mobile: Stepper 세로형, 폼 풀 너비
- [ ] Desktop: Stepper 가로형 + 상세 정보 우측
- [ ] Stepper `aria-current="step"`, 경과 시간 `aria-live="polite"`
- [ ] 파일 업로드 드래그&드롭 + 버튼 클릭 모두 지원

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 긴급 AS 접수 성공**
- **Given:** SI 부도 상태의 계약
- **When:** 증상 "로봇 암 작동 중 정지, 에러 코드 E-421" + 긴급도 urgent 제출
- **Then:** AS_TICKET 생성 (priority=urgent), 티켓 번호 발급, 추적 페이지 리다이렉트

**Scenario 2: SI 정상 상태에서 긴급 접수 차단**
- **Given:** SI 파트너가 정상 운영 중
- **When:** 긴급 AS 접수 시도
- **Then:** "SI가 정상 운영 중입니다" 안내, 접수 불가

**Scenario 3: 엔지니어 배정 현황 표시**
- **Given:** AS 티켓 접수 후 엔지니어 배정 완료
- **When:** 추적 페이지 조회
- **Then:** Step 2 활성화, 엔지니어명·연락처·배정 시각 표시, 경과 시간 표시

**Scenario 4: SLA 자동 판정 표시**
- **Given:** AS 해결 완료 (reported_at → resolved_at = 20시간)
- **When:** 추적 페이지 조회
- **Then:** "✅ SLA 충족 (20시간 / 목표 24시간)" 표시

**Scenario 5: 증상 설명 미입력 제출 차단**
- **Given:** 증상 설명 10자 미만 입력
- **When:** 제출 시도
- **Then:** "증상 설명을 20자 이상 입력해주세요" 인라인 에러, 제출 차단

**Scenario 6: 반응형 Mobile Stepper**
- **Given:** 모바일 (≤768px) 접근
- **When:** 추적 페이지 렌더링
- **Then:** Stepper 세로형 표시, 각 단계 정보 정상 표시

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (티켓 데이터) + Client Component (폼, 폴링, Stepper)
- **UI:** Tailwind CSS + shadcn/ui (`RadioGroup`, `Textarea`, `Stepper` 커스텀) — CON-14
- **인증:** RBAC Buyer + 계약 소유권 (REQ-NF-016)
- **성능:** LCP p95 ≤ 2,000ms, 폴링 30초 간격
- **파일 업로드:** Supabase Storage 또는 Vercel Blob (이미지 10MB 제한)
- **접근성:** Stepper aria-current, 경과시간 aria-live, WCAG 2.1 AA

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] AS 접수 폼 Zod 유효성 테스트
- [ ] Stepper 상태별 렌더링 테스트 (4단계 분기)
- [ ] SLA 판정 표시 테스트
- [ ] RBAC 접근 제어 테스트
- [ ] 반응형 레이아웃 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-005 | AS 티켓 10건 + AS 엔지니어 8명 Seed | 필수 |
| API-009 | createAsTicket DTO | 필수 |
| FC-011 | AS 접수 Command | 필수 |
| FC-012 | 엔지니어 배정 Command | 필수 |
| FC-003 | RBAC 미들웨어 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| TEST-008 | 긴급 AS 접수 테스트 |
| TEST-009 | AS 엔지니어 배정 테스트 |
| TEST-010 | SLA 자동 판정 테스트 |

### 참고사항
- 엔지니어 배정 로직(지역·역량 매칭)은 `FC-012` 백엔드 범위 — UI는 결과 표시만
- 배정 목표 4시간, 출동 목표 24시간은 Admin 설정 가능 (Phase 2)
