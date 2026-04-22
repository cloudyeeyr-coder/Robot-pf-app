---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-006: 에스크로 상태 변경 오류율 감지 데몬"
labels: 'backend, cron, monitoring, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-006] 에스크로 상태 전이 오류 임계치 스캐너
- 목적: 플랫폼 금융 심장인 에스크로 트랜잭션 도중 400/500 에러 비율이 "연속 5분간 0.5% 초과" 할 경우 엔지니어 시스템(Slack Webhook)으로 비상 사이렌을 울리는 모니터링 배치.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-033` (비용/오류율 NFR)
- 연계 스펙: API-026 (Slack 모듈)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Vercel Cron 에 `*/5 * * * *` (5분마다) 엔드포인트 세팅 (`/api/cron/monitor-escrow`).
- [ ] DB 집계(또는 로그 분석기 등): 
  - 최근 5분 이내 `EventLog` 테이블 중 `type === 'escrow_error'` 건 수(결함)와 정상 에스크로 `type === 'escrow_success'` 건 수 추출.
  - 연산: `(에러 건 / (정상+에러 전체 모수)) * 100` (%)
- [ ] 임계치 확인: 만약 실패 비율 > 0.5% 라면 API-026(Slack) 에 Payload를 담아 핫라인 송출. 

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 임계치 알람 발동
- Given: 모의 로그 DB에 최근 5분간 총 1,000건의 통신 중 6건(0.6%)이 에러 리포트 됨
- When: 5분 주기로 도는 이 크론 워커가 스윕을 시작함
- Then: 0.5%의 허들을 넘었으므로 조용히 끝나지 않고 어드민 슬랙 채널에 [비상] 말머리와 함께 오류 로깅을 쏴서 장애 확산을 1차 예방한다.

## :gear: Technical & Non-Functional Constraints
- 제약/구조: DB(EventLog)를 직접 치게 되면 부하가 크므로, Sentry 연동이 되어 있다면 Sentry의 자체 Alert 규칙 설정(대시보드 NFR)으로 이 태스크를 대체하는 것을 우선 권장한다. (팀과 상의 요망). DB로 구현하려면 쿼리에 Index를 촘촘히 잡을 것.

## :checkered_flag: Definition of Done (DoD)
- [ ] 5분 단위 크론이 설정되었는가?
- [ ] (Sentry 대체 혹은 DB 연산 기반) 임계치 계산식이 구현되어 작동하는가?

## :construction: Dependencies & Blockers
- Depends on: #API-026, #FC-006 (에스크로 로직 에러 로깅 주체)
- Blocks: None
