# UX_FLOW.md
<!-- @AI_GUIDE: 역할별 핵심 UX 시나리오 정의 문서. 신규 페이지 설계 또는 사용자 흐름 변경 시 반드시 참조. -->

# 🧭 UX 핵심 시나리오 흐름 (UX Flow)

본 문서는 Robot Platform Prototype V2의 역할별 핵심 사용자 시나리오(User Scenario)를 화면 이동 흐름과 함께 정의합니다.

---

## 공통 진입 흐름 (모든 역할)

```mermaid
flowchart TD
    Landing["랜딩 페이지 (/)"] -->|비로그인 사용자| Login["로그인 (/login)"]
    Login --> Signup["회원가입 선택 (/signup/:role)"]
    Login --> Social["소셜 로그인"]
    Landing -->|로그인 완료| Dashboard["역할별 대시보드 (AuthContext.role 기준 자동 분기)"]
    Dashboard --> Buyer["수요기업"]
    Dashboard --> SIPartner["SI 파트너"]
    Dashboard --> Manufacturer["제조사"]
    Dashboard --> Admin["관리자"]
```

---

## 시나리오 1: 수요기업 (Buyer) — 로봇 도입 탐색 및 견적 요청

**목표**: 로봇 도입 방식을 비교하고, SI 파트너를 찾아 견적을 요청한다.

```mermaid
flowchart TD
    Home["홈 (/)"] --> Calc["RaaS 계산기 탐색 (/calculator)"]
    Calc --> Input1["로봇 모델 검색 & 선택"]
    Input1 --> Input2["수량 / 계약기간 입력"]
    Input2 --> Submit["비교 계산 클릭"]
    Submit --> Chart["TCO 비교 차트"]
    Submit --> Cards["요금제별 결과 카드 (CAPEX / Lease / RaaS)"]
    Cards --> Quote["견적 요청 버튼 클릭"]
    Quote -->|비로그인| LoginRedirect["/login 리다이렉트"]
    Quote -->|로그인됨| Modal["QuoteRequestModal 오픈"]
    Modal --> Complete["견적 요청 완료 (Mock)"]
    
    Home --> Search["SI 파트너 검색 (/search)"]
    Search --> Filter["키워드 / 지역 / 티어 필터"]
    Filter --> List["파트너 카드 리스트"]
    List --> Detail["파트너 상세 (/search/:id)"]
    Detail --> Tab1["역량 & 뱃지 탭"]
    Detail --> Tab2["리뷰 요약 탭"]
    Tab2 --> PDF["PDF 리포트 다운로드"]
    
    Home --> AS["AS 서비스 신청 (/my/as-tickets/new)"]
    AS --> ASInput["계약 ID 입력 / 긴급도 선택"]
    ASInput --> ASDesc["증상 설명 / 이미지 첨부"]
    ASDesc --> ASSubmit["제출"]
    ASSubmit --> ASTickets["티켓 목록 (/my/as-tickets)"]
    ASTickets --> ASTracking["상세 추적 화면 (접수-배정-출동-해결)"]
```

---

## 시나리오 2: SI 파트너 (SI Partner) — 프로필 관리 및 제안서 운영

**목표**: 자사 역량을 등록하고, 수요기업 제안에 응대하며 인증 뱃지를 관리한다.

```mermaid
flowchart TD
    Login["로그인 완료"] --> Dashboard["SI 파트너 대시보드"]
    Dashboard --> Profile["프로필 관리 (/partner/profile)"]
    Dashboard --> Proposals["제안서 관리 (/partner/proposals)"]
    Dashboard --> Badges["인증 뱃지 (/partner/badges)"]
    
    Profile --> EditTags["역량 태그 편집"]
    Profile --> SetRegion["지역 설정"]
    Profile --> FinGrade["재무등급 확인"]
    
    Proposals --> PropList["제안 목록"]
    Proposals --> PropFilter["상태별 필터"]
    Proposals --> Upload["제안서 업로드"]
    
    Badges --> BadgeStatus["활성/만료/철회 현황"]
    Badges --> ExpireAlert["만료 임박 알림"]
```

---

## 시나리오 3: 제조사 (Manufacturer) — 대시보드 및 파트너십 관리

**목표**: SI 파트너에게 인증 뱃지를 발급하고, 수요기업 제안서를 검토한다.

```mermaid
flowchart TD
    Login["로그인 완료"] --> Dashboard["제조사 대시보드 (/manufacturer/dashboard)"]
    Dashboard --> KPI["KPI 지표 확인 (총 파트너 수 / 활성 제안 / 뱃지 현황)"]
    
    Dashboard --> Badges["뱃지 관리 (/manufacturer/badges)"]
    Dashboard --> Proposals["제안 관리 (/manufacturer/proposals)"]
    Dashboard --> Partners["파트너 목록"]
    
    Badges --> IssueRevoke["발급 / 철회"]
    Badges --> Renew["만료 갱신"]
    
    Proposals --> Review["제안서 검토"]
    Proposals --> ApproveReject["승인 / 반려"]
```

---

## 시나리오 4: 관리자 (Admin) — 플랫폼 운영 및 분쟁 조정

**목표**: 플랫폼 전체 지표를 관리하고, 에스크로 결제 및 AS SLA를 감시한다.

```mermaid
flowchart TD
    Login["로그인 완료"] --> Dashboard["관리자 대시보드 (/admin)"]
    Dashboard --> KPI["KPI 전체 현황 (전체 거래액 / 미결 분쟁 / AS 성공률)"]
    
    Dashboard --> Escrow["에스크로 관리 (/admin/escrow)"]
    Dashboard --> ASSLA["AS SLA 모니터링 (/admin/as-sla)"]
    Dashboard --> Events["이벤트 로그 (/admin/events)"]
    
    Escrow --> Payment["결제 승인/반려"]
    Escrow --> Disputes["분쟁 조정 (/admin/disputes)"]
    
    ASSLA --> Chart["SLA 달성률 차트"]
    ASSLA --> Unassigned["미배정 티켓 목록"]
    ASSLA --> TabFilter["탭별 필터 (전체/미배정/완료/SLA 미충족)"]
```

---

## 공통 보조 흐름

### 알림 (Notifications)
```mermaid
flowchart TD
    Icon["헤더 알림 아이콘"] --> Dropdown["NotificationDropdown"]
    Dropdown --> Click["알림 목록 클릭"]
    Click --> DeepLink["관련 페이지로 이동 (딥링크)"]
```

### 방문 예약 (Booking)
```mermaid
flowchart TD
    Buyer["수요기업"] --> Booking["방문 예약 (/booking)"]
    Booking --> Select["날짜/시간 선택"]
    Select --> Confirm["예약 확정"]
    Confirm --> Complete["예약 완료 (/booking/confirmation)"]
```

### 인증 보호 흐름 (RouteGuard)
```mermaid
flowchart TD
    Attempt["페이지 접근 시도"] --> Guard["RouteGuard 검사"]
    Guard -->|미인증| Login["로그인 (/login)"]
    Guard -->|권한 불일치| Forbidden["접근 금지 (/forbidden)"]
```
