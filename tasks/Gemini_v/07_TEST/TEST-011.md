---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-011: SI 프로필 및 파편화 데이터 종합 렌더링 무결성 검증"
labels: 'test, unit, profile, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-011] SI 프로필 상세(단건) 단일 Fetch 조회 보장성 테스트
- 목적: FQ-002 코드가 여러 테이블(Profile, Badge, Contract 내역 등)에 흩어진 정보를 하나의 JSON 객체로 가져올 때, 구조적 결함 없이 프론트에 던질 수 있는지 객체 검증을 수행.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FQ-002`
- 요구사항: REQ-FUNC-009 AC

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 데이터 무결성 병합 구성 확인**
  - **Given**: SI 업체 A가 1개의 리뷰와 2개의 활성 뱃지(제조사 X, Y)를 지닌 Mock Database 환경.
  - **When**: 상세 조회 FQ 함수를 타겟 `siPartnerId` 로 호출.
  - **Then**: 반환된 객체의 `capabilities`, `badges`, `reviewSummary` 속성에 `undefined` 가 발생하지 않고, 정확히 2개의 뱃지 정보와 1개의 리뷰 배열이 채워져 있어야 한다.

- [ ] **Scenario 2: NFR 시간 2초대 보장성 구조 (경량성 체킹)**
  - **Given**: 수 천건의 Proposal 이력을 지닌 비대한 SI 파트너 덩어리.
  - **When**: 쿼리 호출.
  - **Then**: 쿼리의 `select` 나 `include` 문법이 "전체 제안 내역" 등을 무식하게 불러오지 않고, 오직 "진행된 총 합계(Count)" 만을 최적화로 불러와 메모리 오버플로우가 나지 않음을 입증해야 한다 (Type Return Size 검사).

## :gear: Technical Constraint
- Prisma Mocking: `findUnique` 에 대한 `include` 체이닝 반환값을 수동 객체로 설정하여, 해당 메서드가 반환하는 `Depth 3` 구조를 Zod 스키마 통과기로 붙여서 테스트할 것을 권장.
