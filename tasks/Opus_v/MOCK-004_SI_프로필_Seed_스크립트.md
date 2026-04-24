---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-004: Prisma Seed 스크립트 — SI 프로필 20건 (역량 태그, 리뷰 요약, 평점)"
labels: 'feature, backend, mock, seed, si-profile, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-004] SI Profile 도메인 Seed 스크립트 (SI 프로필 20건)
- 목적: SI 파트너 검색(UI-003) 및 프로필 상세(UI-004)에서 사용되는 **역량 태그·리뷰·평점·프로젝트 이력 데이터**를 제공하여, 필터링(역량 태그 기반 매칭), 정렬(평점 내림차순), 기안 리포트 PDF 생성(UI-004, API-015)의 독립 개발을 지원한다. REQ-FUNC-009(SI 프로필 상세 조회 p95 ≤ 2초) 및 REQ-FUNC-029(검색 필터 p95 ≤ 1초)의 성능 검증 및 UI 렌더링 현실감 확보가 목표다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서: [`06_SRS-v1.md#6.2.8 SI_PROFILE`](../06_SRS-v1.md) — SI 프로필 테이블 스키마 (JSONB review_summary, TEXT[] capability_tags)
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-009`](../06_SRS-v1.md) — SI 프로필 상세 조회 요구사항
- SRS 문서: [`06_SRS-v1.md#REQ-FUNC-029`](../06_SRS-v1.md) — SI 검색 필터링 요구사항
- 태스크 리스트: [`07_TASK-LIST-v1.md#MOCK-004`](../TASKS/07_TASK-LIST-v1.md)
- 선행 태스크: `DB-009`, `MOCK-001`
- 후행 활용: `UI-003`, `UI-004`, `UI-013`, `FQ-001`, `FQ-002`

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Seed 파일 및 마스터 데이터 준비
- [ ] `prisma/seed/siProfiles.ts` 작성
- [ ] 역량 태그 마스터 배열 정의 (`prisma/seed/lib/fixtures.ts`):
  - 로봇 유형: `collaborative_robot`, `mobile_robot`, `scara`, `agv`, `amr`
  - 산업 도메인: `automotive`, `food_beverage`, `logistics`, `electronics`, `pharmaceuticals`
  - 특화 역량: `vision_integration`, `safety_certification`, `plc_programming`, `custom_fixture`, `remote_monitoring`
- [ ] 리뷰 요약 템플릿 정의 — `{ summary: string, positive_points: string[], concerns: string[] }`

### 2단계: SI 프로필 20건 생성 (SI_PARTNER와 1:1 매핑)
- [ ] MOCK-001의 `SI_PARTNER_IDS` 20개 각각에 대해 1건씩 생성 (UNIQUE si_partner_id 제약 준수)
- [ ] **평점(avg_rating) 분포**:
  - Diamond 3사: 4.5 ~ 4.9
  - Gold 7사: 3.8 ~ 4.6
  - Silver 10사: 3.0 ~ 4.2
  - NULL 값 없음 (모든 SI가 최소 1건 이상 리뷰 보유 가정)
- [ ] **프로젝트 이력(completed_projects / failed_projects) 분포**:
  - Diamond: completed 30~80, failed 0~2 (성공률 95%+)
  - Gold: completed 15~40, failed 1~4 (성공률 85~94%)
  - Silver: completed 5~20, failed 1~5 (성공률 70~84%)
  - `success_rate` 필드와 계산 일치 검증: `completed / (completed + failed) * 100`

### 3단계: 역량 태그(capability_tags) 분포 설계
- [ ] SI별 역량 태그 3~7개 랜덤 선택 (최소 1개 로봇 유형 + 1개 산업 도메인 포함)
- [ ] **FQ-001 필터링 검증 분포**: 
  - `collaborative_robot` 태그 보유 SI 12사 (60%)
  - `automotive` 태그 보유 SI 8사 (40%)
  - `vision_integration` 태그 보유 SI 5사 (25%)
  - `pharmaceuticals` 태그 보유 SI 2사 (10%, 희소 케이스)
- [ ] 최소 3사는 **역량 태그 교집합 검증용** 다중 태그 보유 (예: SI_PARTNER_IDS[0]은 `collaborative_robot + automotive + vision_integration` 조합)

### 4단계: 리뷰 요약(review_summary JSONB) 생성
- [ ] 각 프로필에 `review_summary` 객체 삽입:
```json
{
"summary": "꼼꼼한 시공과 빠른 AS 대응이 장점",
"positive_points": ["시공 품질", "사후 관리", "견적 투명성"],
"concerns": ["수도권 외 지역 대응 제한"],
"total_reviews": 14
}
```
- [ ] Silver 등급 일부(2~3사)는 `concerns` 비중 높은 현실적 케이스 포함
- [ ] 등급별 `total_reviews` 분포: Diamond 30~50, Gold 10~30, Silver 3~15

### 5단계: 갱신 일시(updated_at) 분포
- [ ] Diamond/Gold 최근 30일 이내 갱신 (활발한 프로필 관리 시뮬레이션)
- [ ] Silver 일부(3사)는 90일 이상 미갱신 (Admin 대시보드 "갱신 필요" 알림 검증용)

