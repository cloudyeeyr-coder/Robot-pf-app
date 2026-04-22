---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-006: 검수 승인/거절 UI — 검수 판정 폼·거절 사유 입력·분쟁 접수 안내"
labels: 'feature, frontend, ui, escrow, inspection, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-006] 시공 검수 승인/거절 UI
- 목적: 시공 완료 후 수요기업이 결과물을 검수하고, 합격/불합격을 판정하는 UI를 제공한다. 검수 합격 시 Admin 대시보드에 '방출 대기' 알림이 전송되고, 거절 시 분쟁 접수로 자동 전환된다. 검수 기한(7영업일) 내 미응답 시 자동 분쟁 접수로 전환되므로, 기한 카운트다운을 시각적으로 표시하여 사용자 행동을 유도한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-002`](../06_SRS-v1.md) — 검수 합격 승인 및 방출 대기
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-003`](../06_SRS-v1.md) — 분쟁 발생 시 중재 프로세스
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-005`](../06_SRS-v1.md) — 검수 기한(7영업일) 미응답 자동 분쟁
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.1`](../06_SRS-v1.md) — 에스크로 결제 및 자금 방출 흐름
- Use Case: [`06_SRS-v1.md#UC-06`](../06_SRS-v1.md) — 시공 검수 승인/거절
- 데이터 모델: `CONTRACT` (6.2.4) — status ENUM 6종
- 연동: `API-008`/`FC-007` (검수 승인), `FC-008` (검수 거절), `API-006`/`FC-010` (분쟁 접수)
- Mock 데이터: `MOCK-002` (계약 5건, 상태별)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 페이지 구조
- [ ] 경로: `/app/contracts/[contractId]/inspection/page.tsx`
- [ ] 인증 필수 (Buyer 역할) + 계약 소유권 검증
- [ ] 계약 상태 검증: `status === 'inspecting'`일 때만 접근 가능 (그 외 상태 → 리다이렉트)

### 2단계: 검수 정보 및 기한 표시
- [ ] 계약 요약 카드: SI 파트너명, 계약 금액, 시공 완료일
- [ ] 검수 기한 카운트다운 타이머:
  - 7영업일 잔여일 표시 (D-7, D-6 ... D-1, D-Day)
  - 잔여 3일 이하 시 경고 색상(주황→빨강) 전환
  - "기한 내 미응답 시 자동으로 분쟁 접수됩니다" 안내 문구
- [ ] 시공 완료 보고서 요약 (SI가 제출한 보고서 내용 표시)

### 3단계: 검수 판정 폼
- [ ] **합격 승인** 섹션:
  - '검수 합격' 버튼 (Primary, 녹색 계열)
  - 확인 모달: "검수 합격을 승인하시겠습니까? 승인 시 Admin에게 방출 대기 알림이 전송됩니다."
  - 승인 메모 (선택 입력, 최대 500자)
- [ ] **불합격 거절** 섹션:
  - '검수 거절' 버튼 (Destructive, 빨강 계열)
  - 거절 사유 입력 폼 (필수, `Textarea`, 최소 10자, 최대 1000자)
  - 거절 사유 카테고리 선택: `Select` (품질 미달 / 사양 불일치 / 납기 지연 / 기타)
  - 확인 모달: "검수 거절 시 분쟁 접수로 전환됩니다. 계속하시겠습니까?"
- [ ] 폼 제출 중 버튼 disabled + 로딩 스피너

### 4단계: 서버 통신 및 상태 전환
- [ ] 합격 시: `FC-007` (`submitInspection: approve`) → CONTRACT status=`release_pending`
- [ ] 거절 시: `FC-008` (`submitInspection: reject`) → CONTRACT status=`disputed`
- [ ] 성공 응답 시:
  - 합격: "검수가 승인되었습니다. Admin 확인 후 대금이 방출됩니다." 성공 배너 표시
  - 거절: "분쟁이 접수되었습니다. 운영팀이 2영업일 내 중재를 시작합니다." 안내 표시
- [ ] 에러: 403(권한없음), 400(유효성), 500 → 각각 적절한 에러 메시지

