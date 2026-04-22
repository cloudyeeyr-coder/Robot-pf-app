---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-010: RaaS 비용 비교 계산기 UI — 3옵션 비교 결과·유효성 검증·PDF 다운로드"
labels: 'feature, frontend, ui, raas, calculator, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-010] RaaS 비용 비교 계산기 UI
- 목적: 수요기업이 로봇 모델·수량·계약 기간을 입력하면 일시불(CAPEX)·리스·RaaS(OPEX) 3가지 비용 옵션을 실시간으로 비교할 수 있는 계산기 UI를 제공한다. 비교 결과를 PDF로 다운로드할 수 있으며, 특정 플랜 선택 시 "운영팀에 맞춤 견적 요청하기" 팝업(UI-011)으로 연결된다. 잘못된 입력(음수/0/미존재 모델)에 대해 인라인 에러와 유사 모델 추천을 제공한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-018`](../06_SRS-v1.md) — 3옵션 비용 비교 계산
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-019`](../06_SRS-v1.md) — 비용 비교 PDF 생성
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-020`](../06_SRS-v1.md) — 수기 견적 요청 팝업
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-021`](../06_SRS-v1.md) — 유효성 에러 및 유사 모델 추천
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.5`](../06_SRS-v1.md) — OPEX 비용 비교 계산기 흐름
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.6`](../06_SRS-v1.md) — RaaS 구독 흐름
- SRS 문서: [`06_SRS-v1.md#CLI-01`](../06_SRS-v1.md) — 수요 기업 웹 포털
- 데이터 모델: `ROBOT_MODEL` (DB-016), `QUOTE_LEAD` (6.2.11)
- 연동: `API-020`/`FC-020` (계산), `API-021`/`FC-021` (PDF), `FC-028` (유사 모델 추천)
- Mock: `MOCK-006` (로봇 모델 10건, 견적 리드 5건)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 페이지 구조
- [ ] 경로: `/app/calculator/page.tsx`
- [ ] Public 접근 가능 (비로그인도 계산 가능, 견적 요청 시 로그인 필요)
- [ ] 페이지 메타데이터: "RaaS 비용 비교 계산기 | 일시불 vs 리스 vs RaaS"

### 2단계: 입력 폼 UI
- [ ] **로봇 모델 선택** (`Combobox` 자동완성):
  - ROBOT_MODEL 테이블 기반 모델 검색
  - 모델코드/모델명 동시 검색
  - 미존재 모델 입력 시 "유사 모델 3건" 드롭다운 자동 추천
- [ ] **수량** (`Input[type=number]`): 1 이상 정수
- [ ] **계약 기간** (`Select`): 12개월 / 24개월 / 36개월 / 48개월 / 60개월
- [ ] '비교 계산' 버튼 (Primary)
- [ ] 입력 영역 좌측 배치 (Desktop), 상단 배치 (Mobile)

### 3단계: 유효성 검증
- [ ] Zod 스키마 `raasCalcInputSchema`:
  - `robot_model`: `z.string().min(1)` — 필수
  - `quantity`: `z.number().int().min(1)` — 1 이상 정수 (0/음수 차단)
  - `term_months`: `z.enum(['12','24','36','48','60'])` — 유효 기간만
- [ ] 인라인 에러 표시 ≤ 200ms (클라이언트 사이드):
  - 수량 0 → "수량은 1 이상이어야 합니다"
  - 음수 수량 → "유효한 수량을 입력해주세요"
  - 미존재 모델 → "해당 모델을 찾을 수 없습니다" + 유사 모델 3건 추천
- [ ] 유효성 에러 시 '비교 계산' 버튼 비활성화 (계산 요청 차단)

### 4단계: 3옵션 비교 결과 렌더링
- [ ] `FC-020` (`calculateRaasOptions`) Server Action 호출
- [ ] 계산 중 로딩 스피너 + Skeleton 결과 영역
- [ ] **3옵션 비교 카드** (가로 3열, Mobile 세로 스택):
  - **일시불 (CAPEX)**: 총 구매 비용, 월 감가상각비
  - **리스**: 월 리스료, 총 리스 비용, 잔존가치
  - **RaaS (OPEX)**: 월 구독료, 총 구독 비용, 포함 서비스
- [ ] 각 카드에 금액 강조 (큰 폰트, 색상 구분)
- [ ] 옵션 간 비교 하이라이트: 가장 저렴한 옵션 "추천" 뱃지
- [ ] TCO 비교 바 차트 (가로 막대 3개, 시각적 비교)
- [ ] ROI 그래프 (선형 차트: 기간별 누적 비용 비교)

### 5단계: PDF 다운로드
- [ ] '결과 PDF 내려받기' 버튼
- [ ] `POST /api/raas/pdf` → PDF 생성 (ROI 그래프 + 월비용 테이블 + TCO 비교 포함)
- [ ] 다운로드 중 '리포트 생성 중...' 로딩 스피너
- [ ] 생성 완료 → 브라우저 자동 다운로드
- [ ] 에러 시 Toast "PDF 생성에 실패했습니다"

