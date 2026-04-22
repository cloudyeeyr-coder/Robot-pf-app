---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-003: SI 파트너 검색 결과 목록 페이지 — 필터 패널·카드 리스트·페이지네이션"
labels: 'feature, frontend, ui, search, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-003] SI 파트너 검색 결과 목록 페이지
- 목적: 수요기업(Buyer)이 지역·브랜드·역량 태그·뱃지 보유 여부 등 다양한 조건으로 SI 파트너를 검색·필터링하고, 카드 형태의 목록에서 비교할 수 있는 핵심 탐색 UI를 제공한다. 검색 결과에는 뱃지 보유 여부·시공 성공률·지역이 명시되며, 뱃지 필터 적용 시 미인증 SI 혼입률 0%를 보장한다. 검색 결과 반환 p95 ≤ 1초를 달성해야 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-029`](../06_SRS-v1.md) — SI 파트너 검색 및 필터링
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-015`](../06_SRS-v1.md) — 뱃지 보유 SI 필터 (미인증 혼입 0%)
- SRS 문서: [`06_SRS-v1.md#CLI-01`](../06_SRS-v1.md) — 수요 기업 웹 포털
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.2`](../06_SRS-v1.md) — SI 파트너 검색 및 평판 조회 흐름
- 데이터 모델: `SI_PARTNER` (6.2.2), `SI_PROFILE` (6.2.8), `BADGE` (6.2.7)
- 연동: `API-013` (검색 인터페이스), `FQ-001` (검색 Query), `FQ-003` (뱃지 필터)
- Mock 데이터: `MOCK-003` (뱃지), `MOCK-004` (SI 프로필)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 페이지 구조
- [ ] Next.js App Router 경로: `/app/search/page.tsx` (Server Component)
- [ ] URL 쿼리 파라미터 기반 필터 상태 관리 (`?region=서울&brand=UR&tag=용접&badge=true&page=1`)
- [ ] 페이지 메타데이터 설정 (SEO: "SI 파트너 검색 | 로봇 SI 매칭 플랫폼")

### 2단계: 필터 패널 UI
- [ ] 좌측 사이드바(Desktop) / 상단 접이식(Mobile) 필터 패널 구현
- [ ] 필터 항목:
  - 지역 (`region`) — `Select` 다중 선택 (시/도 기반)
  - 브랜드/제조사 (`brand`) — `Checkbox Group` (UR, 두산, 레인보우 등)
  - 역량 태그 (`capability_tags`) — `Checkbox Group` (용접, 조립, 도장 등)
  - 뱃지 보유 여부 (`has_badge`) — `Toggle Switch` ("인증 파트너만 보기")
  - SI 등급 (`tier`) — `Checkbox Group` (Silver, Gold, Diamond)
- [ ] '필터 초기화' 버튼 및 '검색' 적용 버튼
- [ ] 필터 변경 시 URL 쿼리 파라미터 동기화 (브라우저 뒤로가기 지원)

### 3단계: 검색 결과 카드 리스트
- [ ] SI 파트너 카드 컴포넌트 (`SiPartnerCard`) 구현:
  - 회사명, 지역, SI 등급(tier) 뱃지
  - 시공 성공률 (프로그레스 바 + 퍼센트)
  - 역량 태그 (최대 5개 표시 + "+N개" 더보기)
  - 보유 뱃지 아이콘 목록 (제조사 로고/이름)
  - 평균 평점 (별점 ★ + 숫자)
  - '상세 보기' 버튼 → `/search/[siPartnerId]` (UI-004) 링크
- [ ] 검색 결과 정렬 옵션: 성공률 순 / 평점 순 / 최신 등록 순
- [ ] 빈 결과 시 안내 메시지: "조건에 맞는 SI 파트너가 없습니다. 필터를 조정해주세요."

### 4단계: 페이지네이션
- [ ] 서버 사이드 페이지네이션 (Server Component + Prisma skip/take)
- [ ] 페이지당 10개 카드 표시
- [ ] 페이지네이션 UI: 이전/다음 + 페이지 번호 (최대 5개 노출)
- [ ] 현재 페이지 번호 URL 쿼리 파라미터 동기화

### 5단계: 로딩 및 Skeleton UI
- [ ] 검색 진행 중 카드 Skeleton 로딩 UI (shadcn/ui `Skeleton`)
- [ ] 필터 변경 시 결과 영역만 로딩 표시 (전체 페이지 깜빡임 방지)
- [ ] `loading.tsx` Suspense boundary 적용

### 6단계: 반응형 및 접근성
- [ ] Desktop: 좌측 필터 패널 (240px) + 우측 카드 그리드 (2~3열)
- [ ] Tablet: 상단 접이식 필터 + 카드 2열
- [ ] Mobile: 상단 접이식 필터 + 카드 1열 (풀 너비)
- [ ] 카드 키보드 네비게이션 (Tab 이동, Enter/Space → 상세 페이지)
- [ ] 필터 `aria-label`, 검색 결과 수 `aria-live="polite"` 안내

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 검색 결과 반환**
- **Given:** 검색 가능한 SI 파트너 20개사가 DB에 존재함
- **When:** 수요기업이 `/search` 페이지에 접근하고 필터 없이 검색함
- **Then:** SI 카드 목록이 10개 표시되고, 각 카드에 뱃지 보유 여부·성공률·지역이 명시되며, 응답 시간 ≤ 1초 (p95)

**Scenario 2: 뱃지 보유 필터 적용**
- **Given:** 뱃지 보유 SI 8개사, 미인증 SI 12개사
- **When:** "인증 파트너만 보기" 토글 활성화
- **Then:** 뱃지 보유 SI만 표시되며, 미인증 SI 혼입률 = 0%

**Scenario 3: 복합 필터 (지역 + 역량)**
- **Given:** 지역 "경기" + 역량 "용접" 조건
- **When:** 필터 적용 후 검색
- **Then:** 경기 지역 + 용접 역량 보유 SI만 표시, 응답 ≤ 1초

**Scenario 4: 빈 검색 결과**
- **Given:** 조건에 맞는 SI가 0건
- **When:** 검색 결과 렌더링
- **Then:** "조건에 맞는 SI 파트너가 없습니다. 필터를 조정해주세요." 안내 메시지 표시

**Scenario 5: 페이지네이션**
- **Given:** 검색 결과 25건
- **When:** 2페이지 버튼 클릭
- **Then:** 11~20번째 카드 표시, URL에 `page=2` 반영, 뒤로가기 시 1페이지 복원

**Scenario 6: 반응형 Mobile 레이아웃**
- **Given:** 모바일 (≤768px) 접근
- **When:** 페이지 렌더링
- **Then:** 필터가 접이식으로 표시, 카드 1열 풀 너비, 터치 스크롤 정상 동작

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (SSR) + URL 쿼리 파라미터 기반 상태 관리
- **UI:** Tailwind CSS + shadcn/ui (CON-14)
- **성능:** 검색 결과 반환 p95 ≤ 1,000ms (REQ-NF-002), LCP p95 ≤ 2,000ms (REQ-NF-001)
- **데이터 무결성:** 뱃지 필터 시 `BADGE.is_active=true AND expires_at > NOW()` 조건 필수 (혼입률 0%)
- **SEO:** 필터 상태 URL 반영으로 검색엔진 크롤링 가능
- **접근성:** 카드 `role="article"`, 필터 `role="search"`, WCAG 2.1 AA 준수

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] `SiPartnerCard` 컴포넌트 단위 테스트 (뱃지 표시, 성공률 표시, 태그 표시)
- [ ] 필터 → URL 동기화 테스트 (브라우저 뒤로가기 복원 확인)
- [ ] 뱃지 필터 미인증 혼입률 0% 검증 테스트
- [ ] Skeleton 로딩 UI 정상 동작
- [ ] 반응형 레이아웃 (Mobile/Tablet/Desktop) 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-003 | 뱃지 15건 Seed 데이터 | 필수 (필터 테스트) |
| MOCK-004 | SI 프로필 20건 Seed 데이터 | 필수 |
| API-013 | SI 검색 쿼리 인터페이스 정의 | 필수 |
| FQ-001 | SI 검색 필터링 Server Component 구현 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| UI-004 | SI 프로필 상세 페이지 (카드 '상세 보기' 연결) |
| TEST-028 | SI 검색 필터링 통합 테스트 |

### 참고사항
- `FQ-001` 미완료 시 MOCK 데이터 기반 Static 렌더링으로 UI 독립 개발 가능
- 검색 인덱스 최적화는 `NFR-008` (API 응답 시간 검증) 범위
