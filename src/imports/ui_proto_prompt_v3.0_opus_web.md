# Firebase Studio 프롬프트 — 로봇 SI 안심 보증 매칭 플랫폼

> 아래 프롬프트를 Firebase Studio의 **App Prototyping Agent** 또는 **Gemini in Firebase**에 그대로 복사해 사용하세요.
> 섹션별로 분할 투입하는 것을 권장합니다 (한 번에 전체 투입 시 컨텍스트 초과 가능).

---

## 📌 [PROMPT 1] 프로젝트 초기 세팅 & 공통 레이아웃 (UI-015)

```
Create a Next.js 14+ App Router project for a B2B platform called "Robot SI Trusted Warranty Matching Platform" (로봇 SI 안심 보증 매칭 플랫폼).

## Tech Stack (strict)
- Next.js 14+ (App Router, Server Components first)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui components
- Firebase Auth (for NextAuth replacement — use Firebase Authentication)
- Firestore (for data) + Firebase Storage (for file uploads)
- Zod + react-hook-form for all forms
- Recharts for charts
- lucide-react for icons
- Fonts: Inter + Pretendard (Korean-optimized via Google Fonts)

## Roles (RBAC — 4 roles)
- `buyer` (수요기업): SME buying robots
- `si_partner` (SI 파트너): System integrator
- `manufacturer` (제조사): Robot maker issuing badges
- `admin` (플랫폼 운영팀): Platform operator

## Global Layout Requirements (UI-015)
1. Root layout with ThemeProvider, Toaster, Korean/English i18n-ready
2. Header:
   - Unauthenticated: Logo + Login + Signup (Buyer/SI Partner) buttons
   - Authenticated: Logo + role-based nav + notification bell + user dropdown
3. Role-based navigation menus:
   - Buyer: /search, /calculator, /my/contracts, /my/as-tickets, /booking
   - SI Partner: /partner/profile, /partner/proposals, /partner/badges
   - Manufacturer: /manufacturer/dashboard, /manufacturer/badges, /manufacturer/proposals
   - Admin: /admin, /admin/escrow, /admin/as-sla, /admin/events, /admin/disputes
4. Sidebar layout for Admin/Manufacturer/SI portals (240px desktop, collapsible tablet, bottom tab bar mobile — max 5 items)
5. Footer: Company info, terms links, © 2026 notice
6. Route guards: unauthenticated → /login, role mismatch → 403 page
7. Accessibility: skip nav link, semantic <nav>, aria-current="page", WCAG 2.1 AA
8. Responsive: Desktop (≥1025px), Tablet (769–1024px), Mobile (≤768px)

## Folder Structure
/app
  /(public)       — unauthenticated routes (login, signup, search, calculator)
  /(buyer)        — buyer-only routes with layout guard
  /(partner)      — SI partner portal
  /(manufacturer) — manufacturer portal
  /admin          — admin dashboard
  /api            — Route Handlers (PDF generation etc.)
/components
  /ui             — shadcn/ui components
  /layout         — Header, Sidebar, Footer, NotificationBell
  /forms          — reusable form components
/lib
  /firebase       — Firebase client/admin SDK
  /schemas        — Zod schemas (shared)
  /auth           — session helpers, RBAC middleware
/types            — TypeScript types

Generate the foundation: root layout, global styles (Tailwind config with CSS variables for theming), Firebase config file, auth middleware, and the 4 role-based layout wrappers. Include example navigation rendering for each role. Do NOT implement business logic yet — just the shell.
```

---

## 📌 [PROMPT 2] 회원가입 플로우 (UI-001, UI-002)

