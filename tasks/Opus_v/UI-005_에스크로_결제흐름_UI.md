---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-005: 에스크로 결제 흐름 UI — 법인 계좌 안내·예치 확인·보증서 다운로드"
labels: 'feature, frontend, ui, escrow, payment, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-005] 에스크로 결제 흐름 UI
- 목적: 수요기업이 SI 파트너와의 계약 체결 후 무통장 입금 기반의 에스크로 결제를 안심하고 진행할 수 있도록 3단계 흐름 UI를 제공한다. (1) 지정 법인 계좌 안내 → (2) Admin 입금 확인 후 예치 완료 화면 → (3) AS 보증서 PDF 다운로드. 사용자에게 자금이 안전하게 보호된다는 신뢰감을 시각적으로 전달하는 것이 핵심이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-001`](../06_SRS-v1.md) — 에스크로 결제 (Admin 수동 확인)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-006`](../06_SRS-v1.md) — AS 보증서 자동 발급
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.1`](../06_SRS-v1.md) — 에스크로 결제 및 자금 방출 흐름
- Use Case: [`06_SRS-v1.md#UC-05`](../06_SRS-v1.md) — 에스크로 결제 실행
- 데이터 모델: `CONTRACT` (6.2.4), `ESCROW_TX` (6.2.5), `WARRANTY` (6.2.10)
- 제약사항: `CON-01` — 법인 계좌 수기 입출금, 상태값만 기록
- 연동: `API-003`/`FC-005` (계약 생성), `API-004`/`FC-006` (예치 확인), `API-012`/`FC-014` (보증서)
- Mock 데이터: `MOCK-002` (계약 5건, 에스크로 TX 5건)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 라우트 및 페이지 구조
- [ ] Next.js App Router 경로 설계:
  - `/app/contracts/[contractId]/payment/page.tsx` — 법인 계좌 안내 (Step 1)
  - `/app/contracts/[contractId]/payment/status/page.tsx` — 예치 상태 확인 (Step 2)
  - `/app/contracts/[contractId]/warranty/page.tsx` — 보증서 다운로드 (Step 3)
- [ ] 인증 필수 (Buyer 역할) — RBAC 미들웨어 적용
- [ ] 계약 소유권 검증: 로그인 사용자의 buyer_company_id === contract.buyer_company_id

### 2단계: Step 1 — 법인 계좌 안내 페이지
- [ ] 계약 정보 요약 카드: SI 파트너명, 총 계약 금액, 계약 생성일
- [ ] 지정 법인 계좌 정보 표시:
  - 은행명, 계좌번호, 예금주명
  - '계좌번호 복사' 버튼 (클립보드 복사 + Toast "복사되었습니다")
- [ ] 입금 안내 문구:
  - "아래 계좌로 계약금을 입금해주세요."
  - "입금 후 운영팀이 확인하면 에스크로 예치가 완료됩니다."
  - "평균 입금 확인 소요: 1~2영업일"
- [ ] 에스크로 보호 안내 배너: "입금 후 자금은 시공 완료 및 검수 승인 전까지 안전하게 보호됩니다."
- [ ] '입금 완료했습니다' 안내 버튼 → 예치 상태 확인 페이지로 이동

### 3단계: Step 2 — 예치 상태 확인 페이지
- [ ] 에스크로 상태 Stepper UI (3단계 진행 표시):
  - Step 1: 입금 대기 중 / 입금 완료
  - Step 2: Admin 확인 중 / 예치 완료 (held)
  - Step 3: 보증서 발급 완료
- [ ] 현재 상태별 UI 분기:
  - `pending` (입금 대기): "입금을 기다리고 있습니다" + 법인 계좌 정보 재표시
  - `escrow_held` (예치 완료): "에스크로 예치가 완료되었습니다!" 성공 배너 + 보증서 다운로드 버튼 활성화
  - `disputed` (분쟁 중): "분쟁이 접수되었습니다" 경고 배너 + 운영팀 연락처
- [ ] 자동 새로고침 또는 폴링: 30초 간격 상태 확인 (Admin 확인 반영)
- [ ] 에스크로 TX 상세 정보: 예치 금액, held_at 시각, admin_verified_at 시각

### 4단계: Step 3 — 보증서 다운로드
- [ ] 보증서 정보 카드:
  - AS 업체명, 연락처, 이메일
  - 보증 범위, 보증 기간 (개월)
  - 발급일
- [ ] 'AS 보증서 PDF 다운로드' 버튼 → `GET` or 보증서 `pdf_url` 링크
- [ ] 다운로드 중 로딩 스피너 + '다운로드 중...' 텍스트
- [ ] 보증서 미발급 상태 → "보증서가 곧 발급됩니다. 잠시 후 다시 확인해주세요." 안내

### 5단계: 에러 및 예외 상태 처리
- [ ] 존재하지 않는 계약 ID → 404 페이지
- [ ] 타인의 계약 접근 시도 → 403 Forbidden + "접근 권한이 없습니다" 안내
- [ ] 네트워크 에러 → 에러 바운더리 + 재시도 버튼
- [ ] PDF 다운로드 실패 → Toast "보증서 다운로드에 실패했습니다"

