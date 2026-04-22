---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-031: RaaS 연산기 백엔드 병목(NFR 위반) 경고 발송 가동 테스트"
labels: 'test, unit, monitoring, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-031] RaaS 연산 지연시간(p95 > 3초) Slack 보고(`CRON-008`) 인프라 검증
- 목적: 계산기 엔진이 트래픽 한방에 맛이 가기 전에, DB를 통해 분석된 통곗값이 3,000ms 허들을 넘었을 때 엔지니어 그룹을 비상 소집하는 배치의 신뢰도 점검.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `CRON-008` (APM 또는 스크립트)
- 요구사항: REQ-FUNC-035 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: p95 연산 백본 및 알람 점검 (Custom Code 모드일 시)**
  - **Given**: 지난 10분간의 로그 테이블에, 연산 시간이 [400ms, 450ms, 500ms, ..., **4000ms**] 형태로 찍혀있어 상위 95백분위수 커트라인이 3,000ms 를 웃도는 상황 모킹.
  - **When**: 커스텀 크론 배치가 돌아감.
  - **Then**: 통계 연산 로직이 정상 작동하여 허들 초과를 감지, `sendSlackMessage` Spy 모듈이 비상문구 템플릿을 들고 호출 완료되었음을 확인.

- [ ] **Scenario 2: APM 인프라 위임(Delegation) 확인**
  - **Given**: APM (Sentry / Datadog / Vercel Webhook) 연동이 결정됨.
  - **When**: 코드 리뷰 및 도큐먼트 검열
  - **Then**: 로컬에서 Jest 돌릴 필요 없이, Infrastructure as Code (e.g. Terraform 등) 상에 3초 NFR 위반 웹훅 연결이 명세되었는지를 CI 스크립트로 점검하거나 생략.
