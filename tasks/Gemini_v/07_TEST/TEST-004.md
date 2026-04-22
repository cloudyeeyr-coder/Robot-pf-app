---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-004: 파트너 시공물 검수 거절(Reject) 및 분쟁 전환 보호 테스트"
labels: 'test, unit, escrow, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-004] 검수 거절 판단 로직(`submitInspection(reject)`) 테스트 스위트
- 목적: FC-008, FC-010 로직에 명세된 "하자 통보" 발동 시, 자금 방출이 즉각 정지되며 상태가 `disputed` 로 파기(Lock)전환되는지 증명하는 로직.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-008` (검수 거절), `FC-010` (분쟁 접수 연동)
- 요구사항: REQ-FUNC-003 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 상태 동결(분쟁) 전환 확인**
  - **Given**: 갓 시공이 끝난 `inspecting` 단계의 계약체
  - **When**: `decision: reject` 및 `reason` 텍스트를 달아 액션을 때림.
  - **Then**: 결과적으로 상태는 `disputed` 가 되고 이력 레코드에 거절 사유가 명확히 String으로 남겨져 있어야 함.

- [ ] **Scenario 2: 사유 필수화 정책 검증**
  - **Given**: `decision: reject` 만 있고 사유(`reason`) 파라미터가 텅 빈 상태로 접수 시도 조작.
  - **When**: 서버 액션을 통과하려 시도
  - **Then**: 400 Bad Request 급의 Validation Error 가 발생하며 DB 락 전이는 일어나지 않아야 한다.

- [ ] **Scenario 3: 중재 알림 자동 이양 확인**
  - **Given**: 정상 거절 쿼리 통과 후
  - **When**: 알림 모듈(메일러, 슬랙 훅 등 Mock 객체) 감시
  - **Then**: 중재팀 또는 중재자를 향해 `sendNotification` 계열의 큐잉 메시지가 최소 1회 이상 발사 지시되었음이 증명됨. (Mock Spy 호출 여부 판단)

## :gear: Technical Constraint
- 비동기 테스트: 알림이 분리된 큐잉을 타게 되면 테스트 프레임워크가 이를 놓칠 수 있으므로 `advanceTimers` 나 `flushPromises` 등 비동기 타임 슬립 처리 도구들을 활용할 것.