```
Implement two signup pages following the platform shell you just created.

## UI-001: Buyer Signup (/app/signup/buyer/page.tsx)
Fields (all required unless noted):
- company_name: string, max 255
- biz_registration_no: string, regex ^\d{3}-\d{2}-\d{5}$ (auto-hyphen as user types)
- region: select (시/도 dropdown — 서울/경기/인천/부산/대구/광주/대전/울산/세종/강원/충북/충남/전북/전남/경북/경남/제주)
- segment: enum Q1 | Q2 | Q3 | Q4
- contact_name: string, max 100
- contact_email: valid email
- contact_phone: regex ^01[016789]-\d{3,4}-\d{4}$ (auto-hyphen)

On submit:
- Call signupBuyer Server Action → create Firestore doc in `buyer_companies` collection
- Create Firebase Auth user
- Log `signup_complete` event to `event_logs` collection
- Redirect to /search
- On 409 duplicate biz_registration_no → inline error on that field
- On 400 → field-level errors; on 500 → toast

## UI-002: SI Partner Signup (/app/signup/partner/page.tsx)
Fields:
- Company basics: same pattern as Buyer
- Construction history: completed_projects (int ≥0), failed_projects (int ≥0)
- Auto-calculated success rate: (completed/(completed+failed))*100, displayed as read-only
- capability_tags: multi-select Tag Input, min 1 max 10
  - Predefined: [용접, 조립, 도장, 검사, 팔레타이징, 픽앤플레이스, CNC 로딩, AGV, 협동로봇, 비전검사]
  - Allow custom user-defined tags
- Use Accordion or Tabs to split sections (basics / history / capabilities)

On submit → Firestore `si_partners` + `si_profiles` (status: 'pending_review') → redirect to /signup/partner/pending

## Pending page (/app/signup/partner/pending/page.tsx)
- Message: "운영팀 검토 후 승인 시 알림을 보내드립니다"
- Expected review: 2~3 business days
- Contact info for support

## Requirements (both pages)
- Use shadcn/ui: Card, Input, Label, Button, Select, Textarea
- react-hook-form + @hookform/resolvers/zod (mode: 'onChange')
- Inline error messages with role="alert"
- Loading state: button disabled + spinner, prevent double-submit
- Responsive: mobile single column (max-width: 560~640px centered on desktop)
- All inputs must have associated <Label> + aria-describedby for errors
- Mask PII in console logs

Write the Zod schemas in /lib/schemas/auth.ts so they're reusable for profile editing later.
```

---

## 📌 [PROMPT 3] 검색 & SI 프로필 상세 (UI-003, UI-004)

```
Implement the SI partner discovery flow.

## UI-003: SI Partner Search (/app/search/page.tsx — Server Component)
URL query params drive filter state: ?region=서울&brand=UR&tag=용접&badge=true&page=1

### Filter Panel (left sidebar desktop / top collapsible mobile)
- region: multi-select
- brand: checkbox group (UR, 두산, 레인보우, ABB, KUKA, FANUC)
- capability_tags: checkbox group
- has_badge: toggle switch ("인증 파트너만 보기")
- tier: checkbox group (Silver, Gold, Diamond)
- "필터 초기화" + "검색" buttons
- Filter changes sync to URL (support browser back button)

### Result Cards (SiPartnerCard component)
Each card shows:
- Company name + tier badge (color-coded: Silver/Gold/Diamond)
- Success rate (progress bar + percentage)
- Capability tags (max 5 visible, "+N more")
- Badge icons (manufacturer logos/names)
- Average rating (stars + number)
- "상세 보기" button → /search/[siPartnerId]

### Pagination
- Server-side, 10 per page
- Prev/Next + page numbers (max 5 visible)
- Current page in URL

### States
- Loading: Skeleton cards (shadcn/ui Skeleton)
- Empty: "조건에 맞는 SI 파트너가 없습니다. 필터를 조정해주세요."
- CRITICAL: when has_badge=true, filter must enforce BADGE.is_active=true AND expires_at > NOW() — 0% unverified contamination

### Responsive
- Desktop: 240px filter sidebar + 2~3 col card grid
- Tablet: collapsible filter + 2 col
- Mobile: collapsible filter + 1 col full width

### Performance target: p95 ≤ 1000ms

## UI-004: SI Profile Detail (/app/search/[siPartnerId]/page.tsx — Server Component)

### Header Section
- Company name + tier badge
- Main activity regions
- Registration date + last profile update (updated_at)
- "기안 리포트 PDF 다운로드" button (top right)

### Key Metrics Cards (3 horizontal on desktop, vertical stack mobile)
1. 재무등급 (Financial grade): NICE grade + financial_grade_updated_at + "운영팀 사전 업데이트 기반" notice
2. 시공 성공률: % + circular progress + completed/failed counts
3. 평균 평점: stars + number + review count

### Tabs (shadcn/ui Tabs)
- [역량 & 태그]: full capability_tags list + project history
- [인증 뱃지]: list of badges (manufacturer name, issue date, expiry, active status)
- [리뷰 요약]: render review_summary (JSONB) — handle null safely

### PDF Download
- Button → POST /api/reports/pdf → generate with jsPDF or react-pdf
- PDF must include 4 sections: 재무·기술·인증·리뷰
- Loading spinner while generating, toast on error
- Content-Disposition: attachment with filename like `SI리포트_{회사명}_{YYYYMMDD}.pdf`
- Performance target: p95 ≤ 5000ms

### Error handling
- Non-existent siPartnerId → Next.js notFound() (404)
- Data fetch error → error boundary + retry button

### Accessibility
- Star rating: aria-label="평점 4.2점"
- Tabs: keyboard navigation
- PDF button: aria-busy during generation
- Public access (no auth required) for SEO

Make the search API Firestore-compatible with composite indexes noted in a comment.
```

---

## 📌 [PROMPT 4] 에스크로 결제 흐름 (UI-005)

