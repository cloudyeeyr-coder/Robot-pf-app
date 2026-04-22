---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[MOCK] MOCK-001: 3대 마스터(Buyer, SI, MFR) 기초 Seed 스크립트"
labels: 'mock, database, auth, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-001] 플랫폼 3대 핵심 사용자 기초 데이터 Seeding
- 목적: 애플리케이션 초기 개발과 테스트를 원활히 진행하기 위해 수요기업(10건), SI 파트너(20건), 제조사(3건)의 현실적인 샘플 더미(Mock) 데이터를 Prisma Seed에 매핑한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 연관 데이터 모델: `06_SRS-v1.md#6.2.1` ~ `6.2.3`
- 제약사항: `CON-05` 대응 

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `prisma/seed.ts` 파일(혹은 개별 `seedAuth.ts`) 스캐폴딩.
- [ ] **제조사(Manufacturer) 3건 생성**: 예시) "글로벌로보틱스", "대한로봇", "미래자동화".
- [ ] **SI 파트너 20건 생성**: Faker.js 등을 이용해 리얼한 회사명, 연락처, Q1~Q4 규모에 맞는 재무등급(`financialGrade`) 값을 배분하여 생성. (Tier 분배: Silver 12, Gold 5, Diamond 3). 
- [ ] **수요기업(BuyerCompany) 10건 생성**: 식음료, 물류창고, 제조공장 등의 분류(`segment`)에 속하는 기업 10곳.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 데이터 참조 무결성 연결
- Given: Seed 프로세스를 실행하는 환경
- When: `npx prisma db seed`를 실행함
- Then: 이 3가지 엔티티들이 서로 고립된 채(FK 위반 없이) 삽입되고 터미널에 성공 메세지가 출력된다.

Scenario 2: 비밀번호 등의 전처리 규격
- Given: 시스템 상 인증/인가(Auth) 테스트
- When: Auth 도메인에서 해당 Seed 계정으로 로그인을 시도함
- Then: Seed 생성 시 명시적으로 문서화된 공통 비밀번호(예: `password123!`)가 Auth 정책에 맞게 해시화 되어 저장되어 있어 개발자들이 직접 테스트가 가능해야 한다.

## :gear: Technical & Non-Functional Constraints
- 성능: Seeding에 시간이 많이 소요되지 않도록 트랜잭션(`$transaction`) 처리 혹은 최소한의 Bulk Insert(`createMany`) 전략을 사용.

## :checkered_flag: Definition of Done (DoD)
- [ ] Faker 패키지 설정과 함께 TS 기반의 Seed 스크립트 작성이 완료되었는가?
- [ ] DB 도태 방지를 위한 `upsert` 메커니즘이 설계에 깔려있는가?

## :construction: Dependencies & Blockers
- Depends on: #DB-002, #DB-003, #DB-004
- Blocks: #MOCK-ALL (다른 모든 모의 데이터의 뿌리)
