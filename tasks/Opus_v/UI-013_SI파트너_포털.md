---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-013: SI 파트너 포털 — 프로필 등록/수정·파트너 제안 수락/거절·뱃지 현황"
labels: 'feature, frontend, ui, si-partner, portal, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-013] SI 파트너 포털
- 목적: SI 파트너가 자신의 프로필 정보를 관리(등록/수정)하고, 제조사로부터 받은 파트너 제안을 수락/거절하며, 현재 보유 중인 인증 뱃지 현황을 확인하는 전용 포털을 제공한다. SI 파트너의 수요기업 노출 품질을 직접 관리할 수 있는 핵심 운영 화면이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-028`](../06_SRS-v1.md) — SI 파트너 프로필 등록
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-030`](../06_SRS-v1.md) — 파트너 제안 수락/거절
- SRS 문서: [`06_SRS-v1.md#CLI-02`](../06_SRS-v1.md) — SI 파트너 웹 포털
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.4`](../06_SRS-v1.md) — 뱃지 발급·관리 흐름
- 데이터 모델: `SI_PARTNER` (6.2.2), `SI_PROFILE` (6.2.8), `BADGE` (6.2.7), `PARTNER_PROPOSAL` (6.2.12)
- 연동: `FC-019` (respondProposal), `FQ-002` (프로필 조회)
- Mock: `MOCK-001` (SI 파트너), `MOCK-003` (뱃지/제안)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 레이아웃
- [ ] SI 포털 레이아웃: `/app/partner/layout.tsx` (전용 사이드바)
- [ ] 서브 라우트:
  - `/partner/profile` — 프로필 관리
  - `/partner/proposals` — 파트너 제안 목록
  - `/partner/badges` — 뱃지 현황
- [ ] RBAC: SI Partner 역할 전용

### 2단계: 프로필 관리 (`/partner/profile`)
- [ ] **프로필 조회 모드**: 현재 등록된 정보 읽기 전용 표시
- [ ] **프로필 수정 모드**: '수정' 버튼 → 폼 전환
  - 회사 기본 정보 (회사명, 지역, 담당자) 수정
  - 시공 이력 (완료/실패 프로젝트 수) 업데이트
  - 역량 태그 추가/삭제 (Tag Input)
  - 시공 성공률 자동 재계산
- [ ] '저장' 버튼 → Server Action 호출 → 성공 Toast
- [ ] Zod 유효성 검증 (UI-002와 동일 스키마 재사용)
- [ ] Admin 검토 상태 표시: "승인됨" / "검토 대기 중" 뱃지

### 3단계: 파트너 제안 관리 (`/partner/proposals`)
- [ ] 수신 제안 목록 테이블:
  - 컬럼: 제조사명, 제안일, 응답 기한(D+5), 상태(pending/accepted/rejected/expired), 메시지
  - 상태별 필터 탭
- [ ] **수락 액션**: '수락' 버튼 → 확인 모달 → `FC-019` (respondProposal: accept)
  - 수락 시: 파트너십 뱃지 자동 발급, "파트너십이 체결되었습니다!" Toast
- [ ] **거절 액션**: '거절' 버튼 → 거절 사유 입력 (선택) → `FC-019` (respondProposal: reject)
  - 거절 시: 제조사에 알림, "제안을 거절했습니다" Toast
- [ ] 응답 기한 카운트다운 표시 (D-5, D-4, ... D-1)
- [ ] 만료 예정 제안 경고 색상 (D-2 이하)

### 4단계: 뱃지 현황 (`/partner/badges`)
- [ ] 보유 뱃지 카드 목록:
  - 제조사명, 발급일, 만료일, 활성 상태
  - 만료 D-7 경고 표시
  - 만료/철회된 뱃지는 회색 처리 + "만료됨"/"철회됨" 라벨
- [ ] 뱃지 통계: 활성 N개, 만료 N개, 철회 N개

### 5단계: 반응형 및 접근성
- [ ] Desktop: 사이드바(200px) + 메인 콘텐츠
- [ ] Tablet: 사이드바 접이식
- [ ] Mobile: 하단 탭 바 (프로필/제안/뱃지), 테이블 → 카드 뷰
- [ ] 제안 수락/거절 확인 모달 Focus Trap
- [ ] 카운트다운 `aria-live="polite"`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 프로필 수정 및 저장**
- **Given:** SI 파트너가 프로필 페이지 접근
- **When:** 역량 태그에 "비전검사" 추가 → '저장' 클릭
- **Then:** SI_PROFILE 업데이트, 성공 Toast, 검색 결과에 반영

**Scenario 2: 파트너 제안 수락**
- **Given:** pending 상태 제안 존재
- **When:** '수락' → 확인 모달 → '수락 확정'
- **Then:** 파트너십 뱃지 자동 발급, 제조사 대시보드 갱신, "체결 완료" Toast

**Scenario 3: 파트너 제안 거절**
- **Given:** pending 상태 제안
- **When:** '거절' → 사유 입력 → 확인
- **Then:** status=rejected, 제조사 알림 발송

**Scenario 4: 응답 기한 카운트다운**
- **Given:** 제안 응답 기한 잔여 2일
- **When:** 제안 목록 렌더링
- **Then:** "D-2" 경고 색상 표시 + 만료 안내

**Scenario 5: 뱃지 만료 경고**
- **Given:** 뱃지 만료 D-5
- **When:** 뱃지 현황 페이지 접근
- **Then:** 해당 뱃지 카드에 "5일 후 만료" 경고 표시

**Scenario 6: 반응형 Mobile**
- **Given:** 모바일 (≤768px) 접근
- **When:** 포털 렌더링
- **Then:** 하단 탭 바 네비게이션, 카드 뷰 정상 동작

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (프로필/뱃지 조회) + Client Component (폼, 모달, 탭)
- **UI:** Tailwind CSS + shadcn/ui (`Table`, `Dialog`, `Tabs`, `Badge`, `Card`) — CON-14
- **인증:** RBAC SI Partner 역할 전용 (REQ-NF-016)
- **성능:** LCP p95 ≤ 2,000ms, 뱃지 반영 ≤1시간
- **접근성:** 모달 Focus Trap, 카운트다운 aria-live, WCAG 2.1 AA

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] 프로필 수정 폼 단위 테스트
- [ ] 제안 수락/거절 통합 테스트 (뱃지 자동 발급 확인)
- [ ] 뱃지 만료 경고 표시 테스트
- [ ] RBAC SI Partner 접근 제어 테스트
- [ ] 반응형 레이아웃 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-001 | SI 파트너 샘플 데이터 | 필수 |
| MOCK-003 | 뱃지 + 파트너 제안 Seed | 필수 |
| FC-019 | respondProposal Command | 필수 |
| FQ-002 | SI 프로필 상세 조회 Query | 필수 |
| FC-003 | RBAC 미들웨어 (SI Partner) | 필수 |
| UI-002 | SI 파트너 회원가입 (최초 프로필 생성) | 권장 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| TEST-017 | 파트너 제안 수락/거절/만료 GWT 테스트 |

### 참고사항
- 제조사 측 제안 발송 UI는 `UI-009` (제조사 포털) 범위
- 프로필 수정 Zod 스키마는 `UI-002`와 공유 (DRY 원칙)
- SI 등급(tier) 변경은 Admin 전용 — SI 포털에서 읽기 전용
