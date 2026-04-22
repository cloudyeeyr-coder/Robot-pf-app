---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-004: 파트너 제안 중간 기한 리마인더 (D+3)"
labels: 'backend, cron, partnership, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-004] 파트너 제안 D+3일 초과 리마인더 스크립트
- 목적: 제조사가 협력 제안을 날렸으나, SI가 읽지 않거나 답을 안 줄 경우 마냥 5일 만료를 기다리기 전에 한번 더 문을 두드려 주는 핑 스크립트.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-032` (리마인더 요건)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Vercel Cron 엔드포인트 셋핑.
- [ ] Target 조회: `PartnerProposal` 의 `status === 'pending'` 이고, `createdAt` 기준 3일이 지났으나 `deadline` 5일보다는 덜 지난 데이터.
- [ ] 단순 Action: 해당 제안에 종속된 SI 연락처로 `카카오 알림톡/Email` ("제안 응답 기한이 2일 남았습니다") 쏘기.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 리마인더 누락 방지망 스캔
- Given: 제안서(Proposal)가 3.5일 전에 만들어져 배회 중임
- When: 시스템 배치가 도킹함
- Then: DB를 변질시키지 않고 이 친구들에게 정확한 Reminder API 핑거프린트만 남긴 채 성공 종료된다.

## :gear: Technical & Non-Functional Constraints
- 성능 검토: 이 워커도 과발송(Spam) 이슈 방어를 위해 `PartnerProposal` 내부에 `reminderSent: boolean` 필드를 스캔 후 `true`로 덮어쓰거나, 캐시 등에 표기해 중복 방어를 권장함.

## :checkered_flag: Definition of Done (DoD)
- [ ] 알림 발송 후 어딘가 Marking 처리 메커니즘을 남겼는가?
- [ ] 쿼리 타겟팅(D+3 일치 여부) 정확성

## :construction: Dependencies & Blockers
- Depends on: #FC-018, #FC-023
- Blocks: #CRON-005
