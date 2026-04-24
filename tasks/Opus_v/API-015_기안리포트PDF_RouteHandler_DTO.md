---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-015: Report 도메인 — 기안용 리포트 PDF 생성 (POST /api/reports/pdf) Route Handler DTO, 4섹션 구조 정의"
labels: 'feature, backend, api-contract, si-profile, pdf, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-015] 기안용 리포트 PDF 생성 (`POST /api/reports/pdf`) Route Handler DTO 및 4섹션 구조 정의
- 목적: 수요기업이 경영진 기안 보고에 사용할 **SI 파트너 평가 리포트 PDF**를 생성하는 Route Handler의 **Request/Response DTO**, **PDF 4섹션(재무·기술·인증·리뷰) 구조**, **에러 코드**를 정의한다. PDF 생성 소요 p95 ≤ 5초를 달성해야 하며, 기안 첫 보고 통과율 ≥ 80% 달성을 위한 핵심 기능이다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-010`](../../docs/06_SRS-v1.md) — 기안용 리포트 PDF 자동 생성 (4섹션)
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #13`](../../docs/06_SRS-v1.md) — `POST /api/reports/pdf` Route Handler
- API Overview: [`06_SRS-v1.md#3.3 API-09`](../../docs/06_SRS-v1.md) — 기안 리포트 PDF 생성 (p95 ≤ 5초)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-015`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO 정의
- [ ] `GenerateReportPdfRequest` 타입 정의 (`lib/contracts/report/generate-report-pdf.ts`)
  ```typescript
  export interface GenerateReportPdfRequest {
    siPartnerId: string;           // 대상 SI 파트너 ID (cuid)
    includeComparison?: boolean;   // 타 SI 비교 포함 여부 (선택)
    comparisonPartnerIds?: string[];// 비교 대상 SI ID 목록 (최대 3개)
    requesterName?: string;        // 보고서 요청자명 (PDF 표지용)
    requesterCompany?: string;     // 요청 기업명 (PDF 표지용)
  }
  ```

### 2단계: Zod 유효성 스키마
- [ ] `generateReportPdfSchema` 작성
  ```typescript
  export const generateReportPdfSchema = z.object({
    siPartnerId: z.string().min(1, 'SI 파트너 ID를 입력해주세요'),
    includeComparison: z.boolean().default(false),
    comparisonPartnerIds: z.array(z.string())
      .max(3, '비교 대상은 최대 3개까지 선택 가능합니다')
      .optional(),
    requesterName: z.string().max(100).optional(),
    requesterCompany: z.string().max(255).optional(),
  });
  ```

### 3단계: PDF 4섹션 구조 정의
- [ ] 리포트 PDF 콘텐츠 구조 인터페이스
  ```typescript
  export interface ReportPdfStructure {
    // === 표지 ===
    coverPage: {
      title: string;                  // "SI 파트너 평가 리포트"
      siCompanyName: string;
      generatedAt: string;            // YYYY-MM-DD
      requesterName?: string;
      requesterCompany?: string;
    };

    // === Section 1: 재무 분석 ===
    financialSection: {
      sectionTitle: '재무 분석';
      financialGrade: string | null;
      financialGradeUpdatedAt: string | null;
      gradeDescription: string;       // 등급 해설 (A: 매우 우수, B: 우수 등)
    };

    // === Section 2: 기술 역량 ===
    technicalSection: {
      sectionTitle: '기술 역량';
      successRate: number;
      completedProjects: number;
      failedProjects: number;
      capabilityTags: string[];
      tier: string;
    };

    // === Section 3: 제조사 인증 현황 ===
    certificationSection: {
      sectionTitle: '제조사 인증 현황';
      badges: {
        manufacturerName: string;
        issuedAt: string;
        expiresAt: string;
        isActive: boolean;
      }[];
      totalActiveBadges: number;
    };

    // === Section 4: 고객 리뷰 ===
    reviewSection: {
      sectionTitle: '고객 리뷰';
      avgRating: number | null;
      totalReviews: number;
      recentReviews: {
        rating: number;
        comment: string;
        reviewerCompany: string;
        date: string;
      }[];
    };
  }
  ```

### 4단계: Response 규격 정의
- [ ] JSON 메타 응답
  ```typescript
  export interface GenerateReportPdfSuccessResponse {
    success: true;
    data: {
      reportId: string;
      siPartnerId: string;
      siCompanyName: string;
      generatedAt: string;
      pdfUrl: string;            // PDF 다운로드 URL
      pdfSizeBytes: number;
      sections: string[];        // ['재무 분석', '기술 역량', '제조사 인증 현황', '고객 리뷰']
    };
  }
  ```
- [ ] PDF 바이너리 응답 (`GET /api/reports/[reportId]/download`)
  ```
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="SI_Report_{companyName}_{date}.pdf"
  ```

### 5단계: 에러 코드 정의
- [ ] `GenerateReportPdfErrorCode` 정의
  ```typescript
  export enum GenerateReportPdfErrorCode {
    VALIDATION_ERROR     = 'RPT_015_VALIDATION',
    PARTNER_NOT_FOUND    = 'RPT_015_PARTNER_NOT_FOUND',
    PROFILE_INCOMPLETE   = 'RPT_015_PROFILE_INCOMPLETE',
    PDF_GENERATION_FAILED= 'RPT_015_PDF_FAILED',
    PDF_TIMEOUT          = 'RPT_015_PDF_TIMEOUT',
    UNAUTHORIZED         = 'RPT_015_UNAUTHORIZED',
    INTERNAL_ERROR       = 'RPT_015_INTERNAL',
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: PDF 생성 성공 (4섹션 포함)**
- **Given:** 수요기업이 SI 프로필 상세 페이지에서 "기안 리포트 다운로드" 요청
- **When:** `POST /api/reports/pdf`를 호출함
- **Then:** PDF 생성 ≤ 5초, 재무·기술·인증·리뷰 4섹션 100% 포함

**Scenario 2: PDF 바이너리 응답 Content-Type**
- **Given:** 리포트 PDF가 생성됨
- **When:** PDF 다운로드 요청
- **Then:** `Content-Type: application/pdf`, 파일명에 회사명·날짜 포함

**Scenario 3: 존재하지 않는 SI 파트너**
- **Given:** 존재하지 않는 `siPartnerId`
- **When:** PDF 생성 요청
- **Then:** `RPT_015_PARTNER_NOT_FOUND` 에러와 404 반환

## :gear: Technical & Non-Functional Constraints
- **구현 방식:** Route Handler (`POST /api/reports/pdf`) — PDF 바이너리 응답 필요
- **PDF 엔진:** jsPDF 기반 — CON-11
- **성능:** PDF 생성 p95 ≤ 5초 — REQ-NF-004
- **KPI 연계:** 경영진 기안 첫 보고 통과율 ≥ 80% — REQ-NF-025

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO가 정의되었는가?
- [ ] `ReportPdfStructure` 4섹션 구조가 정의되었는가?
- [ ] PDF 바이너리 응답 규격이 정의되었는가?
- [ ] 에러 코드 및 HTTP 매핑이 정의되었는가?
- [ ] ESLint / TypeScript 경고 0건인가?

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-003 | `SI_PARTNER` 테이블 | 필수 |
| DB-009 | `SI_PROFILE` 테이블 | 필수 |
| API-014 | SI 프로필 상세 조회 DTO — 프로필 데이터 구조 의존 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FC-015 | 기안용 리포트 PDF 생성 Command 로직 |
| TEST-012 | 기안용 리포트 PDF 생성 테스트 |
| UI-004 | SI 프로필 상세 페이지 — PDF 다운로드 버튼 |
