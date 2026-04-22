---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-026: 수요기업 온보딩 회원가입 원자성(Event Log) 테스트"
labels: 'test, e2e, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-026] 수요기업(Buyer) 회원가입 폼 및 백엔드 트랜잭션 GWT (Given-When-Then) 유닛 테스트
- 목적: 필수 정보 입력 시 계정이 생성되는 동시에 `EventLog` 테이블에 `signup_complete` 로그가 찍히며 원자성이 유지되는지 확인.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-001`
- 요구사항: REQ-FUNC-027 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 성공적인 트랜잭션 데이터 결합 보장**
  - **Given**: 사업자번호가 겹치지 않는 유려한 MOCK 데이터(대표자명, 연락처 등)
  - **When**: FC-001(가입 서버 액션)을 때림.
  - **Then**: `BuyerCompany` 객체가 성공 반환 될 뿐 아니라, 내부 `EventLog` 시스템을 쿼리해보면 이 회사를 지칭하는 가입 이벤트 레코드가 안전하게 Insert 되어있음을 확인.

- [ ] **Scenario 2: 고유키(DB Unique) 중복 제약조건 발동**
  - **Given**: 이미 DB에 박혀있는 사업자 번호 `123-45-67890`.
  - **When**: 해커나 오류로 인해 클라이언트가 이 번호로 가입을 찔러 봄.
  - **Then**: 409 Conflict 에러나 Prisma Unique Constraint Error가 방어해 내며, 이 때는 EventLog 도 같이 만들어지지 않아야 함(원자성 롤백 여부 증명).
