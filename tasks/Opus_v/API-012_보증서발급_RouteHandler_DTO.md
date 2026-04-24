---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-012: Warranty 도메인 — 보증서 발급 (POST /api/warranty/issue) Route Handler DTO, PDF 바이너리 응답 규격 정의"
labels: 'feature, backend, api-contract, as-warranty, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-012] 보증서 발급 (`POST /api/warranty/issue`) Route Handler DTO 및 PDF 바이너리 응답 규격 정의
- 목적: 에스크로 결제 완료 시 **AS 보증서를 자동 발급**하는 Route Handler의 **Request/Response DTO**, **PDF 바이너리 응답 규격**, **보증서 필수 포함 항목**, **에러 코드**를 정의한다. 보증서에는 지정 로컬 AS 업체명·연락처·보증 범위가 100% 명시되어야 하며, 발급 소요 시간은 ≤ 1분이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-006`](../../docs/06_SRS-v1.md) — 에스크로 완료 시 AS 보증서 자동 발급
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #10`](../../docs/06_SRS-v1.md) — `POST /api/warranty/issue` Route Handler
- 데이터 모델: [`06_SRS-v1.md#6.2.10 WARRANTY`](../../docs/06_SRS-v1.md) — WARRANTY 테이블 스키마
- 시퀀스 다이어그램: [`06_SRS-v1.md#3.4.1`](../../docs/06_SRS-v1.md) — 에스크로 결제 흐름 (보증서 자동 발급 트리거)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-012`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `IssueWarrantyRequest` 타입 정의 (`lib/contracts/warranty/issue-warranty.ts`)
  ```typescript
  export interface IssueWarrantyRequest {
    contractId: string;           // 계약 ID (cuid)
    escrowTxId: string;           // 에스크로 TX ID (cuid)
  }
  ```

### 2단계: Zod 유효성 스키마
- [ ] `issueWarrantySchema` 작성
  ```typescript
  export const issueWarrantySchema = z.object({
    contractId: z.string().min(1, '계약 ID를 입력해주세요'),
    escrowTxId: z.string().min(1, '에스크로 TX ID를 입력해주세요'),
  });
  ```

### 3단계: 보증서 PDF 콘텐츠 구조 정의
- [ ] 보증서 필수 포함 항목 인터페이스
  ```typescript
  export interface WarrantyPdfContent {
    // === 헤더 ===
    warrantyId: string;              // 보증서 번호
    issuedAt: string;                // 발급 일시

    // === 계약 정보 ===
    contractId: string;
    buyerCompanyName: string;        // 수요기업명
    siPartnerName: string;           // SI 파트너명
    totalAmount: number;             // 계약 금액

    // === AS 보증 정보 (필수 100% 명시) ===
    asCompanyName: string;           // 지정 로컬 AS 업체명
    asContactPhone: string;          // AS 업체 연락처
    asContactEmail?: string;         // AS 업체 이메일
    coverageScope: string;           // 보증 범위 설명
    coveragePeriodMonths: number;    // 보증 기간 (개월)
    coverageStartDate: string;       // 보증 시작일
    coverageEndDate: string;         // 보증 종료일

    // === 하단 법적 안내 ===
    termsAndConditions: string;      // 보증 약관 요약
  }
  ```

### 4단계: Response 규격 정의 (JSON + PDF 바이너리)
- [ ] JSON 메타데이터 응답 (보증서 생성 확인)
  ```typescript
  export interface IssueWarrantySuccessResponse {
    success: true;
    data: {
      warrantyId: string;
      contractId: string;
      escrowTxId: string;
      asCompanyName: string;
      asContactPhone: string;
      coverageScope: string;
      coveragePeriodMonths: number;
      issuedAt: string;
      pdfUrl: string;                // PDF 다운로드 URL
    };
  }
  ```
- [ ] PDF 바이너리 응답 규격 (`GET /api/warranty/[warrantyId]/pdf`)
  ```typescript
  // Response Headers:
  // Content-Type: application/pdf
  // Content-Disposition: attachment; filename="warranty_{warrantyId}.pdf"
  // Content-Length: {bytes}
  ```

### 5단계: 트리거 조건 및 자동 발급 규칙
- [ ] 보증서 자동 발급 트리거 조건
  ```typescript
  export const WARRANTY_ISSUE_TRIGGER = {
    // ESCROW_TX.state === 'held' && admin_verified_at IS NOT NULL
    escrowState: 'held',
    adminVerified: true,
    // WARRANTY가 해당 contract에 대해 미발급 상태
    notAlreadyIssued: true,
  };
  ```
- [ ] 발급 소요 시간 제한: ≤ 1분 (60초)
- [ ] 기본 보증 기간: 12개월 (`coverage_period_months` DEFAULT 12)

### 6단계: 에러 코드 정의
- [ ] `IssueWarrantyErrorCode` 정의
  ```typescript
  export enum IssueWarrantyErrorCode {
    VALIDATION_ERROR       = 'WAR_012_VALIDATION',
    CONTRACT_NOT_FOUND     = 'WAR_012_CONTRACT_NOT_FOUND',
    ESCROW_NOT_VERIFIED    = 'WAR_012_ESCROW_NOT_VERIFIED',
    ALREADY_ISSUED         = 'WAR_012_ALREADY_ISSUED',
    AS_PROVIDER_NOT_FOUND  = 'WAR_012_AS_PROVIDER_NOT_FOUND',
    PDF_GENERATION_FAILED  = 'WAR_012_PDF_FAILED',
    INTERNAL_ERROR         = 'WAR_012_INTERNAL',
  }
  ```
  | 에러 코드 | HTTP | 설명 |
  |:---|:---:|:---|
  | `WAR_012_ESCROW_NOT_VERIFIED` | 400 | 에스크로 미확인 (Admin 입금 확인 전) |
  | `WAR_012_ALREADY_ISSUED` | 409 | 이미 보증서 발급됨 |
  | `WAR_012_AS_PROVIDER_NOT_FOUND` | 404 | 지정 AS 업체 정보 미등록 |
  | `WAR_012_PDF_FAILED` | 500 | PDF 생성 실패 |

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 에스크로 완료 트리거 → 보증서 자동 발급**
- **Given:** 에스크로 결제가 완료됨 (state=held, admin_verified_at NOT NULL)
- **When:** `POST /api/warranty/issue`가 트리거됨
- **Then:** WARRANTY 레코드 INSERT, 보증서에 AS 업체명·연락처·보증범위 100% 명시, 발급 소요 ≤ 1분

**Scenario 2: 보증서 PDF에 필수 항목 포함 검증**
- **Given:** 보증서가 정상 발급됨
- **When:** PDF 콘텐츠를 파싱함
- **Then:** `asCompanyName`, `asContactPhone`, `coverageScope`, `coveragePeriodMonths` 모두 포함

**Scenario 3: 이미 발급된 보증서 중복 요청**
- **Given:** 해당 계약에 WARRANTY가 이미 존재함
- **When:** 동일 계약에 보증서 발급을 요청함
- **Then:** `WAR_012_ALREADY_ISSUED` 에러와 409 반환

**Scenario 4: 에스크로 미확인 상태에서 발급 시도**
- **Given:** ESCROW_TX.admin_verified_at IS NULL
- **When:** 보증서 발급을 요청함
- **Then:** `WAR_012_ESCROW_NOT_VERIFIED` 에러와 400 반환

## :gear: Technical & Non-Functional Constraints
- **구현 방식:** Route Handler (`POST /api/warranty/issue`) — PDF 바이너리 응답 필요로 Route Handler 사용
- **PDF 생성:** jsPDF 기반 (CON-11 Next.js 내장 구현)
- **성능:** PDF 생성 소요 p95 ≤ 60초 (REQ-FUNC-006)
- **보안:** 보증서 PDF URL은 인증된 사용자(수요기업/Admin)만 접근 가능

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO 및 PDF 콘텐츠 구조가 정의되었는가?
- [ ] 트리거 조건 (에스크로 완료) 이 문서화되었는가?
- [ ] PDF 바이너리 응답 Content-Type/Disposition 규격이 정의되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-011 | `WARRANTY` 테이블 스키마 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FC-014 | 보증서 자동 발급 Command 로직 |
| TEST-007 | 보증서 자동 발급 테스트 |
| UI-005 | 에스크로 결제 흐름 UI — 보증서 다운로드 |