```
Implement the 3-step escrow payment flow. This is a TRUST-CRITICAL UI — the user must feel their funds are safe.

## Constraint (CON-01)
NO payment gateway integration. Platform uses bank transfer + Admin manual confirmation. Only status values are recorded; platform does NOT hold actual funds.

## Routes
- /app/contracts/[contractId]/payment/page.tsx — Step 1: Bank info
- /app/contracts/[contractId]/payment/status/page.tsx — Step 2: Deposit status
- /app/contracts/[contractId]/warranty/page.tsx — Step 3: Warranty download

## Auth/Guard
- RBAC: buyer role required
- Ownership check: session.user.buyer_company_id === contract.buyer_company_id
- Non-owner → 403 page; non-existent contract → 404

## Step 1: Bank Account Info
- Contract summary card: SI partner name, total contract amount, creation date
- Bank info block (read from env var or admin config — NEVER hardcode):
  - Bank name, account number, account holder
  - "계좌번호 복사" button → clipboard + toast "복사되었습니다"
- Info banner: "입금 후 자금은 시공 완료 및 검수 승인 전까지 안전하게 보호됩니다."
- Note: "평균 입금 확인 소요: 1~2영업일"
- "입금 완료했습니다" button → navigate to Step 2

## Step 2: Deposit Status (with 30-second polling)
- 3-step Stepper showing current state:
  1. 입금 대기 중 / 입금 완료
  2. Admin 확인 중 / 예치 완료 (held)
  3. 보증서 발급 완료

- Branch by contract/escrow state:
  - `pending`: "입금을 기다리고 있습니다" + re-show bank info
  - `escrow_held`: Success banner "에스크로 예치가 완료되었습니다!" + warranty download enabled
  - `disputed`: Warning banner "분쟁이 접수되었습니다" + ops contact

- Show escrow TX details: held amount, held_at, admin_verified_at
- Poll every 30s via client component; stop polling when state=held or disputed

## Step 3: Warranty Download
- Warranty card: AS company name, contact, email, coverage scope, warranty period (months), issue date
- "AS 보증서 PDF 다운로드" button
- If warranty not yet issued: "보증서가 곧 발급됩니다" + auto re-check polling
- Loading state during download, toast on failure

## Security Requirements
- Bank account info: server-rendered only, NEVER in client JS bundle
- Mask account number in any request logging
- All routes require session + ownership check
- Escrow amount: mask in logs

## Accessibility
- Stepper: aria-current="step" on active step
- State changes: aria-live="polite"
- Copy success toast: role="status"
- Copy button: min 44px touch target on mobile

## Data Models (Firestore)
/contracts/{contractId}
  - buyer_company_id, si_partner_id, amount, status (pending|inspecting|release_pending|completed|disputed|refunded)
  - created_at, updated_at
/escrow_tx/{txId}
  - contract_id, state (pending|held|released|refunded), amount
  - held_at, admin_verified_at, released_at
/warranties/{warrantyId}
  - contract_id, as_company, pdf_url, coverage_scope, period_months, issued_at

Make the polling logic abstracted so it can be swapped to Firestore onSnapshot realtime listeners later.
```

---

## 📌 [PROMPT 5] 검수 승인/거절 & AS 접수 (UI-006, UI-007)