### 5단계: 분쟁 접수 안내
- [ ] 거절 후 분쟁 안내 페이지 (`/contracts/[contractId]/dispute`):
  - 분쟁 접수 번호 표시
  - 중재 절차 안내 (타임라인 형태)
  - "자금은 중재 완료 시까지 에스크로에 안전하게 보호됩니다" 안내
  - 운영팀 연락처
- [ ] 검수 기한 만료 자동 분쟁 안내 (CRON-001 연동 결과 표시)

### 6단계: 반응형 및 접근성
- [ ] Desktop: 중앙 정렬 (max-width: 720px)
- [ ] Mobile: 풀 너비, 합격/거절 버튼 충분한 터치 영역
- [ ] 확인 모달 키보드 네비게이션 (Esc 닫기, Tab 이동)
- [ ] 카운트다운 `aria-live="polite"`, 버튼 `aria-label`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 검수 합격 승인**
- **Given:** 계약 status=`inspecting`, 검수 기한 내
- **When:** '검수 합격' → 확인 모달 '승인' 클릭
- **Then:** status=`release_pending` 전환, Admin '방출 대기' 알림 전송, 성공 배너 표시

**Scenario 2: 검수 거절 및 분쟁 전환**
- **Given:** 검수 거절 사유 "품질 미달, 용접 불량" 입력
- **When:** '검수 거절' → 확인 모달 '거절 확정' 클릭
- **Then:** status=`disputed` 전환, 중재팀 알림 발송, 분쟁 안내 페이지 리다이렉트

**Scenario 3: 거절 사유 미입력 시 제출 차단**
- **Given:** 거절 사유 미입력 상태
- **When:** '검수 거절' 클릭
- **Then:** "거절 사유를 입력해주세요 (최소 10자)" 인라인 에러, 제출 차단

**Scenario 4: 검수 기한 카운트다운 표시**
- **Given:** 검수 기한 잔여 3일
- **When:** 검수 페이지 렌더링
- **Then:** "D-3" 경고 색상 표시 + "기한 내 미응답 시 자동 분쟁 접수" 안내

**Scenario 5: 검수 대상이 아닌 계약 접근**
- **Given:** 계약 status=`pending` (검수 단계 아님)
- **When:** 검수 페이지 접근
- **Then:** 적절한 안내와 함께 계약 상세 페이지로 리다이렉트

**Scenario 6: 반응형 Mobile**
- **Given:** 모바일 (≤768px) 접근
- **When:** 검수 폼 렌더링
- **Then:** 합격/거절 버튼 풀 너비, 모달 정상 동작, 터치 가능

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (계약 데이터) + Client Component (폼, 모달, 카운트다운)
- **UI:** Tailwind CSS + shadcn/ui (`Dialog`, `Textarea`, `Select`, `Button`) — CON-14
- **인증:** RBAC Buyer 역할 + 계약 소유권 검증 (REQ-NF-016)
- **성능:** LCP p95 ≤ 2,000ms
- **안정성:** 중복 제출 방지 (버튼 disabled), 확인 모달 이중 안전장치
- **보안:** 계약 금액 로깅 시 마스킹
- **접근성:** 모달 Focus Trap, 카운트다운 aria-live, WCAG 2.1 AA

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] 합격/거절 폼 단위 테스트 (사유 필수 검증, 상태 전환 확인)
- [ ] 확인 모달 인터랙션 테스트
- [ ] 카운트다운 타이머 정확성 테스트
- [ ] RBAC 접근 제어 테스트
- [ ] 반응형 레이아웃 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-002 | 계약 + 에스크로 Seed 데이터 | 필수 |
| API-008 | submitInspection DTO | 필수 |
| FC-007 | 검수 승인 Command | 필수 |
| FC-008 | 검수 거절 Command | 필수 |
| FC-003 | RBAC 미들웨어 | 필수 |
| UI-005 | 에스크로 결제 흐름 UI (선행 흐름) | 권장 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| TEST-003 | submitInspection(approve) 단위 테스트 |
| TEST-004 | submitInspection(reject) + 분쟁 전환 테스트 |
| TEST-005 | 검수 기한 만료 자동 분쟁 테스트 |

### 참고사항
- 검수 기한 만료 자동 분쟁 전환은 `CRON-001` 배치 범위 — UI는 결과를 표시만 함
- 분쟁 중재 처리 UI는 `UI-008` (Admin 대시보드) 범위
