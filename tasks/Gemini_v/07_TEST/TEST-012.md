---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[TEST] TEST-012: 다운로드 기안용 SI 리포트 PDF 직렬화 테스트"
labels: 'test, unit, profile, compute, priority:medium'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-012] 기안용 리포트 PDF 생성 파이프라인(`FC-015`) 결합도 테스트
- 목적: JSON 객체를 밀어 넣었을 때 5초 렌더링 NFR(비기능 요구사항)을 초과하지 않는지, 또 "비어 있는 데이터" 때문에 레이아웃 에러가 나지 않는지를 집중 방어.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- 관련 로직: `FC-015`, `FQ-002`
- 요구사항: REQ-FUNC-010 AC, REQ-NF-004

## :white_check_mark: Test Scenarios (GWT)
- [ ] **Scenario 1: 필수 4섹션 구비 블록 확인**
  - **Given**: FQ-002의 정상 데이터를 품은 모의 객체.
  - **When**: PDF 렌더링 유틸리티(함수) 실행.
  - **Then**: 생성되어 파일 버퍼(Buffer)로 튀어나온 객체가 에러를 내뱉지 않으며, 헤더 메타데이터가 `application/pdf` 를 정확히 띄우고 있음을 체킹.

- [ ] **Scenario 2: Nullable/공란 속성 방어 렌더링**
  - **Given**: 리뷰 내역이 아예 없는(`.length === 0`) 신규 SI 파트너 객체.
  - **When**: 렌더링 엔진에 주입함.
  - **Then**: PDF 템플릿 컴파일러가 `Cannot read properties of undefined` 에러로 터지지 않고, 무사히 빈 영역(공란 처리 등)으로 변환해 결과를 내뿜도록 분기 구조가 짜여있어야 한다.

## :gear: Technical Constraint
- 모듈 격리: PDF 생성 테스트는 실제 PDF 파일 내용을 Jest가 읽어 텍스트 비교를 하긴 어려우므로, "에러 없이 `ArrayBuffer`가 N초 내에 반환되는가" 와 "반환 데이터 크기(byte length) > 0" 에 초점을 두어라.