```
Implement inspection approval and emergency AS ticketing.

## UI-006: Inspection Approve/Reject (/app/contracts/[contractId]/inspection/page.tsx)

### Access control
- Buyer role + contract ownership
- Only accessible when contract.status === 'inspecting' (else redirect with message)

### Page Layout
1. Contract summary card: SI partner, amount, construction completion date
2. Inspection deadline countdown:
   - 7 business days remaining → D-7, D-6, ..., D-Day
   - Warning color at D-3 or fewer (orange → red)
   - Notice: "기한 내 미응답 시 자동으로 분쟁 접수됩니다"
3. SI's completion report summary
4. Two action sections:

### Approve Section
- Green primary button "검수 합격"
- Confirmation modal: "검수 합격을 승인하시겠습니까? 승인 시 Admin에게 방출 대기 알림이 전송됩니다."
- Optional memo (max 500 chars)
- On confirm → update contract.status='release_pending', notify admin, success banner

### Reject Section
- Red destructive button "검수 거절"
- Required rejection reason (Textarea, 10~1000 chars)
- Category select: 품질 미달 | 사양 불일치 | 납기 지연 | 기타
- Confirmation modal: "검수 거절 시 분쟁 접수로 전환됩니다. 계속하시겠습니까?"
- On confirm → update contract.status='disputed', notify ops team, redirect to dispute page

### Dispute Landing Page (/app/contracts/[contractId]/dispute/page.tsx)
- Dispute ticket number
- Mediation process timeline (visual)
- Assurance: "자금은 중재 완료 시까지 에스크로에 안전하게 보호됩니다"
- Ops contact

### Responsive
- Desktop: centered, max-width 720px
- Mobile: full width, approve/reject buttons full width with adequate touch area
- Modals: keyboard nav (Esc to close, Tab trap)
- Countdown: aria-live="polite"

## UI-007: Emergency AS Ticket

### Routes
- /app/contracts/[contractId]/as/new/page.tsx — new ticket form
- /app/contracts/[contractId]/as/[ticketId]/page.tsx — tracking
- /app/my/as-tickets/page.tsx — ticket list

### New Ticket Form
Fields:
- symptom_description: textarea, 20~2000 chars, required
- priority: RadioGroup (normal | urgent)
  - Urgent shows notice: "긴급 AS는 SI 부도·폐업·연락두절 확인 후 접수 가능합니다"
- Site photos: optional file upload, max 5 files, 10MB each → Firebase Storage

Validation: Zod schema, show inline errors, "접수 중..." spinner on submit.

### Tracking Page — 4-Step Stepper
1. 접수 완료 (reported_at + ticket number)
2. 엔지니어 배정 (assigned_at + engineer name/contact, target ≤4h)
3. 현장 출동 (dispatched_at, target ≤24h)
4. 해결 완료 (resolved_at + SLA compliance ✅/❌)

- Active step highlighted
- Each step shows elapsed vs target ("2시간 경과 / 목표 4시간")
- Target exceeded → red warning
- SLA auto-judgment: resolved_at - reported_at ≤ 24h → ✅ else ❌
- 30-second polling; toast on state change ("엔지니어가 배정되었습니다!")

### Error Handling
- Attempting urgent AS when SI status is normal → "현재 SI 파트너가 정상 운영 중입니다. 먼저 SI에 직접 연락해주세요."
- 404 for non-existent, 403 for others' contracts

### Responsive
- Mobile: vertical Stepper, full-width form
- Desktop: horizontal Stepper + details on right
- aria-current="step", elapsed time aria-live

Use Firestore collection `as_tickets` with the 4 timestamp fields (reported_at, assigned_at, dispatched_at, resolved_at).
```

---

## 📌 [PROMPT 6] RaaS 계산기 & 견적 요청 (UI-010, UI-011)

```
Implement the RaaS cost comparison calculator and manual quote request popup.

## UI-010: RaaS Calculator (/app/calculator/page.tsx)

### Access
- Public (no login required for calculation)
- Login required only for quote request

### Input Form (left on desktop, top on mobile)
- robot_model: Combobox with autocomplete against Firestore `robot_models` collection
  - Search by model code OR model name
  - If no match → show "유사 모델 3건" recommendation dropdown
- quantity: number input, int ≥1 (block 0 and negatives)
- term_months: Select — 12 | 24 | 36 | 48 | 60

### Zod Schema (raasCalcInputSchema)
- robot_model: string().min(1)
- quantity: number().int().min(1)
- term_months: enum
- Inline errors ≤200ms
- Disable "비교 계산" button when invalid

### Results — 3 Option Comparison Cards (horizontal 3-col desktop, vertical mobile)

1. **일시불 (CAPEX)**: total purchase cost, monthly depreciation
2. **리스**: monthly lease, total lease cost, residual value
3. **RaaS (OPEX)**: monthly subscription, total subscription cost, included services

Features:
- Bold large font for the key number in each card
- Cheapest option gets "추천" badge
- TCO comparison: horizontal bar chart (Recharts)
- ROI graph: line chart showing cumulative cost by period
- Render target: ≤2s

### PDF Download
- "결과 PDF 내려받기" button → POST /api/raas/pdf
- PDF contains: ROI graph + monthly cost table + TCO comparison
- Generation target: ≤3s
- Auto-download on completion, toast on error

### Quote Request CTA (connects to UI-011)
- Each option card: "이 플랜으로 견적 요청" button
- For RaaS option → open UI-011 modal
- Unauthenticated users → "견적 요청을 위해 로그인이 필요합니다" → redirect to login

### Error Messages (inline, ≤200ms)
- quantity=0 → "수량은 1 이상이어야 합니다"
- quantity<0 → "유효한 수량을 입력해주세요"
- non-existent model → "해당 모델을 찾을 수 없습니다" + 3 similar models

### Responsive
- Desktop: 320px input panel + results right
- Tablet: input top + results below (2-col cards)
- Mobile: full vertical stack (1 col cards, charts scroll-free)

### Accessibility
- Charts: aria-label with text summary of values for screen readers
- Combobox: full keyboard nav

## UI-011: Manual Quote Request Modal

### Trigger
- Opened from UI-010 when user clicks "이 플랜으로 견적 요청"
- shadcn/ui Dialog based

### Form Fields (with prefill from calculator)
- robot_model: Input (prefilled, editable)
- quantity: number (prefilled, editable)
- term_months: Select (prefilled, editable)
- contact_name: required, auto-filled if logged in
- contact_email: required, email format
- contact_phone: required, regex 01[016789]-\d{3,4}-\d{4}, auto-hyphen
- additional_requests: Textarea, optional, max 500 chars

### Submit Flow
- "견적 요청하기" button → Server Action requestManualQuote
- Creates Firestore doc in `quote_leads` (status: 'pending')
- Fires Admin notifications (Slack + email — use Firebase Functions)
- Loading spinner during submit, button disabled

### Success Screen (modal content swap)
- ✅ check icon + "요청 완료!"
- "운영팀이 2영업일 내 연락드립니다."
- Display quote request ID
- "확인" button closes modal

### Error Handling
- 400/500 → toast "요청에 실패했습니다. 다시 시도해주세요."

### Accessibility
- Focus Trap inside modal (Tab cycles within)
- Esc closes modal
- aria-modal="true", role="dialog", aria-labelledby
- Mobile: modal transforms to bottom sheet (full-screen)

Hardcode mock calculation results initially (CAPEX/lease/RaaS formulas) so UI can develop independently of pricing engine.
```

