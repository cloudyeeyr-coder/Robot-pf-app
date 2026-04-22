---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-009: 플랫폼 프론트엔드 LCP 페이지 렌더링 저하 감시 데몬"
labels: 'backend, cron, monitoring, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-009] 프론트엔드 LCP(Largest Contentful Paint) 퍼포먼스 NFR 감시기
- 목적: 사용자 경험의 핵심 척도인 LCP 웹 바이탈 점수가 연속 1시간 동안 3초를 초과하여, "플랫폼이 너무 무겁다"는 피드백이 오기 전에 개발팀에 비상을 알리는 데몬.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-036` (LCP NFR 모니터링 요건)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] (권고) Vercel Speed Insights 와 같은 외부 도구를 활성화하고 대시보드 알럿(Alert) 규칙으로 세팅.
- [ ] (커스텀 코드 필요 시) 클라이언트 단에서 `web-vitals` 라이브러리를 통해 LCP 메트릭을 /api/metrics 수집기 엔드포인트로 전송한다고 가정:
  - 1시간 주기의 크론 `/api/cron/monitor-lcp` 스캐너 동작.
  - 전송된 메트릭 평균 및 p95 집계 연산.
  - 3,000ms 초과 시 Slack(API-026) 전송.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 외부 도구/APM 설정의 유효성 (비기능 테스트)
- Given: Vercel 설정 대시보드
- When: LCP > 3000ms 인 상황을 모킹시킴
- Then: Vercel Webhook 에 의해 이 프로젝트의 Slack 인테그레이션 채널에 Alert 이 봇으로 날아와야 정상 처리된 것으로 본다 (직접 코딩하지 않는 클라우드 네이티브의 승리).

## :gear: Technical & Non-Functional Constraints
- 방향성 고려: CRON-008과 마찬가지로 Next.js 구조 하에서 개발자가 Core Web Vitals 연산을 직접 백엔드 크론으로 짜는 것은 오버엔지니어링(바퀴의 재발명)입니다. 문서 요건은 충족하되, 시스템 구현은 Vercel Speed Insights 연동(클릭 수 회 만에 완료)으로 갈음하는 것을 강력히 지지합니다.

## :checkered_flag: Definition of Done (DoD)
- [ ] LCP 수집 구조를 구축하거나, Vercel Insights 플랫폼의 알럿 파이프라인 연계 도큐먼트를 남겼는가?
