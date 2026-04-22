---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-003: 뱃지 유효기간 초과분 자동 무효화 스크립트"
labels: 'backend, cron, badge, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-003] 뱃지 만료일(`expiresAt`) 도래 자동 비활성화
- 목적: 기한이 만료된 뱃지를 더 이상 SI 검색망이나 프로필 화면에 노출되지 않도록(REQ-FUNC-014 준수) 정기적으로 쓸어담아 `isActive: false` 로 폐기 처리하는 스크립트.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-014` (SI 프로필 비노출 ≤ 10분 NFR 적용)
- 연관 태스크: FC-017 (수동 철회 로직)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Vercel Cron 엔드포인트 세팅 (`/api/cron/badge-expire`).
- [ ] Target 스캔 쿼리: `isActive: true` 이나 `expiresAt < Date.now()` (만료 도래함) 인 레코드.
- [ ] 일괄 상태 전이:
  - `Badge.isActive` = `false` 로 UpdateMany.
- [ ] 캐시 파기(Revalidate) 호출:
  - 폐기 처리된 모든 SI 식별자에 대해 Next.js 캐시 파기(FC-017과 동일)를 수행하여 검색 현황판(FQ-001)에서 불법 노출되지 않게 조치.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 배치 작업 NFR 달성
- Given: 만료 기한이 오늘 자정인 뱃지 배치를 지닌 SI 파트너(MOCK-003 단위 테스트 셋)
- When: 크론 데몬이 자정에 돌아가면서 상태를 폭파(`updateMany`) 시킴
- Then: 이 크론 워커가 끝난 즉시(최소 10분 내에) 일반 고객이 프로필을 조회하면 해당 뱃지가 `false` 필터에 걸려 보이지 않아야 한다. (배치-캐시 무효화 파이프라인 무결성).

## :gear: Technical & Non-Functional Constraints
- 구조 제약: 만약 한 번에 대상이 1만 건 이상 쿼리된다면 Vercel Edge Runtime Limit (Timeout 10s)에 걸려 터질 수 있다. `updateMany` 를 쓰되 캐시(Revalidate)가 터지지 않게끔 Chunks로 끊어 처리하는 등 방어 설계.

## :checkered_flag: Definition of Done (DoD)
- [ ] 뱃지 `updateMany` 쿼리와 조건문이 결합되어 컴파일되는가?
- [ ] Vercel Cron JSON 세팅 

## :construction: Dependencies & Blockers
- Depends on: #FC-016
- Blocks: None