---

## 📌 [PROMPT 7] 제조사 포털 & SI 포털 (UI-009, UI-013)

```
Implement two role-specific portals: Manufacturer and SI Partner.

## UI-009: Manufacturer Portal (/app/manufacturer/*)

### Layout
Dedicated sidebar with routes:
- /manufacturer/dashboard — partner overview
- /manufacturer/badges — badge management
- /manufacturer/proposals — partner proposal management
RBAC: manufacturer role only.

### Dashboard (/manufacturer/dashboard)
KPI Cards (4 horizontal):
1. Active partners (badge holders) count
2. Pending proposals count
3. Expiring badges (within D-30) count
4. New partners this month count

Partner table: SI company name, badge status (active/expired/revoked), issue date, expiry, region
Search/filter: name, region, badge status

### Badge Management (/manufacturer/badges)

**Issue Badge Form:**
- SI partner: Combobox search against `si_partners`
- Expiry date: DatePicker (future date required)
- Issue memo: optional, max 500 chars
- "뱃지 발급" → confirmation modal → create Firestore badge doc (is_active=true)
- Block duplicate: if active badge exists for same SI+manufacturer → "이미 활성 뱃지가 존재합니다"

**Badge Table:**
- Columns: SI name, issue date, expiry, active status, revoked date, actions
- Rows expiring ≤D-7 get yellow background

**Revoke Action:**
- "철회" button → reason required (min 10 chars)
- Modal: "철회 시 SI 프로필에서 즉시 비노출됩니다"
- On confirm: is_active=false, revoked_at=now()

### Proposal Management (/manufacturer/proposals)

**Send Proposal Form:**
- SI partner: Combobox (prioritize SIs without active badge from this manufacturer)
- Proposal message: optional, max 1000 chars
- "파트너 제안 발송" → create Firestore proposal (status=pending, deadline=D+5)
- Toast: "제안이 발송되었습니다. SI의 응답 기한은 5영업일입니다."
- Block duplicate: if pending proposal exists → "이미 대기 중인 제안이 있습니다"

**Proposal Table:**
- Columns: SI name, sent date, response deadline, status, message
- Status colors: pending=yellow, accepted=green, rejected=red, expired=gray
- Status filter tabs
- Expired proposals → show "대안 SI 3개사 추천" section

### Performance
- Badge visibility change: ≤1 hour (use ISR revalidate or cache bust)
- Hidden after revoke: ≤10 minutes

## UI-013: SI Partner Portal (/app/partner/*)

### Layout
Sidebar with routes:
- /partner/profile — profile management
- /partner/proposals — received proposals
- /partner/badges — badge status
RBAC: si_partner role only.

### Profile Management (/partner/profile)
- Read mode: display current profile
- Edit mode: toggled by "수정" button
  - Reuse the Zod schema from UI-002
  - Fields: company basics, construction history (auto-recalc success rate), capability tags
- Save → Server Action → success toast
- Status badge: "승인됨" / "검토 대기 중"

### Proposals (/partner/proposals)
Table columns: 제조사명, 제안일, 응답 기한(D+5), 상태, 메시지
Status filter tabs.

**Accept action:**
- "수락" → confirmation modal → Server Action respondProposal(accept)
- Auto-issue partnership badge
- Toast: "파트너십이 체결되었습니다!"

**Reject action:**
- "거절" → optional reason input → Server Action respondProposal(reject)
- Notify manufacturer
- Toast: "제안을 거절했습니다"

Deadline countdown: D-5, D-4, D-3 (warning color at D-2 or fewer)

### Badges (/partner/badges)
- Card list: manufacturer name, issue date, expiry, active status
- Expiry ≤D-7 → warning
- Expired/revoked: grayed out with "만료됨"/"철회됨" label
- Stats: active N / expired N / revoked N

### Responsive (both portals)
- Desktop: 200px sidebar
- Tablet: collapsible sidebar (icon only, hover shows text)
- Mobile: bottom tab bar (max 5 items), tables → card view
- Combobox/DatePicker: full keyboard accessibility
- Modal: Focus Trap, Esc to close
- Countdown: aria-live="polite"

## Firestore Collections
/badges/{badgeId}
  - si_partner_id, manufacturer_id, issued_at, expires_at, is_active, revoked_at, revoke_reason
/partner_proposals/{proposalId}
  - manufacturer_id, si_partner_id, message, status (pending|accepted|rejected|expired), sent_at, deadline, responded_at

Add Firestore security rules snippet that enforces:
- Manufacturer can only read/write their own badges and proposals
- SI partner can only read badges/proposals addressed to them
```

