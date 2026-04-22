---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-002: Admin 입금 확인(updateEscrowStatus) 상태 및 권한 락 테스트"
labels: 'test, unit, auth, escrow, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-002] Admin 수기 입금 확인 파이프라인 방어막 검증
- 목적: 에스크로의 `pending` 상태를 `held` 로 돌려버리는 FC-006 의 로직에 구멍이 없는지, 특히 권한(Authorization)을 중심으로 파괴 테스트 수행.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-006`, `FC-004`(MFA 체계)
- 시나리오: REQ-FUNC-001 AC 문서 대응

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 정상 상태 전이 검증**
  - **Given**: MFA를 통과한 정상 Admin 세션 객체. 상태가 `pending` 인 임의 계약.
  - **When**: 입금 버튼 액션(`updateEscrowStatus`)을 때림.
  - **Then**: 대상 트랜잭션의 상태가 `held` 로 전이되며, `admin_verified_at` 값에 시간 스탬프가 찍힌다.

- [ ] **Scenario 2: 권한 도용 방어 (Access Denial)**
  - **Given**: `buyer` 이거나 MFA를 달성하지 못한 미통과 `admin` 아이디.
  - **When**: 위 액션을 동일하게 치고 들어옴.
  - **Then**: 상태는 절대 변하지 않으며 시스템은 즉각 403 / 권한 없음 에러 트랩을 발생시켜야 함.

- [ ] **Scenario 3: 없는 계약 타겟팅 방어**
  - **Given**: Admin 계정이 임의의 UUID `9999-9999...` 를 넣어 상태 변경을 시도.
  - **When**: 쿼리 가동됨.
  - **Then**: 404 에러로 정상 튕겨져 나오는지 확인.

## :gear: Technical Constraint
- 보안 초점: 권한 방어나 MFA 데코레이터가 작동하는가에 대한 Controller 단의 Guard 로직에 테스트 스파이포인트를 깊숙히 맞출 것.
