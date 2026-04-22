---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-020: 견적 요청 리드(QuoteLead) 적재 및 통보 동기화 테스트"
labels: 'test, unit, quote, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-020] 수기 견적 요청(`FC-022`) DB CUD 및 알림 트리거 단위 검증
- 목적: 수요회사가 시스템에 견적 계산만 한 게 아니라 폼에 번호를 적어 "상담해주세요!" 하고 날린 소중한 영업 리드가 DB에 꽂힘과 동시에 관리자 슬랙에 안전하게 전송되는지 체인 테스트.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-022`
- 요구사항: REQ-FUNC-020 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 순차적 데이터 저장 및 응답**
  - **Given**: 모델 정보와 회사 번호가 기재된 정상 견적 폼(Body).
  - **When**: 핸들러(Action) 를 쏨.
  - **Then**: `QuoteLead` 데이블에 `status: 'pending'` 으로 레코드가 생성되어야 하고 클라이언트에겐 "요청 완료 200 OK" 가 즉각 반환된다.

- [ ] **Scenario 2: 비동기 Admin 후방 노티발송 스레드 유지**
  - **Given**: 위 SC 1 종료 후,
  - **When**: 백그라운드 이벤트 망이나 Spy 객체가 살아있는지 점검.
  - **Then**: 메인 스레드가 사용자에게 응답을 종료했다고 알림이 죽지 않으며, 알람 모듈(`API-025` Slack 핑)이 비동기적으로 Call 되었음(`sendNotification`)을 확약한다.

## :gear: Technical Constraint
- 아키텍처: 이 패턴은 `Next.js App Router` 의 `waitUntil` 이나 서버 액션 상의 `Promise.catch` 동시성 패턴을 활용해본 적이 있는가를 증명하는 로직이므로, 모킹 구조를 주의하여 세팅하시오.