---

## 📌 [PROMPT 8] Admin 대시보드 (UI-008)

```
Implement the Admin Dashboard — the platform's operations hub.

## CRITICAL Security
- RBAC: admin role only
- TOTP MFA required for admin login (Firebase Auth multi-factor)
- All admin actions logged to audit_logs collection
- Non-admin → 403 redirect

## Layout (/app/admin/layout.tsx)
Sidebar navigation:
- /admin (overview)
- /admin/escrow
- /admin/as-sla
- /admin/events
- /admin/disputes

## Main Dashboard (/admin/page.tsx)

### KPI Summary Cards (4 horizontal, each clickable to detail page)
1. 에스크로 방출 대기 (contracts where escrow state=held, status=release_pending)
2. 분쟁 진행 건수 (contracts where status=disputed)
3. AS 미배정 건수 (as_tickets where assigned_at IS NULL AND reported_at > 24h ago)
4. 이번 달 가입 완료 (count of signup_complete events this month)

## Escrow Management (/admin/escrow)

### Table
Columns: 계약 ID, 수요기업명, SI 파트너명, 금액, 상태(held/released/refunded), 예치일, Admin 메모
Status filter tabs: 전체 | 예치 대기 | 방출 대기 | 완료 | 환불
Sort by deposit date DESC
Server-side pagination.

### Actions
- **"입금 확인"** button (for pending deposits):
  - Modal with required admin memo input
  - Server Action → set state='held', record admin_verified_at, notify buyer
- **"방출 확인"** button (for release_pending):
  - Modal: "수기 송금 완료 확인"
  - Server Action → set state='released', record released_at, notify SI

## Disputes (/admin/disputes)
- List of contracts where status=disputed
- Show dispute filing date, mediation status, related contract info

## AS SLA Monitoring (/admin/as-sla)

### SLA Dashboard Cards
- 24-hour dispatch success rate (target ≥95%)
- Unassigned count (>24h)
- Average resolution time

### AS Ticket Table
Columns: 티켓 ID, 계약 ID, 긴급도, 접수일, 배정일, 출동일, 해결일, SLA 충족
Filters: 전체 | 미배정 | 진행 중 | 완료 | SLA 미충족
SLA-missed rows: red highlight + warning icon

## Event Logs (/admin/events)
Table columns: 이벤트 유형, 사용자 ID, 발생 시각, 페이로드 요약
Filter by event type (signup_complete, escrow_deposit_confirmed, badge_issued, etc.)
Search by user ID / date range
Aggregation chart (daily/weekly trend by event type) — Recharts

## Responsive
- Desktop: 240px sidebar + main content
- Tablet: collapsible sidebar (hamburger menu)
- Mobile: sidebar → bottom tab bar; tables → card view

## Performance & Security
- Dashboard LCP p95 ≤2000ms
- Server-side pagination for all tables
- XSS escape on admin memo input
- Mask escrow amounts in logs
- All admin write actions → audit_logs entry with actor, action, target, timestamp

## Firestore Collections
/event_logs/{eventId} — type, user_id, payload, created_at
/audit_logs/{logId} — admin_id, action, target_id, before, after, created_at
/as_tickets — (reuse from UI-007)

Accessibility: table aria-label, status Badges aria-label, modal Focus Trap, WCAG 2.1 AA.
```

---

## 📌 [PROMPT 9] 알림함 & O2O 예약 캘린더 (UI-014, UI-012)

