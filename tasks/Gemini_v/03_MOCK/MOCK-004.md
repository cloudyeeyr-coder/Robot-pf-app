---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[MOCK] MOCK-004: SI 프로필 및 역량/리뷰 View용 Seed"
labels: 'mock, database, profile, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-004] SI 프로필(`SI_PROFILE`) 상세 뷰를 위한 JSON 모의 데이터 Seeding
- 목적: 파트너 검색 화면 및 프로필 조회, PDF 렌더러 개발 시 사용할 복합 역량 태그와 별점/리뷰가 담긴 20건의 프로필을 구성한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 연관 데이터 모델: `06_SRS-v1.md#6.2.8`

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] MOCK-001 로 만들어진 SI 파트너 20개의 UUID 확보 구조 선언.
- [ ] `capabilityTags` 배열 생성을 위해 무작위(혹은 체계적 배분) 역량 문자열 풀(`["용접", "조립", "도장", "식음료", "이송"]`) 생성 및 인서트.
- [ ] `reviewSummary` 를 위한 JSON 모형 더미 설계: 예) `{ "rating": 4.5, "comments": "빠르고 정확합니다" }`.
- [ ] 프로젝트 카운터(`totalProjectsCompleted`) 등 통계용 메타 데이터 배분 (가장 많은 곳은 50건 이상, 적은 곳은 0건).

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 검색 필터 조건 보장
- Given: "용접" 스킬을 가진 업체를 찾는 필터 쿼리(FQ-001)
- When: DB 검색을 수행
- Then: 이 Seed 셋이 제공한 역량 배열 중 "용접" 태그를 가진 3~4개의 타겟 레코드가 존재하여 프론트엔드가 빈 배열(Empty Result)만을 마주하지 않도록 한다.

Scenario 2: JSON 캐스팅 호환성 
- Given: Next.js Server Component 측
- When: 렌더링을 위해 `SiProfile` 의 JSON을 꺼냄
- Then: 내부 스크립트 작성 시 타입 안전성을 지닌 `Prisma.InputJsonObject` 캐스팅 기반으로 Seed 가 들어가 있어, 서버가 역직렬화 할 때 파싱 오류를 내지 않는다.

## :gear: Technical & Non-Functional Constraints
- 구조/명세: SQLite 배포의 로컬 테스트 환경을 감안하여 배열 대신 `JSON.stringify` 기반 포장을 Seed 내부에 적용할 지, Prisma Native Array 방식을 쓸지에 맞춰 통일할 것.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 20개의 업체가 고유의 `SiProfile` 레코드를 할당 빋았는가?
- [ ] Seed 파일을 단독으로 돌렸을 때 문제 없이 Upsert 구문이 완료되는가?

## :construction: Dependencies & Blockers
- Depends on: #MOCK-001, #DB-009
- Blocks: #FQ-001, #FQ-002, #UI-003, #UI-004
