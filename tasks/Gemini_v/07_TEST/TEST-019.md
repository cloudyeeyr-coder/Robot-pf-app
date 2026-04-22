---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 사양
title: "[TEST] TEST-019: ROI 비교 문서 (RaaS Base) PDF 파이프라인 무너짐 방어"
labels: 'test, unit, raas, compute, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-019] RaaS 계산 결과 출력형 PDF 렌더링 검사(`FC-021`)
- 목적: FC-021 이 기안/보고 목적으로 비용 결과를 찍어낼 때 필수 시각 지표(Table, ROI 등)가 전부 포함되며, NFR 시간 내에 응답이 버퍼로 터져 나오는지를 감리한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-021`
- 요구사항: REQ-FUNC-019 AC, NFR 004

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 필수 레이아웃 병합 및 직렬화 통과**
  - **Given**: 정상 산출된 `FC-020` 의 3옵션 비용 결과 JSON.
  - **When**: PDF 렌더링 함수가 이 JSON 을 꿀꺽 삼킴.
  - **Then**: 뱉어낸 `ArrayBuffer` 객체의 사이즈가 0이 아니고 헤더가 `pdf`임을 확인하며 (최소한 렌더러가 중간에 터지진 않았음을 증명).

- [ ] **Scenario 2: NFR(3초) 퍼포먼스 제한 증명**
  - **Given**: 가상 CPU 로킹 환결 설정 (선택적).
  - **When**: 렌더링을 지시함 (비동기 Time Measurement).
  - **Then**: 렌더러(예: jsPdf)의 수행 종료 틱이 3,000ms 를 초과하지 않는지 체크.

## :gear: Technical Constraint
- 브라우저 전이: PDF는 최상급 기획상 브라우저 사이드 제너레이션(Client Side)으로 빠졌을 여지가 크다. 이 경우 서버가 넘기지 말고 React Component의 Testing Library를 통해 "PDF 다운로드 버튼 렌더링과 클릭 이벤트 방출" 을 검토하는 방향으로 선회 가능.
