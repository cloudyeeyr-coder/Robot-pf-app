---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-012: O2O 매니저 파견 예약 캘린더 UI — 지역·날짜 선택·가용 슬롯·대기 예약 (Phase 2)"
labels: 'feature, frontend, ui, o2o, booking, priority:medium, phase-2'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-012] O2O 매니저 파견 예약 캘린더 UI (Phase 2)
- 목적: 비대면 계약에 불신감을 가진 수요기업이 O2O 매니저의 현장 방문 상담을 예약할 수 있는 캘린더 UI를 제공한다. 희망 지역·날짜 선택 시 가용 매니저 슬롯을 조회(≤2초)하고, 슬롯이 없을 경우 가장 가까운 가용 일정을 자동 추천하며 대기 예약 옵션을 제공한다. Phase 2 대비 사전 정의 범위이나, 스키마와 UI 구조를 Phase 1에서 확보한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-023`](../06_SRS-v1.md) — 가용 매니저 슬롯 조회
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-024`](../06_SRS-v1.md) — 예약 확정 이중 알림 (SMS + 카카오)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-025`](../06_SRS-v1.md) — 방문 보고서 등록
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-026`](../06_SRS-v1.md) — 슬롯 0건 시 자동 추천 + 대기 예약
- SRS 문서: [`06_SRS-v1.md#CLI-01`](../06_SRS-v1.md) — 수요 기업 웹 포털
- 데이터 모델: `O2O_BOOKING` (6.2.9) — status ENUM 4종
- 연동: `API-023`/`FC-025` (예약 생성), `FQ-011` (슬롯 조회), `FC-026` (슬롯 0건 추천)
- Mock: `MOCK-007` (O2O 예약 5건, 매니저 슬롯)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 페이지 구조
- [ ] 경로: `/app/booking/page.tsx` (예약 캘린더 메인)
- [ ] 예약 완료 확인: `/app/booking/[bookingId]/page.tsx`
- [ ] 인증 필수 (Buyer 역할)
- [ ] Phase 2 표시 배너: "현재 수도권 지역에서 시범 운영 중입니다"

### 2단계: 지역·날짜 선택 UI
- [ ] **지역 선택**: `Select` (시/도 → 구/군 2단 드롭다운, 수도권 우선)
- [ ] **날짜 선택**: `Calendar` 컴포넌트 (shadcn/ui DatePicker)
  - 오늘 이전 날짜 비활성화
  - 주말/공휴일 비활성화 (영업일만 선택 가능)
  - 선택 가능 범위: 오늘 ~ 30일 후
- [ ] 지역+날짜 선택 시 자동으로 가용 슬롯 조회 트리거

### 3단계: 가용 슬롯 표시
- [ ] `FQ-011` Server Component 호출 (≤2초)
- [ ] 슬롯 카드 목록:
  - 시간대 (오전 10:00, 오후 14:00, 오후 16:00 등)
  - 매니저 이름 (익명 처리 또는 이니셜)
  - '예약하기' 버튼
- [ ] 로딩 중 Skeleton UI
- [ ] **슬롯 0건 시** (REQ-FUNC-026):
  - "선택하신 날짜에 가용 매니저가 없습니다" 안내
  - "가장 가까운 가용 일정: YYYY-MM-DD" 자동 추천 (≤2초)
  - '추천 일정으로 예약' 버튼
  - '대기 예약 신청' 버튼 → 대기 예약 접수

### 4단계: 예약 확정 폼
- [ ] 선택된 슬롯 정보 요약: 날짜, 시간, 지역
- [ ] 추가 정보 입력:
  - 방문 주소 상세 (`Input`, 필수)
  - 상담 희망 내용 (`Textarea`, 선택, 최대 500자)
- [ ] '예약 확정' 버튼 → `FC-025` Server Action 호출
- [ ] 성공 시: "예약이 확정되었습니다!" + SMS/카카오 이중 알림 안내
- [ ] 예약 확인 페이지: 예약 번호, 날짜/시간, 매니저 정보, 취소 버튼

### 5단계: 에러 및 예외 처리
- [ ] 이미 예약된 슬롯 선택 시 → "해당 시간대가 마감되었습니다" 안내 + 슬롯 갱신
- [ ] 네트워크 에러 → 재시도 버튼
- [ ] 지역 미지원 → "해당 지역은 아직 서비스 준비 중입니다" 안내

### 6단계: 반응형 및 접근성
- [ ] Desktop: 좌측 캘린더 + 우측 슬롯 목록
- [ ] Mobile: 상단 캘린더 + 하단 슬롯 스크롤
- [ ] 캘린더 키보드 네비게이션 (화살표, Enter 선택)
- [ ] 슬롯 카드 `role="option"`, 선택 시 `aria-selected`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 가용 슬롯 조회**
- **Given:** 지역 "서울 강남구" + 날짜 선택
- **When:** 슬롯 조회 실행
- **Then:** 가용 슬롯 표시 ≤2초, 3일 내 가용 ≥2개 (수도권)

**Scenario 2: 예약 확정 및 이중 알림**
- **Given:** 가용 슬롯 선택 + 주소 입력
- **When:** '예약 확정' 클릭
- **Then:** O2O_BOOKING INSERT, SMS+카카오 이중 알림 ≤30초

**Scenario 3: 슬롯 0건 시 대안 추천**
- **Given:** 선택 날짜에 가용 슬롯 0건
- **When:** 조회 결과 표시
- **Then:** "가장 가까운 가용 일정(D+N)" 추천 ≤2초 + 대기 예약 옵션

**Scenario 4: 대기 예약 신청**
- **Given:** 슬롯 0건 상태
- **When:** '대기 예약 신청' 클릭
- **Then:** 대기 예약 접수 + Ops Slack 알림

**Scenario 5: 주말/공휴일 선택 차단**
- **Given:** 캘린더에서 토요일 선택 시도
- **When:** 날짜 클릭
- **Then:** 선택 불가 (비활성 상태), 영업일만 선택 가능

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (슬롯 조회) + Client Component (캘린더, 폼)
- **UI:** shadcn/ui `Calendar`, `Card`, `Select`, `Dialog` — CON-14
- **성능:** 슬롯 조회 ≤2초, 알림 발송 ≤30초 (REQ-FUNC-023, 024)
- **인증:** Buyer 역할 필수
- **Phase:** Phase 2 범위이나 스키마/UI 구조 Phase 1 사전 확보
- **접근성:** 캘린더 키보드 접근, WCAG 2.1 AA

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~5) 충족
- [ ] 캘린더 날짜 선택 테스트 (영업일만)
- [ ] 슬롯 조회 + 0건 대안 추천 테스트
- [ ] 예약 확정 통합 테스트
- [ ] 반응형 캘린더 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-007 | O2O 예약 5건 + 매니저 슬롯 Seed | 필수 |
| DB-010 | O2O_BOOKING 스키마 | 필수 |
| API-023 | createO2oBooking DTO | 필수 |
| FQ-011 | 가용 슬롯 조회 Query | 필수 |
| FC-025 | 예약 생성 Command | 필수 |
| FC-023 | 알림 발송 (SMS+카카오) | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| TEST-022 | 가용 슬롯 조회 테스트 |
| TEST-023 | 예약 확정 이중 알림 테스트 |
| TEST-025 | 슬롯 0건 대기 예약 테스트 |

### 참고사항
- Phase 2 범위 — MVP에서는 DB 스키마·DTO·UI 골격만 사전 구축
- 방문 보고서 등록 UI는 매니저 전용 내부 도구로 별도 구현 예정