### 6단계: Idempotency 및 검증
- [ ] Upsert 패턴 적용 (UNIQUE si_partner_id 기준)
- [ ] `SI_PROFILE_IDS` 상수 export
- [ ] verify.ts에 분포 검증 케이스 추가

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: SI 파트너와 1:1 무결성**
- **Given:** MOCK-001이 SI_PARTNER 20사를 생성한 상태가 주어짐
- **When:** MOCK-004 Seed를 실행함
- **Then:** SI_PROFILE 20건이 생성되며, 각 레코드는 고유한 `si_partner_id`를 가지고 UNIQUE 제약 위반이 없음

**Scenario 2: 평점과 등급 일관성**
- **Given:** Diamond 등급 SI 3사가 주어짐
- **When:** 해당 SI들의 프로필 `avg_rating`을 조회함
- **Then:** 모든 Diamond SI의 `avg_rating ≥ 4.5`이며, Silver SI 중 `avg_rating ≥ 4.5`인 SI는 없음

**Scenario 3: 시공성공률 계산 정합성**
- **Given:** 임의의 SI 프로필이 주어짐
- **When:** `completed_projects / (completed_projects + failed_projects) * 100`을 계산함
- **Then:** 해당 값이 `SI_PARTNER.success_rate`와 ±1% 오차 범위 내에서 일치함

**Scenario 4: 역량 태그 필터링 (FQ-001 기반 AC)**
- **Given:** Seed 실행 완료 상태가 주어짐
- **When:** `capability_tags @> ARRAY['collaborative_robot']` 조건으로 필터링함
- **Then:** 정확히 12사가 반환되며, 모든 결과가 해당 태그를 포함함

**Scenario 5: 역량 태그 교집합 (AND 필터)**
- **Given:** "협동로봇 + 자동차 + 비전통합" 3개 태그 AND 조건이 주어짐
- **When:** FQ-001 필터를 적용함
- **Then:** 최소 3사 이상이 반환됨 (Diamond 2사 + Gold 1사 설계 기준)

**Scenario 6: 리뷰 요약 JSONB 구조 유효성**
- **Given:** 임의의 SI_PROFILE 레코드가 주어짐
- **When:** `review_summary` 필드를 파싱함
- **Then:** `summary`(string), `positive_points`(string[]), `concerns`(string[]), `total_reviews`(number) 4개 키가 모두 존재함

## :gear: Technical & Non-Functional Constraints

### 데이터 일관성
- `capability_tags`의 각 요소는 마스터 배열(fixtures.ts)에 정의된 값만 사용 — 오탈자 방지
- `SI_PARTNER.success_rate`와 `SI_PROFILE.completed_projects/failed_projects`의 계산 일치 검증 필수
- `review_summary` JSON 스키마는 Zod로 정의 (타입 안정성 확보)

### 성능
- Seed 실행 시간 ≤ 2초
- PostgreSQL GIN 인덱스 적용 시(FQ-001 성능 최적화), 태그 배열 검색 p95 ≤ 100ms 달성 가능한 데이터 볼륨

### 현실성
- 평점이 5.0 완벽 데이터 생성 금지 — 현실감 저하 및 디버깅 난이도 증가
- 리뷰 내용은 실제 산업 현장 경험에 기반한 템플릿 활용 (과도한 faker 랜덤 회피)

## :checkered_flag: Definition of Done (DoD)
- [ ] Acceptance Criteria (Scenario 1~6)를 모두 충족하는가?
- [ ] 역량 태그 분포표(태그별 보유 SI 수)가 `prisma/seed/README.md`에 문서화되었는가?
- [ ] `SI_PARTNER.success_rate ↔ SI_PROFILE.completed/failed_projects` 계산 일치 검증이 verify.ts에 포함되었는가?
- [ ] FQ-001이 MOCK-004 데이터로 `p95 ≤ 1초` 필터링 성능을 로컬에서 검증 가능한가?
- [ ] TypeScript 타입 에러 및 ESLint 경고가 0건인가?

## :construction: Dependencies & Blockers

### Depends on (선행 태스크)
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-009 | `SI_PROFILE` 테이블 스키마 (JSONB, TEXT[] 또는 Json) | 필수 |
| MOCK-001 | SI_PARTNER 20사 Seed | 필수 |

### Blocks (후행 태스크)
| Task ID | 설명 |
|:---|:---|
| UI-003 | SI 검색 결과 목록 (역량 태그 필터) |
| UI-004 | SI 프로필 상세 (리뷰·평점·프로젝트 이력 렌더링) |
| UI-013 | SI 파트너 포털 (프로필 조회/수정) |
| FQ-001 | SI 검색 Query |
| FQ-002 | SI 프로필 상세 조회 Query |

### 참고사항
- SQLite 로컬 환경에서 `TEXT[]` 타입은 JSON 문자열로 저장됨(CON-13 Prisma 이중 환경) — Prisma schema에서 `Json` 타입 사용 권장
- 리뷰 요약의 `concerns` 필드는 현실감 확보를 위해 단순 긍정 일변도 회피