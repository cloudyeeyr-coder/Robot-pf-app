---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[CRON] CRON-008: RaaS 연산 모듈 NFR 퍼포먼스 저하 감시 데몬"
labels: 'backend, cron, monitoring, priority:low'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-008] RaaS 연산(FC-020) 응답속도 저하(p95 > 3초) 모니터링 데몬
- 목적: 핵심 고객유치 도구인 RaaS 계산기가 "연속 10분간 3초 초과 렌더링" 이라는 심각한 NFR 침해가 일어났는지를 분석하고 시스템 팀에 알리는 파수꾼.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 요구사항: `06_SRS-v1.md#REQ-FUNC-035` (퍼포먼스 모니터링 NFR 조건)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] (방법 1. APM 연동) Vercel Analytics / Datadog 설정이 되어있을 경우 코드 작성 대신 인프라 세팅으로 갈음함 (강력 추천).
- [ ] (방법 2. 자체 구현 시) `EventLog` 테이블에 RaaS 연산이 시작될 때와 끝난 시간 차이를 `durationMs` 필드에 적어두었다는(메트릭스 수집) 가정 하에:
  - 10분 주기의 Cron 이 DB를 스캔하여 p95 연산(상위 5% 데이터의 수행 속도)을 간이하게 SQL/Prisma 로 계산함.
  - 그것이 3,000ms 보다 크면 API-026 으로 노티.

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: p95 지연 감지 테스트 
- Given: 연산 속도 풀(10건의 쿼리)에서 9건은 500ms였으나 1건이 Vercel 콜드스타트로 인해 4000ms가 걸림.
- When: 워커가 배치 런다운됨
- Then: p95 통계 지표 상 초과 범주에 속하므로 "RaaS 엔진 NFR 위반 경고"가 엔지니어링 파트로 제대로 발사되어야 한다.

## :gear: Technical & Non-Functional Constraints
- 방향성 고려: Next.js + Vercel 환경에서는 커스텀 p95 모니터링 쿼리를 돌리는 것보다 기본 내장된 로그 스트리밍을 활용하는 게 수 십배 경제적입니다. 이 파일은 요구사항 추적매트릭스(Traceability)를 맞추기 위해 작성되었으나 실전 반영 시 APM 세팅으로 갈음하세요.

## :checkered_flag: Definition of Done (DoD)
- [ ] APM을 통한 임계치 통보 설정, 또는 Prisma 기반의 p95 연산 백오피스 코드가 작성 완료되었는가?
