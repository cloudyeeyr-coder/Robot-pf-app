---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-007: 에스크로 방출 연계 1:1 보증서 자동 발급 증명"
labels: 'test, unit, warranty, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-007] 워런티 결합(`Warranty` 1:1 Mapping) 단위 테스트
- 목적: FC-009 끝단에서 불려 나오는 보증서 정보 생성 함수(FC-014)가 '계약 당 오직 1개만' 생성되며 발급일자 등의 데이터 제약을 잘 지키는지 증명한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-014`
- 요구사항: REQ-FUNC-006 AC (1장 발급 룰)

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 성공적인 1:1 레코드 구성**
  - **Given**: 방금 막 `completed` 로 끝난 신선한 계약.
  - **When**: `issueWarranty` 트리거가 당겨짐
  - **Then**: DB에 `Warranty` 레코드가 정상 Insert 되며, 이 때 `issuedAt` 시점이 방출일과 일치하고 보증 기한(예: 1년, `expiresAt`)이 수학적으로 정확하게 박혀 있어야 한다.

- [ ] **Scenario 2: 다중 발급 락킹 (중복 방어)**
  - **Given**: 이미 해당 Contract에 대해 워런티가 존재하는 상황.
  - **When**: (의도적이나 버그로 인해) 워런티 발급 함수를 또 한 번 Call 함.
  - **Then**: "이미 보증서가 발급되었습니다" 처럼 단호한 Unique 제약조건 에러나, Domain 단의 Validation 에러를 품어 시스템의 결합 데이터를 보호해야 함.

## :gear: Technical Constraint
- 연산 기반 Mocking: `expiresAt` 연산 결과가 `Date.now() + 1 year` 룰을 따르는지 `toEqual()` 과 같은 Matcher로 체킹하되, 타임존 차이로 인해 테스트가 깨지지 않도록 여유있는 Date 비교를 수행할 것.