### 6단계: 수기 견적 요청 연결 (UI-011)
- [ ] 각 옵션 카드에 '이 플랜으로 견적 요청' 버튼
- [ ] RaaS 옵션 선택 시 → "운영팀에 맞춤 견적 요청하기" 팝업 트리거 (UI-011)
- [ ] 비로그인 사용자 → "견적 요청을 위해 로그인이 필요합니다" 안내 → 로그인 페이지

### 7단계: 반응형 및 접근성
- [ ] Desktop: 좌측 입력폼 (320px) + 우측 결과 영역
- [ ] Tablet: 상단 입력 + 하단 결과 (2열 카드)
- [ ] Mobile: 전체 세로 스택 (입력 → 결과 카드 1열)
- [ ] 차트 `aria-label` 대체 텍스트 (스크린 리더용 금액 요약)
- [ ] Combobox 키보드 접근성

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 3옵션 비교 계산**
- **Given:** 유효한 로봇 모델 "UR10e", 수량 5, 기간 36개월
- **When:** '비교 계산' 클릭
- **Then:** 일시불·리스·RaaS 3옵션 결과 렌더링 ≤2초, 각 옵션 금액 > 0

**Scenario 2: 미존재 모델 코드 입력**
- **Given:** DB에 없는 모델 코드 "XR-999" 입력
- **When:** 모델 검색 시
- **Then:** "해당 모델을 찾을 수 없습니다" 인라인 에러 ≤200ms + 유사 모델 3건 추천

**Scenario 3: 수량 0 입력 시 계산 차단**
- **Given:** 수량에 `0` 입력
- **When:** '비교 계산' 시도
- **Then:** "수량은 1 이상이어야 합니다" 인라인 에러, 계산 요청 차단

**Scenario 4: 음수 수량 입력 시 계산 차단**
- **Given:** 수량에 `-3` 입력
- **When:** 입력 즉시
- **Then:** "유효한 수량을 입력해주세요" 인라인 에러, 계산 버튼 비활성화

**Scenario 5: PDF 다운로드**
- **Given:** 3옵션 비교 결과 표시 상태
- **When:** '결과 PDF 내려받기' 클릭
- **Then:** PDF 3초 이내 생성, ROI 그래프·월비용 테이블·TCO 비교 포함

**Scenario 6: 반응형 Mobile**
- **Given:** 모바일 (≤768px) 접근
- **When:** 계산 결과 렌더링
- **Then:** 3옵션 카드 세로 스택, 차트 가로 스크롤 없이 표시, 터치 가능

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (모델 마스터 데이터) + Client Component (폼, 차트, Combobox)
- **UI:** Tailwind CSS + shadcn/ui (`Combobox`, `Card`, `Button`) — CON-14
- **차트:** Recharts 또는 Chart.js (ROI 선형 차트, TCO 바 차트)
- **성능:** 3옵션 렌더링 ≤2초 (REQ-FUNC-018), PDF 생성 ≤3초 (REQ-FUNC-019), 유효성 에러 ≤200ms (REQ-FUNC-021)
- **계산 엔진:** 내부 DB 기반 (CON-01), 외부 금융 API 없음
- **보안:** Public 계산 허용, 견적 요청은 인증 필수
- **접근성:** 차트 aria-label 대체 텍스트, Combobox 키보드, WCAG 2.1 AA

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] `raasCalcInputSchema` Zod 단위 테스트 (유효/무효 각 5건+)
- [ ] 3옵션 결과 카드 렌더링 테스트
- [ ] 유사 모델 추천 동작 테스트
- [ ] 유효성 에러 인라인 표시 테스트 (0, 음수, 미존재 모델)
- [ ] PDF 다운로드 통합 테스트
- [ ] 차트 렌더링 테스트 (데이터 정확성)
- [ ] 반응형 레이아웃 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-006 | 로봇 모델 10건 + 견적 리드 5건 Seed | 필수 |
| DB-016 | ROBOT_MODEL 테이블 스키마 | 필수 |
| API-020 | calculateRaasOptions DTO | 필수 |
| FC-020 | RaaS 3옵션 계산 Command | 필수 |
| API-021 | RaaS PDF Route Handler DTO | 필수 (PDF) |
| FC-021 | RaaS PDF 생성 로직 | 필수 (PDF) |
| FC-028 | 유사 모델 추천 로직 | 필수 (모델 추천) |

### Blocks
| Task ID | 설명 |
|:---|:---|
| UI-011 | 수기 견적 요청 팝업 (계산기에서 트리거) |
| TEST-018 | RaaS 3옵션 비교 계산 테스트 |
| TEST-019 | RaaS PDF 생성 테스트 |
| TEST-021 | 유효성 검증 예외 처리 테스트 |

### 참고사항
- 계산 엔진(`FC-020`) 미완료 시 하드코딩 Mock 결과로 UI 독립 개발 가능
- RaaS 금융 견적은 더미 폼(수기 요청) — PG/금융 API 연동은 Phase 2
- 차트 라이브러리는 Recharts 권장 (React 네이티브, 번들 크기 경량)
