---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-003: 수요기업 검수 합격(Approve) 승인 흐름 테스트"
labels: 'test, unit, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-003] 검수 승인(`submitInspection(approve)`) 트랜잭션 테스트
- 목적: FC-007 에 의해 작성된 수요기업의 "승인" 요청 처리가 오작동 없이 자금 방출 대기선으로 넘어가며 알림 파장을 일으키는지 종합 확인.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-007` (검수 승인 명령)
- 요구사항: REQ-FUNC-002 AC 부분

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 승인 상태 전이 보장**
  - **Given**: 현재 `inspecting` (검수 중, 입금 상태는 held)인 Contract.
  - **When**: `submitInspection` 액션에 `decision: 'approve'` 를 달아 쏨.
  - **Then**: DB의 상태는 무조건 `release_pending` 으로 Update 되며 Transaction이 종료된다.

- [ ] **Scenario 2: 대시보드 리액션(이벤트 로깅) 모킹**
  - **Given**: 위 SC 1이 구동 된 직후의 환경
  - **When**: EventLog 저장 또는 모니터링 큐를 검방함.
  - **Then**: "방출 대기" 상태로 전이되었음을 의미하는 Log 레코드(`inspection_approved`) 1선이 Admin 쪽을 향해 생성되었는지(Mock SpyOn `toHaveBeenCalled`) 확인한다.

## :gear: Technical Constraint
- 이벤트 분리: 이벤트 기록이 메인 로직 업데이트와 하나의 `$transaction` 안에 래핑되어 Commit 원자성이 보장되는지를 확인하는 쪽으로 `Prisma.mock` 시퀀스를 구성하라. 
