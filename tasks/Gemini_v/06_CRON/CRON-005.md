---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-005: 5일 초과 무응답 제안서 폭파 및 대안 추천 워커 기동"
labels: 'backend, cron, partnership, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-005] 파트너 제안 만료 처리 및 제조사용 대안 추천 파이프라인
- 목적: 기한(`deadline`)이 오버되었음에도 SI 측 응답이 없는 죽은 제안을 회수(`expired`)하고, 기다리던 제조사를 돕기 위해 타 3개 우수 회사를 엮어서 자동 알림 발송하는 고도화형 워커.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-032`
- 연관 쿼리: FQ-001 (파트너 검색)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Vercel Cron 엔드포인트 세팅.
- [ ] `PartnerProposal` 중 `status === 'pending'` 및 `Date.now() > deadline` 인 항목 추출.
- [ ] 트랜잭션 1: 스캔된 대상의 상태를 일괄 `expired` 로 전환.
- [ ] 트랜잭션 파생(비동기): 추출된 각 제조사별로, "응답이 종료되었습니다" 라는 알림과 함께 백엔드 내부의 검색 기능(FQ-001 유틸판)을 때려 "지역 및 역량이 비슷한 타 SI 업체 3건" (대안) 리스트(제안)를 추출.
- [ ] 위 조합 데이터(알림 메시지 + 3개 업체 ID 링크)를 제조사에게 푸시알림 발송.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 대체 추천 연계 파이프 성능
- Given: 제조사 A의 파트너십 제안이 기한(5일)을 초과함
- When: 이 CRON 스크립트가 타겟을 확보하여 `expired` 로 닫은 뒤
- Then: 1분 이내에(NFR) FQ-001 계열 쿼리를 연동 구동하여, 애초에 거절했던 업체와 지역/기술 태그가 가장 근접한 3곳을 AI 또는 SQL 연산해 낸 뒤 제조사에 알림을 내려다 주어야 한다.

## :gear: Technical & Non-Functional Constraints
- 구조 제약: CRON 호출 안에서 너무 많은 쿼리 연산(대안 추천 쿼리를 건 당 1개 돌릴 경우 루프 N 스파이크 위험)이 생기지 않도록, 파이프라인을 두 단계(만료 처리 Batch -> 큐에서 대안 찾기 Batch)로 쪼개는 MQ 패턴(큐 연계)을 고려할 것을 백엔드 개발자에게 명세.

## :checkered_flag: Definition of Done (DoD)
- [ ] 상태 전이가 `expired` 로 정상 동작하는가?
- [ ] 대안 3개 사 추출 로직이 타임아웃을 유발하지 않도록 맵핑되었는가?

## :construction: Dependencies & Blockers
- Depends on: #CRON-004, #FQ-001
- Blocks: None