```
Implement the in-app notification center and the O2O booking calendar (Phase 2 pre-build).

## UI-014: Notification Center

### Purpose
Fallback channel when external Kakao/SMS notifications fail (SRS 3.1).

### Bell Icon in Header
- Location: UI-015 header (all authenticated users)
- Unread count badge (red circle with number)
  - 0 → no badge
  - >99 → "99+"
- Click → dropdown panel (max 10 preview)
- Dropdown footer: "전체 알림 보기" → /notifications

### Full Notification Page (/notifications)
Items show:
- Type icon: 💰 escrow, 🔧 AS, 🏅 badge, 🤝 proposal, ⚙️ system
- Title + summary (max 2 lines)
- Relative time: "3분 전", "2시간 전", "어제"
- Unread state: left blue dot + bold text

### Features
- Filter: 전체 | 미읽음만
- "모두 읽음 처리" button (bulk update)
- Pagination (20 per page)

### Read Handling
- Click notification → mark is_read=true + deep link navigate:
  - escrow → /contracts/[id]/payment/status
  - AS → /contracts/[id]/as/[ticketId]
  - badge → /partner/badges or /manufacturer/badges
  - proposal → /partner/proposals

### Real-time Updates
- 30-second polling (abstract this — swap to Firestore onSnapshot later)
- On new notification while dropdown open: prepend with animation, bump badge count

### Accessibility
- Bell: aria-label="알림 N건" (dynamic)
- Badge: aria-live="polite"
- Dropdown: role="menu", items role="menuitem"
- Esc closes, Tab cycles items

### Performance
- List fetch ≤500ms
- Mark read ≤200ms

### Responsive
- Desktop: 360px dropdown
- Mobile: dropdown → full-screen sheet or full page navigation

### Firestore
/notifications/{notificationId}
  - recipient_id, type, title, body, deep_link, is_read, created_at
- Security rule: user can only read/update their own

## UI-012: O2O Booking Calendar (Phase 2 Pre-build)

### Purpose
Onsite consultation booking for buyers skeptical of fully-online contracts.

### Routes
- /app/booking/page.tsx — calendar
- /app/booking/[bookingId]/page.tsx — confirmation

### Banner
Phase 2 notice: "현재 수도권 지역에서 시범 운영 중입니다"

### Region + Date Selection
- Region: 2-level Select (시/도 → 구/군), 수도권 priority
- Date: shadcn/ui Calendar (DatePicker)
  - Disable past dates
  - Disable weekends + Korean public holidays (use a holiday data source)
  - Range: today ~ 30 days ahead

### Available Slots
- On region+date select → auto-fetch via Server Component (target ≤2s)
- Slot cards show: time (10:00 AM / 14:00 / 16:00), manager name (initials only), "예약하기"
- Loading: Skeleton

### Zero-slot Handling (CRITICAL)
If no slots available:
- Show "선택하신 날짜에 가용 매니저가 없습니다"
- Auto-recommend (≤2s): "가장 가까운 가용 일정: YYYY-MM-DD"
- Buttons: "추천 일정으로 예약" + "대기 예약 신청"

### Confirmation Form
Fields:
- Selected slot summary (date, time, region)
- Visit address detail (required)
- Consultation topic (optional, max 500 chars)
- "예약 확정" → Server Action → create o2o_bookings doc
- On success: "예약이 확정되었습니다!" + SMS/KakaoTalk dual notification (Firebase Functions)
- Confirmation page: booking number, details, manager info, cancel button

### Error Handling
- Slot already booked → "해당 시간대가 마감되었습니다" + refresh slots
- Network error → retry button
- Unsupported region → "해당 지역은 아직 서비스 준비 중입니다"

### Responsive
- Desktop: left calendar + right slot list
- Mobile: top calendar + scrolling slot list
- Calendar: keyboard nav (arrows, Enter)
- Slot cards: role="option", aria-selected when chosen

### Firestore
/o2o_bookings/{bookingId}
  - buyer_id, manager_id, booked_date, booked_time, region, address, topic, status (pending|confirmed|completed|cancelled)

Since this is Phase 2 pre-build, scaffold the schema, DTOs, and UI — mark backend slot availability logic as TODO with clear interface boundary.
```

---

## 📌 [PROMPT 10] 최종 통합 & Firebase 설정

