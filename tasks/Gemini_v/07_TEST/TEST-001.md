---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-001: 에스크로 계약 생성(createContract) 단위 집중 테스트"
labels: 'test, unit, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-001] 에스크로 계약 최초 생성 파이프라인 무결성 검증
- 목적: FC-005 명세로 작성된 계약 생성 트랜잭션이 요구사항(REQ-FUNC-001)의 수용 기준을 완벽하게 통과하는지 방어하는 Jest/Vitest 기반 테스트 작성.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-005` (계약 생성 로직)
- 시나리오: REQ-FUNC-001 AC 문서 대응

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 정상 생성 가동**
  - **Given**: 권한 있는 기업(Role: buyer)의 모의 세션과 유효한 계약금액 파라미터.
  - **When**: `createContract` FC를 구동.
  - **Then**: DB에 `status = pending` 인 Contract 1건과 EscrowTx 1건이 짝을 이뤄 Insert 되어야 하며, 응답값에 가상계좌(무통장) 안내 정보가 담겨 있어야 한다.

- [ ] **Scenario 2: 필수 필드 누락(Zod 차단)**
  - **Given**: 금액 필드가 누락되거나 음성/문자열이 담겨있는 조작된 DTO.
  - **When**: FC 함수 호출 (Controller Level).
  - **Then**: Zod Exception 혹은 400 에러를 던지며 DB 접근 시도 자체를 하지 말아야 한다.

## :gear: Technical Constraint
- Mocking: 본 테스트는 실제 DB를 치기보다 Prisma Mocking 라이브러리(`jest-mock-extended` 등)를 채용해 트랜잭션 함수가 몇 번 호출되었는지 Call Stack을 단절시켜 검증하는 순수 Unit Test 로 작성 바람.

## :checkered_flag: Definition of Done (DoD)
- [ ] 테스트 파일(예: `createContract.test.ts`)이 생성되었는가?
- [ ] Code Coverage 통과 여부 검증 (해당 함수).
