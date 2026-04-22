---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-002: SI 파트너 회원가입 페이지 — 회사 정보·시공 이력·역량 태그 등록 및 Admin 검토 대기 안내"
labels: 'feature, frontend, ui, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-002] SI 파트너 회원가입 페이지
- 목적: 로봇 시스템을 설계·시공·통합하는 SI 파트너가 플랫폼에 등록하여 수요기업에게 노출되기 위한 온보딩 관문. 회사 기본 정보, 시공 이력, 역량 태그 등 프로필 구성에 필요한 핵심 데이터를 수집하는 다단계 폼을 제공한다. 가입 완료 시 `Admin 검토 대기` 상태로 전환되며, 검토 완료 전까지 SI 프로필이 검색 결과에 노출되지 않는다는 안내를 명확히 제공한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-028`](../06_SRS-v1.md) — SI 파트너 회원가입 및 프로필 등록 프로세스
- SRS 문서: [`06_SRS-v1.md#CLI-02`](../06_SRS-v1.md) — SI 파트너 웹 포털 (반응형 웹)
- 데이터 모델: [`06_SRS-v1.md#6.2.2 SI_PARTNER`](../06_SRS-v1.md), [`06_SRS-v1.md#6.2.8 SI_PROFILE`](../06_SRS-v1.md)
- API 명세: [`06_SRS-v1.md#6.1 Endpoint #26`](../06_SRS-v1.md) — `action: signupSiPartner`
- Use Case: [`06_SRS-v1.md#UC-01, UC-13`](../06_SRS-v1.md) — 회원가입 및 프로필 등록
- 연동: `API-002` (DTO), `FC-002` (Command), `DB-003` (SI_PARTNER), `DB-009` (SI_PROFILE)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 페이지 구조 설정
- [ ] Next.js App Router 경로 생성: `/app/signup/partner/page.tsx`
- [ ] 가입 완료 대기 페이지: `/app/signup/partner/pending/page.tsx`
- [ ] 페이지 메타데이터 설정 (SEO)
- [ ] Public Layout 적용 (비로그인 접근 가능)

### 2단계: 폼 UI — 회사 기본 정보 섹션
- [ ] shadcn/ui 기반 가입 폼 레이아웃 구현
- [ ] 필드: 회사명, 사업자등록번호(자동 하이픈), 지역(Select), 담당자 이름/이메일/전화번호
- [ ] 필수 항목 표시 (`*`) 및 도움말 툴팁

### 3단계: 폼 UI — 시공 이력 및 역량 태그 섹션
- [ ] 완료/실패 프로젝트 수 `Input[type=number]` (0 이상 정수)
- [ ] 시공 성공률 자동 계산 표시 (완료/(완료+실패)×100, 읽기 전용)
- [ ] 역량 태그 다중 선택 Tag Input (자동완성 + 사용자 정의)
  - 미리 정의 태그: `['용접','조립','도장','검사','팔레타이징','픽앤플레이스','CNC 로딩','AGV','협동로봇','비전검사']`
  - 최소 1개, 최대 10개 제한
- [ ] 섹션 구분: `Accordion` 또는 `Tabs` 적용

### 4단계: 유효성 검증 로직
- [ ] Zod 스키마 `siPartnerSignupSchema` 정의:
  - `company_name`: `z.string().min(1).max(255)`
  - `biz_registration_no`: `z.string().regex(/^\d{3}-\d{2}-\d{5}$/)`
  - `region`: `z.string().min(1)`
  - `contact_name/email/phone`: 필수 + 포맷 검증
  - `completed_projects/failed_projects`: `z.number().int().min(0)`
  - `capability_tags`: `z.array(z.string()).min(1).max(10)`
- [ ] `react-hook-form` + Zod resolver 연동 (`mode: 'onChange'`)
- [ ] 사업자등록번호/전화번호 자동 포맷팅

### 5단계: 서버 통신 및 Admin 검토 대기 안내
- [ ] `FC-002` Server Action 호출 + '프로필 등록 중...' 로딩 스피너
- [ ] 성공 시: `/signup/partner/pending` 리다이렉트
  - "운영팀 검토 후 승인 시 알림을 보내드립니다" 안내
  - 예상 검토 기간(2~3영업일) 및 문의처 표시
