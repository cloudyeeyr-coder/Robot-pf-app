---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-014: 알림함 UI — 내장 웹 알림 목록·읽음 처리·실시간 업데이트"
labels: 'feature, frontend, ui, notification, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-014] 내장 웹 알림함 UI
- 목적: 카카오톡/SMS 외부 알림 장애 시 Fallback 역할을 하는 플랫폼 내장 웹 알림함을 제공한다. 모든 역할(Buyer/SI/Manufacturer/Admin)의 사용자가 에스크로 상태 변경, AS 배정, 뱃지 발급/만료, 파트너 제안 등 핵심 이벤트 알림을 웹 내에서 확인하고 읽음 처리할 수 있다. 헤더의 알림 아이콘(벨)에 미읽음 수를 뱃지로 표시하고, 클릭 시 알림 드롭다운을 펼친다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#3.1`](../06_SRS-v1.md) — 외부 알림 장애 시 내장 웹 알림함 우회 처리
- SRS 문서: [`06_SRS-v1.md#CLI-01~04`](../06_SRS-v1.md) — 모든 클라이언트 포털
- 데이터 모델: `NOTIFICATION` (DB-014) — 수신자, 유형, 내용, 읽음 여부
- 연동: `FC-024` (내장 웹 알림 생성·읽음 처리·목록 조회)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 알림 아이콘 및 드롭다운 (헤더 컴포넌트)
- [ ] 공통 헤더(UI-015)에 알림 벨 아이콘 추가
- [ ] 미읽음 알림 수 뱃지 표시 (빨간 원형, 숫자)
  - 0건일 때 뱃지 미표시
  - 99건 초과 시 "99+" 표시
- [ ] 벨 아이콘 클릭 → 알림 드롭다운 패널 (최대 10건 미리보기)
- [ ] 드롭다운 하단: '전체 알림 보기' 링크 → `/notifications`

### 2단계: 알림 목록 전체 페이지 (`/notifications`)
- [ ] 알림 목록 (최신순 정렬):
  - 알림 유형 아이콘 (에스크로 💰 / AS 🔧 / 뱃지 🏅 / 제안 🤝 / 시스템 ⚙️)
  - 알림 제목 + 내용 요약 (최대 2줄)
  - 발생 시각 (상대 시간: "3분 전", "2시간 전", "어제")
  - 읽음/미읽음 상태 (미읽음: 좌측 파란 점 + 볼드 텍스트)
- [ ] 필터: 전체 / 미읽음만
- [ ] '모두 읽음 처리' 버튼
- [ ] 페이지네이션 (20건/페이지)

### 3단계: 읽음 처리
- [ ] 개별 알림 클릭 → 읽음 상태 변경 (DB UPDATE is_read=true)
- [ ] 알림 클릭 → 관련 페이지로 이동 (딥링크):
  - 에스크로 알림 → `/contracts/[id]/payment/status`
  - AS 알림 → `/contracts/[id]/as/[ticketId]`
  - 뱃지 알림 → `/partner/badges` 또는 `/manufacturer/badges`
  - 제안 알림 → `/partner/proposals`
- [ ] '모두 읽음 처리' → 전체 미읽음 알림 일괄 업데이트

### 4단계: 실시간 업데이트
- [ ] 30초 간격 폴링으로 신규 알림 확인
- [ ] 신규 알림 도착 시:
  - 미읽음 뱃지 숫자 갱신
  - 드롭다운 열려 있으면 목록 상단에 신규 알림 추가 (애니메이션)
- [ ] 향후 WebSocket/SSE 전환 대비 인터페이스 설계

### 5단계: 반응형 및 접근성
- [ ] Desktop: 헤더 우측 드롭다운 (너비 360px)
- [ ] Mobile: 드롭다운 → 풀스크린 시트 또는 전체 페이지 이동
- [ ] 벨 아이콘 `aria-label="알림 N건"`, 뱃지 `aria-live="polite"`
- [ ] 드롭다운 `role="menu"`, 알림 항목 `role="menuitem"`
- [ ] 키보드: Esc 닫기, Tab 알림 항목 순회

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 미읽음 알림 뱃지 표시**
- **Given:** 미읽음 알림 5건 존재
- **When:** 페이지 로드
- **Then:** 헤더 벨 아이콘에 빨간 뱃지 "5" 표시

**Scenario 2: 알림 클릭 및 읽음 전환**
- **Given:** 미읽음 에스크로 알림
- **When:** 해당 알림 클릭
- **Then:** 읽음 처리 (파란 점 제거), 에스크로 상태 페이지로 이동

**Scenario 3: 모두 읽음 처리**
- **Given:** 미읽음 알림 10건
- **When:** '모두 읽음 처리' 클릭
- **Then:** 전체 미읽음→읽음, 뱃지 숫자 0 (뱃지 미표시)

**Scenario 4: 실시간 알림 갱신**
- **Given:** 드롭다운 열려 있는 상태에서 신규 알림 발생
- **When:** 폴링 주기 도달
- **Then:** 드롭다운 상단에 신규 알림 추가, 뱃지 숫자 +1

**Scenario 5: 알림 딥링크**
- **Given:** AS 배정 완료 알림
- **When:** 알림 클릭
- **Then:** 해당 AS 티켓 추적 페이지(`/contracts/[id]/as/[ticketId]`)로 이동

## :gear: Technical & Non-Functional Constraints
- **구현:** Client Component (드롭다운, 폴링, 읽음 처리)
- **UI:** shadcn/ui `Popover` (드롭다운), `Badge`, `Button` — CON-14
- **폴링:** 30초 간격, 향후 WebSocket/SSE 전환 대비 추상화 계층
- **성능:** 알림 목록 조회 ≤ 500ms, 읽음 처리 ≤ 200ms
- **보안:** 알림은 본인 것만 조회 가능 (RBAC + 수신자 ID 검증)
- **접근성:** 벨 aria-label 동적 갱신, 드롭다운 role="menu", WCAG 2.1 AA

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~5) 충족
- [ ] 미읽음 뱃지 렌더링 테스트 (0건, N건, 99+)
- [ ] 읽음 처리 (개별/전체) 테스트
- [ ] 딥링크 이동 테스트 (각 알림 유형별)
- [ ] 폴링 갱신 테스트
- [ ] 반응형 (드롭다운/풀스크린) 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| DB-014 | NOTIFICATION 테이블 스키마 | 필수 |
| FC-024 | 내장 웹 알림 생성·읽음·목록 로직 | 필수 |
| UI-015 | 공통 레이아웃 (헤더에 벨 아이콘 배치) | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| — | 모든 알림 발생 태스크의 UI 피드백 채널 |

### 참고사항
- 외부 알림(카카오/SMS) 장애 시 1차 Fallback 역할 (SRS 3.1)
- WebSocket 실시간 푸시는 Phase 2 — MVP는 30초 폴링
- 알림 데이터 보존 기간: 90일 (NFR-015 로그 보존 정책 준수)
