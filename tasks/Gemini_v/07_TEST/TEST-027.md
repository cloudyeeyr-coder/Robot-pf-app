---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-027: SI 파트너 가입 격리 구조(Pending State) 보장성 테스트"
labels: 'test, e2e, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-027] SI 파트너 회원가입(`FC-002`) 어드민 승인 통제력 증명
- 목적: SI 파트너가 무단으로 가입하자마자 플랫폼 검색 리스트에 뜨는 대참사를 막기 위해, 가입 직후 초기 상태가 단단히 잠겨있는지를 시험한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-002`, `FQ-001` (검색 영향)
- 요구사항: REQ-FUNC-028 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 가입 후 노출 차단 인프라 작동**
  - **Given**: 정상적인 신규 SI 파트너 바디 페이로드.
  - **When**: 가입 트랜잭션이 성공적으로 진행됨.
  - **Then**: 
    1. 데이터는 Insert 성공해야 함.
    2. 하지만, `isActive` 필드는 반드시 `false` (혹은 `pending`) 이어야 한다.
    3. (검색 래퍼 검증) FQ-001 검색 쿼리를 가상으로 쳤을 때, 방금 가입한 이 회사는 절대로 검색 결과 Array 에 등장해서는 안 된다. 

- [ ] **Scenario 2: 프로필 껍데기 선점 보장**
  - **Given**: 위 1번 가입 완료 직후.
  - **When**: 프로필 상세(`FQ-002`) 조회기를 강제로 돌림.
  - **Then**: `SiProfile` 테이블에 빈 내용(Array, 리뷰0건 등)을 가진 연결 레코드가 미리 생겨나 있어서 404 Not Found 에러가 발생하지 않고 "초기 빈 껍데기"로 무사히 조회됨을 확인.