### 6단계: 반응형 및 접근성
- [ ] Desktop: 중앙 정렬 카드 레이아웃 (max-width: 720px)
- [ ] Mobile: 풀 너비, 계좌번호 복사 버튼 충분한 터치 영역(44px+)
- [ ] Stepper UI 키보드 접근성, 현재 단계 `aria-current="step"`
- [ ] 상태 변경 시 `aria-live="polite"` 스크린 리더 안내

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 법인 계좌 안내 표시**
- **Given:** 수요기업이 SI 파트너와 계약을 체결함
- **When:** 결제 페이지(`/contracts/[id]/payment`)에 접근
- **Then:** 지정 법인 계좌 정보(은행명, 계좌번호, 예금주)가 표시되고, '계좌번호 복사' 버튼 동작

**Scenario 2: 예치 완료 확인**
- **Given:** Admin이 입금을 확인하고 에스크로 상태를 'held'로 변경함
- **When:** 예치 상태 페이지에서 상태가 갱신됨
- **Then:** Stepper가 'Admin 확인 완료' 단계로 진행, "에스크로 예치 완료" 성공 배너 표시, admin_verified_at 시각 표시

**Scenario 3: 보증서 PDF 다운로드**
- **Given:** 에스크로 예치 완료 후 보증서가 자동 발급됨
- **When:** '보증서 다운로드' 버튼 클릭
- **Then:** PDF가 브라우저로 다운로드되며, AS 업체명·연락처·보증범위가 포함됨

**Scenario 4: 타인 계약 접근 차단**
- **Given:** 로그인 사용자가 타인의 계약 ID로 접근 시도
- **When:** 페이지 로드
- **Then:** 403 Forbidden + "접근 권한이 없습니다" 안내 (크래시 없음)

**Scenario 5: 계좌번호 클립보드 복사**
- **Given:** 법인 계좌 안내 페이지 표시 상태
- **When:** '계좌번호 복사' 버튼 클릭
- **Then:** 계좌번호가 클립보드에 복사, Toast "복사되었습니다" 표시

**Scenario 6: 보증서 미발급 상태 안내**
- **Given:** 에스크로 예치 완료 후 보증서 발급 처리 중 (≤1분)
- **When:** 보증서 페이지 접근
- **Then:** "보증서가 곧 발급됩니다" 안내 + 자동 재확인 폴링

## :gear: Technical & Non-Functional Constraints
- **구현:** Server Component (계약/에스크로 데이터 프리페칭) + Client Component (클립보드, 폴링, PDF 다운로드)
- **UI:** Tailwind CSS + shadcn/ui (`Card`, `Button`, `Badge`, `Stepper` 커스텀) — CON-14
- **인증:** RBAC 미들웨어 필수 — Buyer 역할 + 계약 소유권 검증 (REQ-NF-016)
- **성능:** 페이지 LCP p95 ≤ 2,000ms, 상태 폴링 30초 간격 (서버 부하 최소화)
- **안정성:** 에스크로 상태 조회 실패 시 마지막 상태 캐시 표시 + 재시도
- **보안:** 계좌 정보는 서버에서만 렌더링 (클라이언트 JS 번들에 포함 금지), 요청 로깅 시 계좌번호 마스킹
- **접근성:** Stepper `aria-current`, 복사 완료 Toast `role="status"`, WCAG 2.1 AA

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6) 충족
- [ ] 3단계 에스크로 흐름 (계좌 안내 → 예치 확인 → 보증서) 정상 동작
- [ ] RBAC 접근 제어 테스트 (타인 계약 403 차단 확인)
- [ ] 클립보드 복사 기능 테스트
- [ ] Stepper 상태별 UI 분기 테스트 (pending/held/disputed)
- [ ] 반응형 레이아웃 (Mobile/Desktop) 검증
- [ ] Lighthouse 접근성 ≥ 90, ESLint/TypeScript 경고 0건

## :construction: Dependencies & Blockers

### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| NFR-001 | Next.js 프로젝트 세팅 | 필수 |
| MOCK-002 | 계약 5건 + 에스크로 TX 5건 Seed 데이터 | 필수 |
| API-003 | createContract Server Action DTO | 필수 |
| FC-005 | 계약 생성 Command | 필수 |
| FC-006 | Admin 에스크로 예치 확인 Command | 필수 (상태 변경 연동) |
| FC-014 | 보증서 자동 발급 로직 | 필수 (보증서 다운로드) |
| FC-003 | RBAC 미들웨어 (Buyer 인증) | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| UI-006 | 검수 승인/거절 UI — 예치 완료 후 시공·검수 진행 |
| TEST-001 | createContract 단위 테스트 |
| TEST-002 | updateEscrowStatus 단위 테스트 |
| TEST-007 | 보증서 자동 발급 테스트 |

### 참고사항
- 법인 계좌 정보는 환경 변수 또는 Admin 설정에서 관리 (하드코딩 금지)
- Admin 에스크로 확인 UI는 `UI-008` (Admin 대시보드) 범위
- PG 연동은 Phase 2 — MVP에서는 무통장 입금 + Admin 수동 확인 (CON-01)
- 에스크로 자금은 플랫폼이 직접 보관하지 않음 — 상태값만 기록 (CON-01)
