---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-008: Admin 대시보드 — 에스크로 관리·AS SLA 모니터링·이벤트 로그"
labels: 'feature, frontend, ui, admin, dashboard, priority:critical'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-008] 플랫폼 Admin 대시보드
- 목적: 플랫폼 운영팀이 에스크로 결제 관리(예치 확인·방출 확인·분쟁 목록), AS SLA 모니터링(출동률·미배정 건·평균 해결 시간), 시스템 이벤트 로그를 하나의 통합 대시보드에서 실시간으로 모니터링하고 관리할 수 있는 운영 허브를 제공한다. 모든 에스크로 상태 변경은 Admin 수동 확인 기반(CON-01)으로 처리된다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-001~003`](../06_SRS-v1.md) — 에스크로 결제/검수/분쟁
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-033~036`](../06_SRS-v1.md) — 모니터링 알림
- SRS 문서: [`06_SRS-v1.md#CLI-04`](../06_SRS-v1.md) — Admin 대시보드 웹 애플리케이션
- 데이터 모델: `CONTRACT`, `ESCROW_TX`, `AS_TICKET`, `EVENT_LOG`
- 연동: `FQ-007` (에스크로 목록), `FQ-009` (이벤트 로그), `FQ-010` (AS SLA), `FC-006`/`FC-009` (에스크로 확인)
- Mock: `MOCK-002` (계약/에스크로), `MOCK-005` (AS 티켓)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 레이아웃
- [ ] 경로: `/app/admin/page.tsx` (대시보드 메인)
- [ ] Admin 전용 사이드바 레이아웃: `/app/admin/layout.tsx`
- [ ] 서브 라우트: `/admin/escrow`, `/admin/as-sla`, `/admin/events`, `/admin/disputes`
- [ ] RBAC 인증 필수: Admin 역할 전용 (non-Admin → 403 리다이렉트)

### 2단계: 대시보드 메인 — KPI 서머리 카드
- [ ] 상단 KPI 카드 (4개 가로 배치):
  - 에스크로 대기 건수 (state=held, 방출 대기)
  - 분쟁 진행 건수 (status=disputed)
  - AS 미배정 건수 (assigned_at IS NULL, reported_at > 24h)
  - 이번 달 가입 완료 수 (signup_complete 이벤트 집계)
- [ ] 각 카드 클릭 → 해당 상세 페이지 이동

### 3단계: 에스크로 관리 섹션 (`/admin/escrow`)
- [ ] 에스크로 거래 목록 테이블:
  - 컬럼: 계약 ID, 수요기업명, SI 파트너명, 금액, 상태(held/released/refunded), 예치일, Admin 메모
  - 상태별 필터 탭: 전체 / 예치 대기 / 방출 대기 / 완료 / 환불
  - 정렬: 예치일 최신순
- [ ] **예치 확인 액션**: '입금 확인' 버튼 → 확인 모달 (Admin 메모 입력 필수) → `FC-006` 호출
- [ ] **방출 확인 액션**: '방출 확인' 버튼 → 확인 모달 ("수기 송금 완료 확인") → `FC-009` 호출
- [ ] 분쟁 목록 (`/admin/disputes`): 분쟁 상태 계약 목록 + 중재 진행 상태 표시

### 4단계: AS SLA 모니터링 섹션 (`/admin/as-sla`)
- [ ] SLA 대시보드 카드:
  - 24시간 내 출동 성공률 (목표 ≥95%)
  - 미배정 건수 (24시간 초과)
  - 평균 해결 시간
- [ ] AS 티켓 테이블:
  - 컬럼: 티켓 ID, 계약 ID, 긴급도, 접수일, 배정일, 출동일, 해결일, SLA 충족
  - 필터: 전체 / 미배정 / 진행 중 / 완료 / SLA 미충족
- [ ] SLA 미충족 건 빨간색 강조 + 경고 아이콘

### 5단계: 이벤트 로그 섹션 (`/admin/events`)
- [ ] 이벤트 로그 테이블:
  - 컬럼: 이벤트 유형, 사용자 ID, 발생 시각, 페이로드 요약
  - 필터: 이벤트 유형별 (signup_complete, escrow_deposit_confirmed 등)
  - 검색: 사용자 ID / 날짜 범위
