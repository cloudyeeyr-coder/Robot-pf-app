---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-004: SI 프로필 상세 페이지 — 재무등급·시공성공률·리뷰·뱃지 통합 뷰 및 기안 리포트 PDF 다운로드"
labels: 'feature, frontend, ui, profile, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-004] SI 프로필 상세 페이지
- 목적: 수요기업이 특정 SI 파트너의 역량을 종합적으로 평가할 수 있도록 재무등급, 시공 성공률, 고객 리뷰, 제조사 인증 뱃지를 하나의 통합 뷰로 제공한다. 경영진 기안 보고서에 바로 활용할 수 있는 PDF 다운로드 기능을 포함하여, 의사결정 속도를 획기적으로 단축한다. 데이터는 운영팀이 사전 업데이트한 DB 정적 데이터를 서빙하며, 갱신일을 명시한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-009`](../06_SRS-v1.md) — SI 프로필 통합 표시
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-010`](../06_SRS-v1.md) — 기안용 리포트 PDF 생성
- SRS 문서: [`06_SRS-v1.md#CLI-01`](../06_SRS-v1.md) — 수요 기업 웹 포털
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.2`](../06_SRS-v1.md) — SI 검색 및 평판 조회 흐름
- 데이터 모델: `SI_PARTNER` (6.2.2), `SI_PROFILE` (6.2.8), `BADGE` (6.2.7)
- 연동: `API-014` (프로필 조회 DTO), `FQ-002` (프로필 상세 Query), `API-015`/`FC-015` (PDF 생성)
- Mock 데이터: `MOCK-004` (SI 프로필)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 페이지 구조
- [ ] Next.js App Router 경로: `/app/search/[siPartnerId]/page.tsx` (Server Component)
- [ ] 동적 라우트 파라미터 `siPartnerId` 검증 (존재하지 않는 ID → 404 페이지)
- [ ] 페이지 메타데이터: SI 회사명 기반 동적 title/description 설정

### 2단계: 프로필 헤더 섹션
- [ ] SI 회사명, SI 등급(tier) 뱃지 (Silver/Gold/Diamond 색상 구분)
- [ ] 주요 활동 지역 표시
- [ ] 가입일 및 프로필 최종 갱신일 (`updated_at`) 표시
- [ ] '기안 리포트 PDF 다운로드' 버튼 (우측 상단)

### 3단계: 핵심 지표 카드 섹션
- [ ] **재무등급 카드**: NICE 재무 등급 표시 + 갱신일(`financial_grade_updated_at`) + "운영팀 사전 업데이트 기반" 고지
- [ ] **시공 성공률 카드**: 성공률 (%) + 원형 프로그레스 바 + 완료/실패 건수
- [ ] **평균 평점 카드**: 별점(★) + 숫자 + 리뷰 건수
- [ ] 3개 카드 가로 배치 (Desktop) / 세로 스택 (Mobile)

### 4단계: 상세 정보 탭 섹션
- [ ] `Tabs` 컴포넌트 기반 상세 정보 분리:
  - **[역량 & 태그] 탭**: capability_tags 전체 목록 + 관련 프로젝트 이력
  - **[인증 뱃지] 탭**: 보유 뱃지 목록 (제조사명, 발급일, 만료일, 활성 상태)
  - **[리뷰 요약] 탭**: review_summary JSONB 기반 리뷰 내용 렌더링
- [ ] 각 탭 콘텐츠 Lazy Loading (선택된 탭만 렌더링)

### 5단계: 기안 리포트 PDF 다운로드
- [ ] 'PDF 다운로드' 버튼 클릭 → `POST /api/reports/pdf` Route Handler 호출
- [ ] 다운로드 중 버튼 상태: '리포트 생성 중...' 로딩 스피너
- [ ] PDF 생성 완료 → 브라우저 자동 다운로드 (Content-Disposition: attachment)
- [ ] PDF 내용: 재무등급·기술역량·인증뱃지·리뷰 4섹션 포함
- [ ] 에러 핸들링: PDF 생성 실패 시 Toast 알림 ("리포트 생성에 실패했습니다. 다시 시도해주세요.")

### 6단계: 로딩 및 에러 상태
- [ ] 프로필 로딩 중 Skeleton UI (헤더 + 카드 3개 + 탭 영역)
- [ ] 존재하지 않는 SI ID → Next.js `notFound()` 404 페이지
- [ ] 데이터 조회 에러 → 에러 바운더리 + 재시도 버튼

### 7단계: 반응형 및 접근성
- [ ] Desktop: 헤더 + 3열 카드 + 탭 (max-width: 1024px 중앙 정렬)
- [ ] Tablet: 3열 카드 → 2열, 탭 유지
- [ ] Mobile: 1열 카드 스택, 탭 → 세로 스크롤
- [ ] `aria-label` (각 카드, 탭 패널), 별점 `aria-label="평점 4.2점"`
- [ ] PDF 다운로드 버튼 `aria-busy` 로딩 상태

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 프로필 통합 데이터 로딩**
- **Given:** 유효한 SI 파트너 ID로 프로필 페이지 접근
- **When:** 페이지 로드
- **Then:** 재무등급·시공성공률·리뷰·뱃지가 통합 로딩됨, p95 ≤ 2초, 갱신일 YYYY-MM-DD 형식 표시

**Scenario 2: 기안 리포트 PDF 다운로드**
- **Given:** 프로필 페이지에서 'PDF 다운로드' 버튼 클릭
- **When:** PDF 생성 요청
- **Then:** PDF 5초 이내 생성, 재무·기술·인증·리뷰 4섹션 포함, 브라우저 자동 다운로드

**Scenario 3: 뱃지 정보 표시**
- **Given:** SI가 3개 제조사(UR, 두산, 레인보우) 뱃지 보유
- **When:** [인증 뱃지] 탭 클릭
- **Then:** 3개 뱃지가 각각 제조사명·발급일·만료일·활성 상태와 함께 표시

**Scenario 4: 존재하지 않는 SI 프로필**
- **Given:** DB에 존재하지 않는 SI ID
- **When:** 해당 URL 접근
- **Then:** 404 Not Found 페이지 표시 (크래시 없음)

**Scenario 5: 갱신일 표시**
- **Given:** 재무등급 갱신일이 2026-03-15
- **When:** 재무등급 카드 렌더링
- **Then:** "기준일: 2026-03-15" 및 "운영팀 사전 업데이트 기반" 고지 표시

**Scenario 6: 반응형 Mobile**
- **Given:** 모바일 (≤768px) 접근
- **When:** 프로필 페이지 렌더링
- **Then:** 카드 1열 스택, 탭 정상 동작, PDF 버튼 터치 가능

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (SSR, 프로필 데이터 프리페칭) + Client Component (탭 인터랙션, PDF 다운로드)
- **UI:** Tailwind CSS + shadcn/ui (`Tabs`, `Card`, `Skeleton`, `Badge`, `Progress`) — CON-14
- **성능:** 프로필 로딩 p95 ≤ 2,000ms (REQ-FUNC-009), PDF 생성 p95 ≤ 5,000ms (REQ-FUNC-010, REQ-NF-004)
- **데이터:** 재무등급은 DB 정적 데이터 (운영팀 사전 업데이트, CON-02), 외부 API 호출 없음
- **보안:** SI 프로필은 인증 없이 Public 조회 가능 (검색 유입 지원)
- **접근성:** WCAG 2.1 AA, 별점 aria-label, 탭 키보드 네비게이션

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] 프로필 페이지 Server Component 렌더링 테스트
- [ ] PDF 다운로드 통합 테스트 (4섹션 포함 확인, Content-Type 확인)
- [ ] 404 에러 핸들링 테스트
- [ ] Skeleton 로딩 UI 정상 동작
- [ ] 반응형 레이아웃 (Mobile/Tablet/Desktop) 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-004 | SI 프로필 20건 Seed 데이터 | 필수 |
| API-014 | SI 프로필 상세 조회 Response DTO | 필수 |
| FQ-002 | SI 프로필 상세 조회 Server Component | 필수 |
| API-015 | 리포트 PDF 생성 Route Handler DTO | 필수 (PDF 기능) |
| FC-015 | jsPDF 기반 PDF 생성 로직 | 필수 (PDF 기능) |

### Blocks
| Task ID | 설명 |
|:---|:---|
| UI-005 | 에스크로 결제 흐름 — 프로필에서 계약 진행 연결 |
| TEST-011 | SI 프로필 상세 조회 테스트 |
| TEST-012 | 기안용 리포트 PDF 생성 테스트 |

### 참고사항
- PDF 생성 로직(`FC-015`) 미완료 시 PDF 버튼을 disabled 처리하고 UI 독립 개발 가능
- 리뷰 데이터(`review_summary`)는 JSONB 구조 — 렌더링 시 Null 안전 처리 필수
- 재무등급 외부 API 연동은 Phase 2 — MVP에서는 DB 정적 데이터만 표시
