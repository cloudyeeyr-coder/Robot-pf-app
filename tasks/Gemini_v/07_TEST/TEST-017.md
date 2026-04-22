---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-017: 제조사-SI 파트너십 제안 생애주기 종합 (통합) 테스트"
labels: 'test, e2e, partnership, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-017] 제안 연발 체인(수락/거절/만료 3단 콤보) 통합 테스트
- 목적: 제조사가 날린 제안을 SI가 수락하면 연동 뱃지가 꽂히고(FC), 무시하면 CRON이 대기를 폭파시키고 타 업체를 엮어주는 매우 복합적인 생태계 연쇄 파동을 1방에 증명한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-018`, `FC-019`, `CRON-004`, `CRON-005`
- 요구사항: REQ-FUNC-030, 031, 032 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 해피 패스 (Accept 발동 시 뱃지 보상)**
  - **Given**: 제조사가 제안을 발송함(`pending`).
  - **When**: SI가 기한(Deadline) 안으로 `수락` 액션을 송출.
  - **Then**: 제안의 status 가 `accepted` 로 닫힐 뿐만 아니라, **보너스 트랜잭션**으로 `Badge` 테이블에 즉각 `isActive: true` 가 꽂혀 단 릴레이션 데이터가 생겼는지 Prisma 연결 쿼리를 통해 확증하라.

- [ ] **Scenario 2: D+5 침묵 시 파멸 및 대안 추천 프로세스**
  - **Given**: 제안 생성 후 Timers Mock 을 돌려 120시간(5일)을 워프함.
  - **When**: `CRON-005` 만료 스크립트 도킹.
  - **Then**: 대상 제안은 `expired` 로 끔살당하고, 제조사를 향해 알림 배송 메서드가 **"추천 SI 3개사 묶음"** 을 Data Payload로 달고 날아갔는지(Spy 검사) 처절하게 검증.

## :gear: Technical Constraint
- E2E-Like: 이 테스트는 단위 로직을 여럿 엮었으므로 `Prisma.mock` 만 쓰기보다는 InMemory DB나 테스트 DB를 한시적으로 띄워 실제 Row가 들어가는 걸 확인하는 GWT 결합 테스트로 짤 것을 추천.
