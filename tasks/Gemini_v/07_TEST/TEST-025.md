---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-025: O2O 슬롯 0건 대기(Suggestion) 전환 알고리즘 검증"
labels: 'test, unit, o2o, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-025] 만석 슬롯 우회 대기 추천(`FC-026`) 로직 테스트
- 목적: 빈 자리가 없을 때 고객이 튕겨나가지 않고, 백엔드 내부의 "가까운 가용 슬롯 추천 엔진"이 가장 합법적인 대안 시간을 제시하는지 확인.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-026`
- 요구사항: REQ-FUNC-026 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 대체 일정 제안 스캐너 정상 작동**
  - **Given**: 오늘 일정이 모두 100% 매진(Confirmed/Pending)된 Mock Database 상태.
  - **When**: 고객이 오늘 일자를 예약 타겟으로 던짐.
  - **Then**: 결과 코드로 "400(또는 409) Not Available" 이 떨어지는데 끝이 아니라, Payload 안의 `suggestedSlot` 에 "내일 10:00" 등 시스템이 계산해낸 가장 빠른 여유일이 섞여있어야 한다.

- [ ] **Scenario 2: 대기 예약 연동망**
  - **Given**: 위와 같이 꽉 찬 상태에서 대기(Waiting) 큐로 진입을 원함.
  - **When**: 대기 등록 액션 
  - **Then**: 시스템 이벤트/Ops Slack 으로 "해당 지역에 증원이 필요합니다" 류의 대기 알림 메세지가 큐잉 되었는지 모킹 감시.
