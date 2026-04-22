---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-002: 뱃지 만료 도래 D-7 사전 알람 스크립트"
labels: 'backend, cron, badge, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-002] 뱃지 권한 만료 D-7 감지 및 안내 발송
- 목적: SI 파트너가 뱃지를 잃기 전에 연장이나 대응을 논의할 수 있도록 7일 전(D-7) 도래 건들을 스캔하여 이메일 등 다채널로 예고장을 보내는 상냥한(!) 배치 워커.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-016` (만료 예고 배치)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Vercel Cron 엔드포인트 세팅 (`/api/cron/badge-warn`).
- [ ] Date 연산 타겟 범위: `isActive: true` 이며 `expiresAt` 이 언제인지 확인. ( `NOW + 7일` ~ `NOW + 8일` 사이 도달 대상 파악, 쿼리 락 유의 )
- [ ] 적발 대상 식별 후 해당 `Badge.siPartnerId` 의 연락처(Contact / Email) 정보 수집.
- [ ] API-025 알림 모듈을 콜하여 `"보유하신 [제조사명] 인증 뱃지가 7일 후 만료됩니다"` 시스템 메시지 Push.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 과발송(Spam) 및 연산 락커 방어
- Given: 이 배치가 하루에 1번 도는 스케줄
- When: 어제 알림을 받은 건이, 오늘 또 1시간 빗겨난 오차 범위에 검색되어 걸림
- Then: 배치는 이를 방어하기 위해 Notification 이력 등을 참조하거나, 정확한 D-7일 Date `>` 범위 캘큘를 수행하여 동일 건에 두 번 이상 보내는 스팸 현상을 막아야 한다.

## :gear: Technical & Non-Functional Constraints
- 성능 검토: 이 배치는 DB 데이터의 상태를 손대진 않으며(Update 안 함) 단지 알림만 쏘는 성격이므로, 매우 가볍게 구동되도록 Prisma `findMany({ select: ... })` 최적화를 필수 적용할 것.

## :checkered_flag: Definition of Done (DoD)
- [ ] Vercel Cron.json 설정 추가.
- [ ] 날짜 타겟팅 조회 및 알람 워커 결합.

## :construction: Dependencies & Blockers
- Depends on: #FC-016, #FC-023
- Blocks: None
