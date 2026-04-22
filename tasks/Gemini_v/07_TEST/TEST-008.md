---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-008: 부도/미활동 SI 파트너 귀책 사유 기반 긴급 AS 전이 로직 테스트"
labels: 'test, unit, as, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-008] SI 파트너 상태 기반 AS 접수 동적 우선순위(`urgent`) 테스트
- 목적: FC-011 설계에서 제시한 "비정상(폐업/정지) SI가 시공한 현장의 AS 요청은 무조건 가장 높은 등급으로 오버라이드 한다"는 무형의 정책이 코드 단위에서 확실히 동작함을 입증.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-011`
- 요구사항: REQ-FUNC-007 AC 부분

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 정상 SI 기업의 민원 접수 (Normal Flow)**
  - **Given**: SI 상태가 `isActive: true` 이며 정상 영업 중. 수요기업이 모달에서 `priority: normal` 로 보냄.
  - **When**: 서버 액션을 통과하여 DB에 입력됨.
  - **Then**: 타겟 티켓은 사용자가 입력한 그대로 `priority: 'normal'` 로 저장됨이 보장된다.

- [ ] **Scenario 2: 부도/정지 기업 강제 개입 오버라이드**
  - **Given**: SI 상태가 `isActive: false` (관리자 제재나 폐업) 상태를 띈 Contract 건. 클라이언트는 위 1번과 같이 `priority: normal` 을 던짐.
  - **When**: 서버 액션을 통과하려 함.
  - **Then**: 클라이언트 파라미터가 무시(Override) 되고, 룰 엔진에 의해 레코드가 강제로 `urgent` 상태로 상향(Up-casted)되어 저장됨을 증명. 이로 인해 운영팀의 감시망 최상단에 올라가는지 확인.

- [ ] **Scenario 3: 필수 입력 폼(Zod) 검증**
  - **Given**: 증상설명(`symptomDescription`)이 한 글자도 없는 파라미터.
  - **When**: 접수를 시도함.
  - **Then**: `ZodError` 또는 예외 처리를 거치며 400 에러를 배출함.

## :gear: Technical Constraint
- 정책 테스트: 이 파트는 시스템의 윤리/경영적 정책이 시스템으로 녹여진 부분이다. SI 의 DB 객체 상태를 철저하게 모킹(Mocking)하여 두 가지 분기가 If-Else 문을 전부 순회(Code Coverage 100%) 하도록 단위 테스트를 세팅 바람.