- [ ] 에러 핸들링: 409(중복) → 인라인 에러, 400 → 필드 매핑, 500 → Toast

### 6단계: 반응형 디자인 및 접근성
- [ ] Mobile: 단일 컬럼 / Desktop: 중앙 카드 (max-width: 640px)
- [ ] Tag Input 키보드 접근성 (Tab, Enter, Backspace 삭제)
- [ ] `aria-label`, `aria-describedby`, `role="alert"` 적용

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 SI 파트너 가입**
- **Given:** SI 파트너 담당자가 `/signup/partner`에 접근함
- **When:** 회사 정보, 시공 이력(완료:50, 실패:2), 역량 태그(["용접","조립","협동로봇"])를 입력 후 '가입 신청' 클릭
- **Then:** SI_PARTNER/SI_PROFILE 생성, Admin 검토 대기 안내 페이지 리다이렉트

**Scenario 2: Admin 검토 대기 안내**
- **Given:** 가입 신청 완료
- **When:** 안내 페이지 렌더링
- **Then:** "운영팀 검토 후 승인 시 알림" 메시지 + 예상 기간(2~3영업일) + 문의처 표시

**Scenario 3: 역량 태그 최소/최대 제한**
- **Given:** 태그 미선택 상태
- **When:** '가입 신청' 클릭
- **Then:** "최소 1개의 역량 태그를 선택해주세요" 인라인 에러, 제출 차단

**Scenario 4: 시공 성공률 자동 계산**
- **Given:** 완료 50건, 실패 2건 입력
- **When:** 값 입력 시
- **Then:** 성공률 `96.2%` 읽기 전용 자동 표시

**Scenario 5: 중복 사업자등록번호**
- **Given:** DB 기존 사업자등록번호
- **When:** 해당 번호로 가입 제출
- **Then:** "이미 등록된 사업자등록번호입니다" 인라인 에러 (크래시 없음)

**Scenario 6: 반응형 Mobile 레이아웃**
- **Given:** 모바일 (≤768px) 접근
- **When:** 페이지 렌더링
- **Then:** 단일 컬럼, Tag Input 터치 조작 가능, 화면 밖 벗어남 없음

## :gear: Technical & Non-Functional Constraints
- **UI:** Tailwind CSS + shadcn/ui (CON-14), Zod + react-hook-form
- **성능:** LCP p95 ≤ 2,000ms (REQ-NF-001), 유효성 에러 ≤ 200ms
- **안정성:** 에러 시 Graceful Handling, 네트워크 오류 시 폼 데이터 유지
- **보안:** 개인정보 콘솔 노출 금지, XSS 방지(태그 입력 이스케이프), CSRF 보호
- **접근성:** Label 연결 필수, Tag Input aria 속성, WCAG 2.1 AA 색상 대비

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] `siPartnerSignupSchema` Zod 단위 테스트 (유효/무효 각 8건+)
- [ ] 폼 컴포넌트 RTL 단위 테스트 (Submit, 태그 제한, 성공률 계산, 409 에러)
- [ ] 반응형 레이아웃 정상 동작
- [ ] Lighthouse 접근성 ≥ 90
- [ ] ESLint / TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| DB-003 | SI_PARTNER 스키마 | 필수 |
| DB-009 | SI_PROFILE 스키마 | 필수 |
| MOCK-001 | SI 파트너 샘플 데이터 | 권장 |
| API-002 | signupSiPartner DTO | 필수 |
| FC-002 | SI 회원가입 Command | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| UI-013 | SI 파트너 포털 (프로필 수정, 제안 수락/거절) |
| UI-003 | SI 검색 목록 페이지 |
| TEST-027 | SI 회원가입 GWT 테스트 |

### 참고사항
- SI 등급(tier)은 Admin 검토 후 할당 — 가입 시 입력하지 않음
- `FC-002` 미완료 시 Mock Server Action으로 UI 독립 개발 가능
