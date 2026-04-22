---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[MOCK] MOCK-006: RaaS 계산 마스터 및 견적 리드 폼 Seed"
labels: 'mock, database, raas, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-006] 로봇 모델 마스터 및 수기 견적(Quote) 접수 상태 Seed 구성
- 목적: RaaS 옵션 계산 엔진이 가격을 산출할 '로봇 기본 단위' 풀과, 시스템/어드민 대시보드에서 조회될 견적 요청 문의 리스트를 마련합니다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 연관 데이터 모델: `06_SRS-v1.md#6.2.11`
- 기능 요건 연계: `REQ-FUNC-018` (RaaS 계산 베이스)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 앞서 생성된 3개 제조사에 분배하여 **단가 마스터(RobotModel) 10건** 구성
  - 예시: `RBT-101(단가 4,000만원)`, `SRV-200(단가 1,500만원)` 등 금액대를 다변화(Heavy, Light)하여 세팅.
- [ ] 사용자 문의 화면/어드민 관리 화면 구축용 **수기 견적 요청(QuoteLead) 5건** 적재.
  - 진행상태 믹스: `pending`(2), `in_progress`(1), `responded`(1), `closed`(1) 

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 모델 선택 풀
- Given: RaaS 비교 계산기 메인 폼 (UI-010)
- When: 사용자가 로봇 모델 선택 드롭다운(Dropdown)을 클릭함
- Then: 이 마스터 데이터가 제공되므로, 10개의 모델 리스트가 렌더링되고 가격 계산 컴포넌트로 코드를 매핑시킬 수 있다.

Scenario 2: 대시보드 응답 데이터 지원
- Given: Admin 대시보드 내 "수기 견적 견적" 메뉴
- When: `responded` 상태의 견적이 클릭됨
- Then: 작성 시 할당해 둔 JSON 덤프 데이터(`responseData`)가 표출되어, 관리자가 이전에 넘겨준 임시 견적 파라미터가 어떻게 표시되는지 프론트 단에서 그릴 수 있다.

## :gear: Technical & Non-Functional Constraints
- 제약/옵션: 마스터 데이터의 `modelCode` 는 검색 쿼리에서 타겟이 되므로 알아보기 쉬운 하드코딩된 약어 형태("AMR-01" 등)를 띌 것을 권장.

## :checkered_flag: Definition of Done (DoD)
- [ ] 10개의 가격 모델이 이질성(다양한 금액)을 갖고 형성되었는가?
- [ ] JSON 필드 입력 시 타입 검증 우회가 깔끔하게 이루어졌는가?

## :construction: Dependencies & Blockers
- Depends on: #MOCK-001, #DB-012, #DB-016
- Blocks: #FC-020, #FQ-008, #UI-010
