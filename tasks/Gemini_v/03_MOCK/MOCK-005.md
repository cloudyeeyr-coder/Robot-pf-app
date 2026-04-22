---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[MOCK] MOCK-005: AS 엔지니어, 티켓 보증서 운영망 Seed 데이터 생성"
labels: 'mock, database, as, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-005] AS망 운용 테스트용 Prisma Seed 구성
- 목적: AS 티켓의 모니터링 기능(SLA 지연, 배정 등)과 보증서 발급 UI 컴포넌트를 테스트하기 위한 초기 단계의 엔지니어 풀, 티켓 상태 분배, 발급된 보증서 객체를 마련한다.

## :link: References (Spec & Context)
> :bulb: AI 기여자 Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 연관 데이터 모델: `06_SRS-v1.md#6.2.6` (AS 티켓), `6.2.10` (보증서)
- 기능 요건 연계: `REQ-FUNC-008` (SLA 기준)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 기초 데이터 풀 구성: AS 담당 `Engineer` 레코드 8명(`region` 값을 수도권/비수도권으로 배분) 
- [ ] 방출(`released`) 상태인 MOCK-002 계약을 기준으로 삼아 **보증서(`Warranty`) 5건** 발급 생성 (URL은 Dummy 체결).
- [ ] 단계별 **AS 티켓 10건** 구성
  - 상태 배분: 3건 접수(`reported`), 3건 배정중(`assigned`), 4건 완료(`resolved`)
  - SLA 상황: 완료된 4건 중 1건은 고의적으로 `slaMet = false` 타임스탬프(`>= 24시간`)로 조작하여 실패 케이스(대시보드 적색등) 뷰 생성에 활용.
  - 긴급도 배분: `urgent` 2건, `normal` 8건.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: SLA 미충족 데이터 확인
- Given: 모니터링 관제 대시보드(UI-008 등)
- When: Seed가 생성된 상태에서 AS 처리 현황을 쿼리(FQ-010)함
- Then: 이 스크립트가 세팅한 `slaMet = false` 건이 명확히 쿼리에 잡혀, 팀 내 경고등(Alert) 컴포넌트가 퍼블리싱 상태부터 잘 보이도록 동작한다.

Scenario 2: 배정 알고리즘 작동 기초
- Given: 서버가 엔지니어 자동 배정을 시도함
- When: 특정 `ticketId`를 기준으로 지역 일치/가용성 검색을 걸음
- Then: 8명의 엔지니어 풀이 다양한 `region`과 `isAvailable` 값들로 Seed에 흩어져 있어 단일 매칭(혹은 매칭 불가) 시나리오 모두 테스트가 가능해야 한다.

## :gear: Technical & Non-Functional Constraints
- 성능/유연성: 각 티켓과 `Contract`가 외래키로 견고히 연결되어야 하며, 티켓이 없는 계정이나 티켓이 많은 계정 등 UI 단의 엣지 엣지케이스(비대칭성)를 감안한 배분을 권장.

## :checkered_flag: Definition of Done (DoD)
- [ ] 8명/5건/10건의 더미 엔티티들이 정상적으로 파일 안에서 `create` 쿼리를 거치게 되는가?
- [ ] Seed 파일 작성 후 `npx prisma db seed` 정상 수행.

## :construction: Dependencies & Blockers
- Depends on: #MOCK-002, #DB-007, #DB-011, #DB-017
- Blocks: #FQ-005, #FQ-010, #UI-007
