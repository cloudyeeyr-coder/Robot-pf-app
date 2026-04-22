---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-007: AS 티켓 24시간 미배정 건 색출 및 옵스팀 알림 배치"
labels: 'backend, cron, as, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-007] 장기 미배정(24H+) AS 티켓 핫라인 보고
- 목적: AS 티켓이 접수되었는데 운영팀이 하루가 꼬박 넘도록 엔지니어 배정 조차 하지 않는 방치 건수(블랙홀 건)를 찾아내어 담당부서의 슬랙에 핑을 때리는 감사(Audit) 배치.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-034` (티켓 배정 지연 알림)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 스케줄: 1시간 또는 하루 1번 도는 Cron.
- [ ] Target 조회: `AsTicket` 데이터 중 상태가 `reported` (미배정) 이면서, `reportedAt` 기준 24시간을 경과한 레코드 색출.
- [ ] Slack Webhook 조립:
  - 추출된 건수를 카운팅하고, 티켓 ID 배열을 메시지 스펙에 정리 ("현재 배정되지 않은 티켓이 3건 있습니다: #T1, #T2, #T3").
- [ ] API-026 실행 및 종료.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 감사용 미배정 건 필터
- Given: 미배정 23.5시간 째인 티켓 1건과 미배정 40시간 째인 티켓 1건
- When: 어드민이 수동(혹은 크론)으로 모니터링 배치를 실행함
- Then: 이 로직은 단호하게 24시간의 Threshold를 잣대로 40시간짜리 티켓 1건만 뽑아내어 운영팀에 Slack 경고를 쏜다.

## :gear: Technical & Non-Functional Constraints
- 구조/명세: 이 배치는 알림만 쏘는게 목적이므로, 배치를 돌렸다는 이력 필드(예: `warnedAt`)를 티켓 DB에 파두지 않으면 매 시간마다 중복 알림이 갈 수 있으니, "알림 완료 마커" 전략을 사용하는 게 좋다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 24시간 필터 쿼리가 정상 설계 되었는가?
- [ ] 중복 알람을 방지하는 마킹(Mark) 시스템이 제안/추가되었는가?

## :construction: Dependencies & Blockers
- Depends on: #API-026, #FC-011
- Blocks: None
