---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-014: 뱃지 소멸 메커니즘 (CRON & 무효화) 동시성 증명 테스트"
labels: 'test, unit, badge, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-014] 뱃지 자동 비활성화(`CRON-003`) 및 수기 철회(`FC-017`) 테스트
- 목적: 기한 만료나 제조사 직접 액션으로 신뢰 정보가 파괴되었을 경우, 해당 SI의 노출 지수가 즉각적으로 소프트 딜리트(Soft Delete) 됨을 확인.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-017` (수동 철회), `CRON-003` (만료 배치)
- 요구사항: REQ-FUNC-014 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 수기 철회 시 기록 보존 및 캐시 클리어**
  - **Given**: 활성 뱃지가 존재하는 제조사의 호출 상황.
  - **When**: `revokeBadge` 를 타격.
  - **Then**: DB 튜플이 `delete` 되는 것이 아니라, `isActive: false` 와 `revokedAt` 필드 갱신으로 상태만 바뀌었는지 증명 (Audit 원칙 준수). 나아가 검색망 즉각 비노출을 위한 캐시 타격 여부 확인.

- [ ] **Scenario 2: 타임머신을 이용한 만료 크론 가동**
  - **Given**: `expiresAt` 이 10초 전 지났다고 세팅 설정한 가상 DB 스냅샷.
  - **When**: `CRON-003` 핸들러 주입.
  - **Then**: 쿼리에 의해 대상 건들이 일제히 `false` 처리되었음을 Prisma 반환 값 (count) 등으로 체크하며 방어.