- [ ] 이벤트 유형별 집계 차트 (일별/주별 트렌드)

### 6단계: 반응형 및 접근성
- [ ] Desktop: 사이드바(240px) + 메인 콘텐츠 영역
- [ ] Tablet: 사이드바 접이식 (햄버거 메뉴)
- [ ] Mobile: 사이드바 → 하단 탭 바, 테이블 → 카드 뷰 전환
- [ ] 테이블 `aria-label`, 상태 뱃지 `aria-label`, KPI 카드 접근성

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 에스크로 예치 확인 (Admin)**
- **Given:** state=pending 에스크로 건
- **When:** Admin이 '입금 확인' → 메모 입력 → 확인
- **Then:** state=held, admin_verified_at 기록, 수요기업에 알림 전송

**Scenario 2: 에스크로 방출 확인 (Admin)**
- **Given:** 검수 승인 완료 + state=held
- **When:** Admin이 '방출 확인' 클릭
- **Then:** state=released, released_at 기록, SI 대금 지급 알림

**Scenario 3: AS SLA 미배정 경고**
- **Given:** AS 티켓 접수 후 24시간 미배정 건 존재
- **When:** AS SLA 대시보드 조회
- **Then:** 미배정 건수 카드 빨간색 경고, 해당 티켓 테이블 강조 표시

**Scenario 4: 이벤트 로그 조회**
- **Given:** signup_complete 이벤트 50건 기록
- **When:** 이벤트 로그 페이지 접근 + 유형 필터 적용
- **Then:** signup_complete 이벤트만 필터링되어 시간순 표시

**Scenario 5: Non-Admin 접근 차단**
- **Given:** Buyer 역할 사용자
- **When:** `/admin` 접근 시도
- **Then:** 403 Forbidden + 로그인 페이지 리다이렉트

**Scenario 6: 분쟁 목록 조회**
- **Given:** disputed 상태 계약 3건
- **When:** 분쟁 목록 페이지 접근
- **Then:** 3건 모두 표시, 분쟁 접수일·중재 상태·관련 계약 정보 포함

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (데이터 프리페칭) + Client Component (테이블 필터/정렬, 모달)
- **UI:** Tailwind CSS + shadcn/ui (`Table`, `Dialog`, `Tabs`, `Badge`, `Card`) — CON-14
- **인증:** RBAC Admin 전용 + TOTP MFA 필수 (REQ-NF-016, FC-004)
- **성능:** 대시보드 LCP p95 ≤ 2,000ms, 테이블 페이지네이션 서버 사이드
- **보안:** Admin 메모 입력 시 XSS 이스케이프, 에스크로 금액 로깅 마스킹, Admin 작업 감사 로그
- **접근성:** 테이블 aria-label, 모달 Focus Trap, WCAG 2.1 AA

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] 에스크로 예치/방출 확인 플로우 통합 테스트
- [ ] RBAC Admin 접근 제어 테스트
- [ ] 테이블 필터/정렬/페이지네이션 테스트
- [ ] KPI 카드 데이터 정확성 테스트
- [ ] 반응형 레이아웃 (사이드바 접이식, 테이블→카드) 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-002 | 계약 + 에스크로 Seed | 필수 |
| MOCK-005 | AS 티켓 Seed | 필수 |
| FC-003 | RBAC 미들웨어 (Admin) | 필수 |
| FC-004 | Admin TOTP MFA | 필수 |
| FC-006 | 에스크로 예치 확인 Command | 필수 |
| FC-009 | 자금 방출 확인 Command | 필수 |
| FQ-007 | 에스크로 목록 조회 Query | 필수 |
| FQ-010 | AS SLA 모니터링 Query | 필수 |
| FQ-009 | 이벤트 로그 조회 Query | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| TEST-002 | updateEscrowStatus 테스트 |
| TEST-006 | confirmRelease 테스트 |
| TEST-029~032 | 모니터링 알림 테스트 |

### 참고사항
- Admin 대시보드는 플랫폼의 핵심 운영 허브 — 의존성이 가장 많은 태스크
- Slack Webhook 알림은 `API-026`/`CRON-006~009` 범위 — 대시보드는 결과 표시
- 견적 관리(QUOTE_LEAD)는 `FQ-008` 연동으로 추후 확장 가능
