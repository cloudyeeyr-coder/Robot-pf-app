---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-021: [RaaS] 미존재 로봇 모델 백업 및 예외 처리 검증"
labels: 'test, unit, raas, exception, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-021] RaaS 계산기 입력(예외) 유효성 보장 및 딥스위치(Fallback) 증명
- 목적: 고객이 DB에 명시되지 않은 로봇 모델명이나 쓰레기 값(수량 0)을 입력 시 시스템이 터지는게 아니라, 안전한 400에러와 대안(유사) 로봇 3종 추천 로직(FC-028)으로 무사히 착륙하는가를 체크.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-020` (RaaS 엔진), `FC-028` (대안 추천 모델)
- 요구사항: REQ-FUNC-021 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 미존재 모델명 우회 탑승 제어(Fallback)**
  - **Given**: 모델 마스터 DB에 없는 문자열 'UNKNOWN-RBT' 과 정상 수량이 담긴 Body Payload.
  - **When**: RaaS 계산 함수/엔드포인트 호출
  - **Then**: 500 인터널 에러가 나면 안된다! 대신 `MODEL_NOT_FOUND` 스태이터스 코드와 함께, 백엔드 내부 연계를 타고 온 `suggestedModels` 객체 배열(유사 모델 3개 파싱 데이터)이 Body 응답에 동봉 되어있음을 검증.

- [ ] **Scenario 2: 숫자 오인 및 0원 곱셈 방어**
  - **Given**: `quantity: 0` 혹의 `months: -12` 의 수동 조작 렌탈 파라미터.
  - **When**: 시스템에 꽂음
  - **Then**: 계산식 도입 전에 Zod나 Type Check 레이어에서 블락킹을 시도, '유효하지 않은 수량' 메시지를 응답할 것.
