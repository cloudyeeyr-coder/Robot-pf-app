---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-032: 프론트엔드 LCP 퍼포먼스 저하 한계선 알람망 인프라 테스트"
labels: 'test, e2e, monitoring, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-032] 페이지 첫 페인트(LCP > 3초) 지연 사거리 진입 시 Slack 보고(`CRON-009`) 가동 증명
- 목적: Web Vitals 메트릭을 수집한 결과, 사용자들이 화면(대시보드)을 보는 데 3초 이상 끊김을 겪고 있다면 이 NFR 침해를 개발팀에 무사히 쏘아 올리는지 검증.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `CRON-009` (수집기)
- 요구사항: REQ-FUNC-036 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: LCP 수집기 Endpoint 작동**
  - **Given**: 클라이언트(브라우저)에서 `web-vitals` 라이브러리를 통해 추출한 패킷, 값은 `LCP = 3500`.
  - **When**: 시스템 로거 API Endpoint 인 `/api/metrics` 에 Body 발송.
  - **Then**: 200 OK 를 뱉으며 서버 메모리나 캐시(Log DB)에 무사히 인입되었음을 증명.

- [ ] **Scenario 2: 연속 침해 판단 및 Alert**
  - **Given**: 위 와 같은 패킷이 전체의 5% 를 상회하여 접수된 모킹 로그 뱅크.
  - **When**: 크론 모듈 순회
  - **Then**: Slack 모듈이 "LCP 저하 주의보" 핑을 1회 이상 발송함 확인.
