---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[MOCK] MOCK-007: Phase 2 O2O 방문 예약 및 매니저 슬롯 Seed"
labels: 'mock, database, o2o, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-007] O2O 매니저 방문 예약 Seed (Phase 2 대비)
- 목적: Phase 2 의 메인 팩터인 캘린더 예약 UI 개발(UI-012)을 위해 비어/차 있는 슬롯의 묘사와 기(旣)종료된 방문 보고 스크립트를 작성한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 연관 데이터 모델: `06_SRS-v1.md#6.2.9`
- 관련 요구사항: `REQ-FUNC-023~026` 

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `O2OBooking` 레코드 총 5건 생성
  - 1단계: 향후 1주일 이내로 배정된 `pending` 혹은 `confirmed` 예약 건 3개 (예약 불가 표시용).
  - 2단계: 과거 일자로 `completed` 취급되는 예약 2건.
- [ ] `completed` 인 예약건에는 시뮬레이션용 방문 보고서(`reportContent` JSON) 탑재: (예: `{ "summary": "라인 실측 결과 훌륭함", "recommendedSiIds": ["uuid-1"] }`)

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 예약 막힘 UI 시각화 
- Given: O2O 캘린더 페이지 (UI-012)
- When: Seed 를 마친 뒤 날짜를 쿼리함
- Then: 이 Data 세트가 삽입된 특정 날짜/시간대는 회색 처리 혹은 Block 되어 예약(`createO2oBooking`)이 불가함을 클라이언트가 인지할 수 있도록 응답해야 한다.

Scenario 2: 리포트 조회
- Given: O2O 완료 현황판
- When: 어드민이 완료된 O2O 리포트를 클릭함
- Then: Json 화 되어있는 `reportContent`가 에러 없이 화면의 각 섹션(상담 요약 / 추천 ID)으로 뿌려진다.

## :gear: Technical & Non-Functional Constraints
- 구조 제약: 이 스크립트 작성 파일은 Phase 2 스펙이라는 특수성을 감안해, 다른 필수 Seed(`seedAuth`, `seedEscrow` 등) 파이프라인에서 분리하여 `seedO2O.ts` 단독 파일로 빼두는 것이 Phase 1 Prod 배포 시 안전할 수 있음.

## :checkered_flag: Definition of Done (DoD)
- [ ] 미래 시간대 스케줄과 과거 보고 완료 스케줄이 모두 포함되어 있는가?
- [ ] Phase 1 빌드 타임에 터지지 않도록 타겟 격리가 되어 있는가?

## :construction: Dependencies & Blockers
- Depends on: #MOCK-001, #DB-010
- Blocks: #FQ-011, #UI-012
