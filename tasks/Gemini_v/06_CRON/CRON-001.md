---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-001: 검수 기한(7일) 만료 자금 동결 및 분쟁 전환 배치"
labels: 'backend, cron, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-001] 검수 기한 만료(`inspecting` > 7일) 자동 감지 스크립트
- 목적: Vercel Cron을 이용해 주기적으로 DB를 스크러빙(Scrubbing)하며, 수요기업이 고의/실수로 7일 넘게 "검수" 처리를 안 해줄 경우 시공사(SI)를 보호하기 위해 시스템이 강제로 해당 건을 분쟁(`disputed`) 상태로 돌려버리고 관련자에게 알리는 자동화 로직.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-005` (7영업일 미응답 시 자동 분쟁 전환)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Vercel Cron 엔드포인트 세팅 (`/api/cron/escrow-expire`).
- [ ] Target 조회 쿼리: `Contract.status === 'inspecting'` 상태이면서, `updatedAt`(또는 검수시작일) 기준 `7일`이 초과된 데이터 일괄 Load.
- [ ] 파이프라인 수행 (단일 트랜잭션):
  - 1. 적발된 `Contract` 들의 상태를 일괄 `disputed` 로 Update.
  - 2. `EscrowTx` 는 안전하게 `held` 인 채로 보류 유지 확인.
- [ ] FC-023(알림 모듈)을 루프 내에서, 혹은 큐를 이용해 양 당사자와 중재팀에게 발송(`"7일 초과로 분쟁 상태가 되었습니다"`).

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: Vercel Cron 작동 트리거 확인
- Given: 검수를 시작한 지 10일이 넘은 방사선 폐기(고아) 상태의 계약건
- When: Cron 배치가 가동됨
- Then: 쿼리 시간이 길어서 타임아웃 되기 전에, 빠른 조건부 스캔을 통해 이 계약을 집어내어 `disputed`로 강제 전이시키고 중재 센터(Admin Slack 등)로 핑을 치며 종결된다.

## :gear: Technical & Non-Functional Constraints
- 제약/구조: 배치(Batch) 작업은 수 십 건이 동시에 변경될 수 있으므로, 루프(Loop)를 돌 때 카카오톡 알림을 동기(`await`)로 때리다가 API 504 타임아웃이 걸리지 않도록 `Promise.allSettled` 로 병렬 비동기 처리하시오.

## :checkered_flag: Definition of Done (DoD)
- [ ] Vercel JSON에 크론 스케줄(예: 매일 자정 또는 1시간 간격)이 세팅되어 있는가?
- [ ] 상태 전이가 10분 내 타임라인에 무사히 동작하는가?

## :construction: Dependencies & Blockers
- Depends on: #FC-007, #FC-023
- Blocks: None
