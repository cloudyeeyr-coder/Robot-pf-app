---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-028: 복합 파트너(SI) 탐색 렌더링 퍼포먼스 NFR 검수"
labels: 'test, e2e, search, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-028] SI 검색 종합 필터링(`FQ-001`) 최적화 단위 테스트
- 목적: 수요기업이 3개 이상의 필터(지역+역량+뱃지)를 묶어서 검색할 때 쿼리 교착상태 없이 정확한 교집합이 떨어지고, 1초 안에 데이터가 반환되는지 확인.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FQ-001`
- 요구사항: REQ-FUNC-029 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 다중 AND 필터 정확성 (교집합 보장)**
  - **Given**: 수십건의 MOCK 데이터 내 위치. 지역(수도권), 브랜드(현대), 태그(용접) 세 가지를 파라미터로 조립함.
  - **When**: 검색 쿼리를 호출함
  - **Then**: 이 3가지 범주에 모두 충족되는 단 하나의 회사만 결과로 반환되어야 함. (OR 연산으로 섞이지 않음을 확실히 증명).

- [ ] **Scenario 2: 1초(NFR) 제한 및 빈 데이터 방어 뷰**
  - **Given**: 위 1번 검색 실행 시간 모니터링 환경 세팅. 혹은 아무도 없는 기괴한 조건 세팅.
  - **When**: 쿼리 슛.
  - **Then**: NFR(1,000ms 제한) 위반이 없어야 하며, 결괏값이 비었을 때(0건) 서버 에러가 터지는게 아니라 빈 배열 `[]` 로 부드럽게 반환해 주어 프론트에서 랜더링할 여지를 주는지 방어.