```
Final integration pass. Take everything built and wire it into a cohesive deployment-ready Next.js app on Firebase.

## Firebase Services Configuration

### 1. Firebase Authentication
- Enable: Email/Password, Google OAuth
- Enable MFA (TOTP) for admin role
- Custom claims for role (buyer | si_partner | manufacturer | admin)
- Session cookie via Firebase Admin SDK in middleware

### 2. Firestore Collections (summary)
- buyer_companies
- si_partners
- si_profiles
- manufacturers
- contracts
- escrow_tx
- warranties
- as_tickets
- as_engineers
- badges
- partner_proposals
- robot_models
- quote_leads
- o2o_bookings
- notifications
- event_logs
- audit_logs

### 3. Firestore Security Rules
Write comprehensive rules enforcing:
- Buyers: read/write own company, own contracts, own AS tickets
- SI partners: read/write own profile, read own proposals/badges
- Manufacturers: read/write own badges/proposals
- Admins: read all, write with audit trail
- Public: read si_profiles (for search), read robot_models (for calculator)

### 4. Firestore Indexes
Compose indexes for:
- si_profiles: (region, is_active, tier) + (capability_tags array-contains, is_active)
- badges: (si_partner_id, is_active, expires_at)
- contracts: (buyer_company_id, status, created_at DESC)
- as_tickets: (contract_id, status)
- notifications: (recipient_id, is_read, created_at DESC)
- event_logs: (type, created_at DESC)

### 5. Firebase Storage
- Bucket layout:
  - /as_tickets/{ticketId}/{photoName}
  - /warranties/{warrantyId}.pdf
  - /reports/{reportId}.pdf
- Size limit: 10MB per file
- Security rule: uploader-only write, role-based read

### 6. Cloud Functions (if App Hosting supports — else Next.js Route Handlers)
- Scheduled (cron):
  - Daily: expire badges past expires_at (set is_active=false)
  - Daily: expire partner_proposals past deadline (set status=expired)
  - Hourly: auto-dispute contracts past inspection deadline (7 business days)
  - Every 15 min: send Slack alerts for SLA-missed AS tickets
- Triggers:
  - onCreate notifications → send Kakao/SMS with fallback
  - onCreate quote_leads → notify admin via Slack + email
  - onUpdate contracts (status change) → create notification

### 7. App Hosting
- Configure Firebase App Hosting for Next.js SSR
- Set environment variables: bank account info, Slack webhook URLs, email SMTP
- Output: production URL + preview URLs for PRs

## Testing Setup
- Vitest for unit tests
- Playwright for E2E (key flows: signup → search → contract → inspection → warranty)
- Firebase Emulator Suite for local integration tests

## Accessibility Audit
- Run Lighthouse on every route — target score ≥90 for accessibility
- Add axe-core in development

## Performance Targets (must meet)
- LCP p95 ≤2000ms (all pages)
- SI search response p95 ≤1000ms
- RaaS calculation p95 ≤2000ms
- PDF generation p95 ≤5000ms
- Inline form validation ≤200ms
- Notification list fetch ≤500ms

## Observability
- Firebase Analytics for conversion events (signup_complete, contract_created, escrow_held, warranty_issued, as_resolved)
- Firebase Crashlytics for error tracking
- Log structured events to event_logs collection

## Korean Language
- All UI copy in Korean (한국어)
- Use Pretendard font for Korean-optimized typography
- Date/number formatting: ko-KR locale

Generate a deployment checklist README.md summarizing:
1. Prerequisites (Firebase project, Node.js version)
2. Environment variables required
3. Seed data scripts to run
4. Firebase Emulator local setup
5. Production deployment steps
6. Post-deployment smoke tests
```

---

## 🎯 사용 방법 & 팁

### Firebase Studio에서 효과적으로 사용하는 순서

1. **PROMPT 1부터 순차적으로 투입** — 이전 단계 결과 위에 빌드하므로 순서 엄수
2. 각 PROMPT 실행 후 **Preview 확인** → 문제 있으면 해당 부분만 수정 요청
3. **한 번에 하나의 태스크**만 — 여러 개 합쳐서 요청하면 완성도가 떨어집니다
4. 에러 발생 시 **"Fix the X error in Y file"** 형태로 구체적으로 지시

### 자주 추가하면 좋은 후속 프롬프트

```
- "Add Firestore Emulator seed data for MOCK-001~007 with realistic Korean company names"
- "Write Playwright E2E test for the full contract flow from signup to warranty download"
- "Add Korean holiday data source and integrate with the O2O calendar"
- "Implement Firebase Remote Config for bank account info and SLA thresholds"
- "Add dark mode toggle with CSS variable theming"
```

### 주의사항

- Firebase Studio는 컨텍스트 윈도우 한도가 있으므로 **프롬프트 1개당 약 2,000~4,000 토큰** 수준으로 분할했습니다
- SRS 문서 내부 참조(#REQ-FUNC-XXX 등)는 AI가 접근 불가하므로, 프롬프트에 **필수 요구사항을 명시적으로 녹여두었습니다**
- 원본 문서의 `FC-XXX`, `API-XXX` 등 태스크 ID는 제거하고 **실제 동작 요구사항만 남겼습니다** (AI가 존재하지 않는 파일을 찾아 헤매는 것 방지)
- 금융 PG 연동, 실제 Slack Webhook 등은 **TODO 주석**으로 남기고 UI/DB 스키마만 먼저 구축하도록 지시했습니다
