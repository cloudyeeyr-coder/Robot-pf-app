---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-015: 무결성 100% SI 필터(hasBadge) 탐색 보장성 테스트"
labels: 'test, unit, search, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-015] 미인증 SI 혼입 배제 필터(`hasBadge=true`) 신뢰 쿼리 테스트
- 목적: 고객이 "검증된 시공사만 볼래요" 라고 요청했을 때(FQ-003), 단 1%의 미인증 기회주의자나 과거 인증이 만료돈 폐급 업체가 검색망에 노출되지 않도록 DB 쿼리의 밀봉도를 시험.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FQ-003`, `FQ-001`
- 요구사항: REQ-FUNC-015 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 혼입률 0% 원천 차단 확인 (The Gatekeeper)**
  - **Given**: 
    1. 활성 뱃지를 가진 SI (A)
    2. 뱃지를 받은 적도 없는 SI (B)
    3. 과거 뱃지가 있었으나 `isActive=false` 로 만료된 SI (C)
  - **When**: 검색 쿼리에서 `onlyHasBadge: true` 옵션을 켜서 모킹 DB를 Fetch함.
  - **Then**: 반환된 Query Result Array에는 오직 'A' 만이 존재해야 하며, 뱃지 유무 여부 뿐만 아니라 뱃지 내부 참조 테이블의 `isActive === true` 와 `expiresAt > Date.now()` 조건이 AND 연산으로 한 치의 오차 없이 먹혀 들었음을 강제 증명.

## :gear: Technical Constraint
- 엣지 케이스: Prisma의 `some` 필터 등을 중첩하여 쓸 때 자칫 "이전에 철회된 뱃지" 1장과 "새로 발급된 뱃지" 1장이 공존하는 경우(A)도 잘 커버하는지 복합 상태 조건문을 넣어서 커버리지 루프를 돌릴 것.
