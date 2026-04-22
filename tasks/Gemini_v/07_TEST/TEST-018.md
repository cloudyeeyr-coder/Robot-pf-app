---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-018: RaaS 3방향 비용 비교 알고리즘 순수/무결 테스트"
labels: 'test, unit, raas, compute, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-018] RaaS 연산(`FC-020`) 순수 수학 엔진 도출 검사
- 목적: 핵심 비즈니스 도구인 비용 계산기가 단가와 마진율, 개월 수를 정확히 곱/나누어, 마이너스(-)가 나오거나 0원 버그가 절대 발생하지 않음을 증명하는 테스트.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-020`
- 요구사항: REQ-FUNC-018 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 정상 비용 분기 산출 (양수 값 보장)**
  - **Given**: 대당 `basePrice` 가 1,000만원인 로봇 모델(MOCK). 사용자가 2대, 36개월 렌탈 범위를 입력.
  - **When**: 이 함수를 실행(Compute).
  - **Then**: 
    1. 일시불(Opex) 산출 값이 2,000만원 + 연간 유지비로 합당한가?
    2. 리스 비용이 일시불 대비 이자가 더해져 연산되었는가?
    3. RaaS 플랫폼 요금(구독료 등)이 이와 별도로 매겨졌는가?
    (*결과 객체의 3가지 옵션 금액 속성이 전부 `> 0` 임을 `toBeGreaterThan(0)` 로 증명*).

- [ ] **Scenario 2: 숫자 입력 오염 및 악의적 파라미터 방어**
  - **Given**: 수량(Quantity) 필드에 `0`대, `-5`대, 또는 자바스크립트 버그를 노린 `Infinity` 등의 쓰레기 데이터 유입.
  - **When**: 계산 엔진 가동
  - **Then**: 연산 수행 이전에 Zod나 룰 계층에서 400 Bad Request 에디션으로 쳐내어 무의미한 NaN 결제 렌더링이 되지 않도록 1순위로 막아낸다.

## :gear: Technical Constraint
- 소수점 절사: JS 특유의 `0.1 + 0.2 = 0.300000000004` 오차율이 재무 데이터에 뜨면 대참사이므로, 반환되는 모든 금액(원)이 정수형으로 정확히 반올림/절사 처리 되었는지 `.toBe(Integer)` 레벨의 자료형 단속 포함 요망.
