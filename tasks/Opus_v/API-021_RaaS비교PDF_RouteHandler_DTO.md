---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-021: RaaS 도메인 — RaaS 비교 결과 PDF (POST /api/raas/pdf) Route Handler DTO, PDF 구조 정의"
labels: 'feature, backend, api-contract, raas, pdf, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [API-021] RaaS 비교 결과 PDF (`POST /api/raas/pdf`) Route Handler DTO 및 PDF 구조 정의
- 목적: API-020(`calculateRaasOptions`)의 3옵션 비교 결과를 **경영진 보고용 PDF**로 변환하는 Route Handler의 Request/Response DTO, PDF 섹션 구조를 정의한다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-FUNC-022`](../../docs/06_SRS-v1.md) — 구매 vs 리스 vs RaaS 비교 리포트
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #18`](../../docs/06_SRS-v1.md) — `POST /api/raas/pdf`
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-021`](../07_TASK-LIST-v1.md)
- 선행 DTO: API-020 (`RaasComparisonResult` 구조)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO
- [ ] `GenerateRaasPdfRequest` 정의 (`lib/contracts/raas/generate-raas-pdf.ts`)
  ```typescript
  export interface GenerateRaasPdfRequest {
    comparisonData: RaasComparisonResult; // API-020 계산 결과 전체
    requesterName?: string;
    requesterCompany?: string;
  }
  ```

### 2단계: Zod 스키마
- [ ] `generateRaasPdfSchema` — comparisonData 필수, 부가 정보 선택
  ```typescript
  export const generateRaasPdfSchema = z.object({
    comparisonData: z.object({
      input: z.object({ robotModel: z.string(), quantity: z.number(), termMonths: z.number() }),
      options: z.array(z.any()).length(3),
      recommendation: z.object({ bestOption: z.string(), reason: z.string() }),
    }),
    requesterName: z.string().max(100).optional(),
    requesterCompany: z.string().max(255).optional(),
  });
  ```

### 3단계: PDF 구조 정의
- [ ] PDF 3섹션 구조
  ```typescript
  export interface RaasPdfStructure {
    coverPage: { title: string; robotModel: string; generatedAt: string; };
    comparisonTable: {
      headers: ['항목', '일시 구매', '금융 리스', 'RaaS'];
      rows: { label: string; purchase: string; lease: string; raas: string; }[];
    };
    recommendationSection: {
      bestOption: string;
      reason: string;
      savingsPercent: number;
      chartData?: any;         // 비용 비교 차트 데이터
    };
  }
  ```

### 4단계: Response 규격
- [ ] JSON 메타 응답
  ```typescript
  export interface GenerateRaasPdfSuccessResponse {
    success: true;
    data: { pdfUrl: string; generatedAt: string; fileSizeBytes: number; };
  }
  ```
- [ ] PDF 바이너리: `Content-Type: application/pdf`, `filename="RaaS_Comparison_{model}_{date}.pdf"`

### 5단계: 에러 코드
  ```typescript
  export enum GenerateRaasPdfErrorCode {
    VALIDATION_ERROR = 'RAAS_021_VALIDATION',    // 400
    INVALID_DATA     = 'RAAS_021_INVALID_DATA',  // 400
    PDF_FAILED       = 'RAAS_021_PDF_FAILED',    // 500
    INTERNAL_ERROR   = 'RAAS_021_INTERNAL',      // 500
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 PDF 생성**
- **Given:** 유효한 `RaasComparisonResult` 데이터
- **When:** `POST /api/raas/pdf` 호출
- **Then:** PDF 생성 ≤ 5초, 3옵션 비교 테이블·추천 섹션 포함

**Scenario 2: 잘못된 비교 데이터**
- **Given:** `options` 배열이 2개만 포함
- **When:** 요청 시도
- **Then:** `RAAS_021_INVALID_DATA` 에러 400

## :gear: Technical & Non-Functional Constraints
- **구현:** Route Handler — PDF 바이너리 응답
- **PDF 엔진:** jsPDF — CON-11
- **성능:** PDF 생성 p95 ≤ 5초
- **인증:** 비로그인 사용자도 이용 가능

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO 정의 완료
- [ ] `RaasPdfStructure` 3섹션 구조 정의 완료
- [ ] 에러 코드 정의 완료
- [ ] ESLint / TypeScript 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| API-020 | `calculateRaasOptions` DTO — `RaasComparisonResult` 구조 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FC-021 | RaaS PDF 생성 Command 로직 |
| UI-010 | RaaS 계산기 UI — PDF 다운로드 버튼 |
