---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-024: O2O 방문 매니저 최종 리포트 JSON 검증기"
labels: 'test, unit, o2o, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-024] O2O 리포트(`submitVisitReport`) JSON 페이로드 구조 테스트
- 목적: 현장 조사 매니저가 기입한 평가/상담 정보가 깨지지 않고 Zod 검증기를 통과하여 예약 상태를 깔끔히 `completed` 로 닫는지 입증.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-027`
- 요구사항: REQ-FUNC-025 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 정형/비정형 복합 데이터 저장 능력**
  - **Given**: 추천 SI 3개의 ID, 2,000만원이라는 상담 견적, 텍스트 형태의 보고를 잘 버무린 JSON 형태의 데이터. 현재 단계는 `confirmed` (예약확정) 상태.
  - **When**: `submit` 을 단행.
  - **Then**: 예약 상태는 `completed` 로 굳어지며, 해당 `O2oBooking` 레코드의 `reportContent` 필드가 null 파싱에러 등을 내지 않고 JSON 포맷에 맞춰 데이터 저장되었음을 `findUnique` 로 재조회하여 검증.

- [ ] **Scenario 2: 승인 불가 상태에서의 작성 기만 행위 타격**
  - **Given**: 이전에 이미 취소된(`cancelled`) 예약이거나 `pending` 상태인 건.
  - **When**: 누군가 강제로 매니저 앱을 흉내내 리포트 쓰기를 시도.
  - **Then**: "승인/대기 시간이 아님" 에뮬레이션 방어에 걸려 403 에러로 방어해야 함.
