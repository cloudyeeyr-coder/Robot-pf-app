# Admin Dashboard (PROMPT 8)

## Overview
This document describes the Admin Dashboard implementation for the Robot SI Trusted Warranty Matching Platform. The admin portal serves as the platform's operations hub for monitoring and managing escrow, AS tickets, disputes, and platform events.

## Features Implemented

### Access Control
- **RBAC**: `admin` role required for all admin routes
- **Route Protection**: Non-admin users redirected to `/403`
- **Layout**: Sidebar navigation (240px desktop, collapsible mobile)
- **Future**: TOTP MFA required for admin login (Firebase Auth multi-factor)

### Routes
- `/admin` - Main dashboard with KPIs
- `/admin/escrow` - Escrow management (deposit confirmation, fund release)
- `/admin/as-sla` - AS SLA monitoring (24-hour target tracking)
- `/admin/events` - Event logs (platform activity tracking)
- `/admin/disputes` - Dispute management (mediation)

---

## Main Dashboard (`/admin`)

### KPI Summary Cards (4 horizontal, clickable)

**1. 에스크로 방출 대기**
- Count: Contracts where `escrow.state=held` AND `contract.status=release_pending`
- Icon: DollarSign (blue)
- Click → navigates to `/admin/escrow`
- Description: "검수 완료 후 방출 대기 중"

**2. 분쟁 진행 건수**
- Count: Contracts where `status=disputed`
- Icon: AlertTriangle (red)
- Click → navigates to `/admin/disputes`
- Description: "중재 진행 중"

**3. AS 미배정 건수**
- Count: AS tickets where `assigned_at IS NULL` AND `reported_at > 24h ago`
- Icon: Clock (yellow)
- Click → navigates to `/admin/as-sla`
- Description: "24시간 초과"

**4. 이번 달 가입 완료**
- Count: Event logs where `type=signup_complete` AND `created_at >= month start`
- Icon: TrendingUp (green)
- Click → navigates to `/admin/events`
- Description: "신규 가입"

### Quick Actions Section
4 button cards for fast navigation:
- **에스크로 관리**: "입금 확인 및 방출 처리"
- **AS SLA 모니터링**: "AS 티켓 목표 달성률"
- **분쟁 관리**: "중재 진행 현황"
- **이벤트 로그**: "플랫폼 활동 로그"

### System Health Section
Simple status indicators (mock):
- 에스크로 시스템: 정상 (green)
- AS 배정 시스템: 정상 (green)
- 알림 발송: 정상 (green)

---

## Escrow Management (`/admin/escrow`)

### Table with Status Tabs
**Tabs**:
- 전체 (all)
- 예치 대기 (pending)
- 방출 대기 (held) - only if contract.status=release_pending
- 완료 (released)
- 환불 (refunded)

**Columns**:
- 계약 ID (font-mono)
- 수요기업명
- SI 파트너명
- 금액 (formatted with toLocaleString)
- 상태 (badge with color)
- 예치일 (held_at)
- 작업 (action buttons)

**Status Badge Colors**:
- `pending`: Yellow ("예치 대기")
- `held`: Blue default ("예치 완료")
- `released`: Green ("방출 완료")
- `refunded`: Red destructive ("환불됨")

### Actions

**"입금 확인" Button** (for pending deposits):
1. Click button
2. Modal opens:
   - Blue info banner: "입금이 확인되면 에스크로가 예치 상태로 전환됩니다"
   - Display: Contract ID, Amount
   - Required field: Admin memo (Textarea, min 1 char, max 500 chars)
   - Zod validation with inline errors
3. Submit → `confirmEscrowDeposit(contractId, memo)`
4. Success:
   - Set `escrow.state='held'`
   - Record `escrow.held_at` and `admin_verified_at`
   - Toast: "입금이 확인되었습니다"
   - TODO: Create audit log
   - TODO: Notify buyer

**"방출 확인" Button** (for release_pending):
1. Click button
2. Modal opens:
   - Green info banner: "수기 송금 완료 확인 - SI 파트너에게 수기로 송금 완료 후 확인 처리해주세요"
   - Display: Contract ID, SI Partner Name, Amount
   - Required field: Admin memo
3. Submit → `releaseEscrow(contractId, memo)`
4. Success:
   - Set `escrow.state='released'`
   - Record `escrow.released_at`
   - Set `contract.status='completed'`
   - Toast: "에스크로가 방출되었습니다"
   - TODO: Create audit log
   - TODO: Notify SI partner

---

## AS SLA Monitoring (`/admin/as-sla`)

### SLA Metrics Cards (3 horizontal)

**1. 24시간 목표 달성률**
- Formula: `(SLA compliant tickets / completed tickets) * 100`
- Target: ≥95%
- Color: Green if ≥95%, Red if <95%
- Icon: CheckCircle (green) or AlertTriangle (red)
- Text: "목표 달성" or "목표 미달"

**2. 미배정 건수 (24시간 초과)**
- Count: Tickets where `assigned_at IS NULL` AND `reported_at > 24h ago`
- Color: Green if 0, Red if >0
- Icon: Clock (red) with "즉시 조치 필요"

**3. 평균 해결 시간**
- Formula: Average of `(resolved_at - reported_at)` for completed tickets
- Display in hours (1 decimal)
- Target: ≤24시간

### AS Ticket Table with Tabs
**Tabs**:
- 전체 (all)
- 미배정 (unassigned) - tickets not assigned for >24h
- 진행 중 (in_progress) - status !== 'resolved'
- 완료 (completed) - status === 'resolved'
- SLA 미충족 (sla_missed) - resolved but SLA failed

**Columns**:
- 티켓 번호 (font-mono)
- 계약 ID (font-mono)
- 긴급도 (Priority badge: urgent=red, normal=gray)
- 상태 (Status badge)
- 접수일 (reported_at)
- 배정일 (assigned_at)
- 해결일 (resolved_at)
- SLA (CheckCircle or XCircle icon, only for resolved)

**Status Badges**:
- `reported`: Yellow ("접수됨")
- `assigned`: Blue ("배정됨")
- `dispatched`: Blue ("출동 중")
- `resolved`: Green ("완료")

**Row Highlighting**:
- SLA-missed rows: `bg-red-50` (light red background)

---

## Event Logs (`/admin/events`)

### Event Trend Chart (Recharts)
- Bar chart showing event count by type
- X-axis: Event type labels (Korean)
- Y-axis: Count
- Bar color: Blue (#3b82f6)

### Event Type Filter
Select dropdown with options:
- 전체 (all)
- 회원가입 (signup_complete)
- 계약 생성 (contract_created)
- 에스크로 확인 (escrow_deposit_confirmed)
- 뱃지 발급 (badge_issued)
- AS 티켓 (as_ticket_created)
- 제안 발송 (proposal_sent)

### Event Logs Table
**Columns**:
- 이벤트 유형 (Badge with color)
- 사용자 ID (font-mono)
- 사용자명
- 페이로드 요약
- 발생 시각 (toLocaleString with ko-KR)

**Event Type Colors** (Badge):
- signup_complete: Green
- contract_created: Blue
- escrow_deposit_confirmed: Purple
- badge_issued: Yellow
- as_ticket_created: Red
- proposal_sent: Indigo

---

## Disputes (`/admin/disputes`)

### Summary Banner
Yellow alert banner showing:
- AlertTriangle icon
- "현재 진행 중인 분쟁: {count}건"
- "모든 분쟁 건은 운영팀이 중재하며, 자금은 에스크로에 안전하게 보호됩니다"

### Disputes Table
**Columns**:
- 계약 ID (font-mono)
- 수요기업명
- SI 파트너명
- 계약금액
- 분쟁 접수일 (contract.updated_at)
- 상태 (Badge: "중재 진행 중" - red destructive)

**Empty State**:
- AlertTriangle icon (gray, large)
- "진행 중인 분쟁이 없습니다"
- "분쟁이 발생하면 여기에 표시됩니다"

### Mediation Process Info Card
4-step process visualization:
1. **분쟁 접수 확인**: "수요기업이 검수 거절 시 자동으로 분쟁으로 전환됩니다"
2. **양측 의견 청취**: "수요기업과 SI 파트너 양측의 입장을 확인합니다"
3. **현장 확인 (필요시)**: "필요한 경우 운영팀이 현장을 방문하여 확인합니다"
4. **중재 결정**: "운영팀이 공정한 기준으로 중재 결정을 내립니다 (에스크로 방출 or 환불)"

Each step has a numbered badge (1-4) in blue circle.

---

## Mock Data Structure

### Event Logs (`/src/lib/mockAdminData.ts`)
```typescript
interface EventLog {
  id: string;
  type: 'signup_complete' | 'contract_created' | 'escrow_deposit_confirmed' | 'badge_issued' | 'as_ticket_created' | 'proposal_sent';
  user_id: string;
  user_name: string;
  payload_summary: string;
  created_at: string;
}
```

### Audit Logs (Future)
```typescript
interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_id: string;
  before?: string;
  after?: string;
  created_at: string;
}
```

### Helper Functions
- `getEscrowReleasesPending()`: Count contracts needing release
- `getDisputesInProgress()`: Count disputed contracts
- `getUnassignedAsTickets()`: Count unassigned tickets >24h
- `getSignupsThisMonth()`: Count signup events this month
- `getAsSlaMetrics()`: Calculate SLA success rate, unassigned count, avg time
- `confirmEscrowDeposit(contractId, memo)`: Confirm deposit
- `releaseEscrow(contractId, memo)`: Release funds

---

## File Structure

```
src/
├── lib/
│   └── mockAdminData.ts           # Event logs, audit logs, helper functions
├── pages/
│   └── admin/
│       ├── Dashboard.tsx          # Main admin dashboard with KPIs
│       ├── EscrowManagement.tsx   # Escrow deposit/release management
│       ├── AsSlaMonitoring.tsx    # AS SLA tracking and metrics
│       ├── EventLogs.tsx          # Event logs with chart
│       └── Disputes.tsx           # Dispute mediation
└── app/
    └── App.tsx                    # Updated admin routes
```

---

## Responsive Design

### Desktop (≥1024px)
- **Sidebar**: 240px width, persistent
- **Tables**: Full width with all columns
- **Cards**: Grid layout (4 columns for KPIs, 3 for metrics)

### Tablet (768px - 1023px)
- **Sidebar**: Collapsible (hamburger menu)
- **Tables**: Horizontal scroll if needed
- **Cards**: 2 columns

### Mobile (≤767px)
- **Sidebar**: Bottom tab bar
- **Tables**: Card view (stacked)
- **Cards**: Single column
- **Charts**: Full width, responsive

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- All clickable elements accessible via Tab
- Modals: Focus Trap (Tab cycles within), Esc to close
- Tables: Arrow keys for navigation (future enhancement)

### ARIA Labels
- Tables: `aria-label` on table element
- Status badges: `aria-label` with full status text
- KPI cards: Descriptive text for screen readers
- Charts: `aria-label` with data summary
- Modals: `aria-modal="true"`, `role="dialog"`, `aria-labelledby`
- Form errors: `role="alert"`, `aria-describedby`, `aria-invalid`

### Screen Reader Support
- Status changes announced with `aria-live="polite"`
- Error messages linked to inputs
- Icon-only buttons have `aria-label`

---

## Performance Targets

### PROMPT 8 Requirements
- **Dashboard LCP**: ≤2000ms (p95)
- **Server-side pagination**: All tables (10-20 per page)
- **Inline validation**: ≤200ms
- **XSS protection**: Escape admin memo input
- **Masking**: Escrow amounts in logs

---

## Security Considerations

### Input Validation
- All admin actions use Zod validation
- Admin memo fields: min 1 char, max 500 chars
- XSS protection: React auto-escapes, but server should sanitize

### Audit Trail
Every admin write action should create an audit log:
```typescript
{
  admin_id: string;
  action: 'escrow_deposit_confirmed' | 'escrow_released' | etc;
  target_id: string; // contract ID, ticket ID, etc
  before: string; // previous state JSON
  after: string; // new state JSON
  created_at: Timestamp;
}
```

### PII Handling
- Mask escrow amounts in console logs (production)
- Mask user IDs in external analytics
- Admin session timeout: 30 minutes

---

## TODO: Future Firestore Integration

### Collections

**`event_logs`**
```typescript
{
  id: string;
  type: EventType;
  user_id: string;
  payload: any; // Full event data
  payload_summary: string; // For display
  created_at: Timestamp;
}
```

**`audit_logs`**
```typescript
{
  id: string;
  admin_id: string;
  action: string;
  target_id: string;
  target_collection: string; // 'contracts', 'as_tickets', etc
  before: any; // Previous state snapshot
  after: any; // New state snapshot
  ip_address?: string;
  user_agent?: string;
  created_at: Timestamp;
}
```

### Firestore Security Rules

```javascript
// Only admins can read/write audit logs
match /audit_logs/{logId} {
  allow read, write: if request.auth.token.role == 'admin';
}

// Only admins can read event logs
match /event_logs/{eventId} {
  allow read: if request.auth.token.role == 'admin';
  allow write: if false; // System-generated only
}

// Escrow management: admin only
match /escrow_tx/{txId} {
  allow update: if request.auth.token.role == 'admin'
                && (request.resource.data.state in ['held', 'released', 'refunded']);
}
```

### Firestore Indexes

```
Collection: event_logs
- (type, created_at DESC) — for filtering by event type
- (created_at DESC) — for chronological listing

Collection: audit_logs
- (admin_id, created_at DESC) — for admin activity tracking
- (target_id, created_at DESC) — for target entity history
```

### Cloud Functions

**`createAuditLog` (Helper)**
```typescript
async function createAuditLog(
  adminId: string,
  action: string,
  targetId: string,
  targetCollection: string,
  before: any,
  after: any
) {
  await firestore.collection('audit_logs').add({
    admin_id: adminId,
    action,
    target_id: targetId,
    target_collection: targetCollection,
    before,
    after,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
```

**`logEvent` (Helper)**
```typescript
async function logEvent(
  type: EventType,
  userId: string,
  payload: any
) {
  await firestore.collection('event_logs').add({
    type,
    user_id: userId,
    payload,
    payload_summary: generateSummary(type, payload),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
```

**Trigger: Log all contract status changes**
```typescript
functions.firestore.document('contracts/{contractId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== after.status) {
      await logEvent('contract_status_changed', after.buyer_company_id, {
        contract_id: context.params.contractId,
        old_status: before.status,
        new_status: after.status,
      });
    }
  });
```

---

## Testing Scenarios

### Admin Dashboard

**Happy Path**:
1. Admin logs in → navigates to `/admin`
2. Sees 4 KPI cards with current counts
3. Clicks "에스크로 방출 대기" card
4. Navigates to `/admin/escrow`

### Escrow Management

**Deposit Confirmation**:
1. Navigate to `/admin/escrow`
2. Filter: "예치 대기" tab
3. Click "입금 확인" on pending contract
4. Modal opens with contract details
5. Enter memo: "입금 확인 완료"
6. Submit
7. Success toast appears
8. Escrow state changes to "예치 완료"
9. Contract moves to "방출 대기" tab (if release_pending)

**Release Confirmation**:
1. Filter: "방출 대기" tab
2. Click "방출 확인"
3. Modal shows SI partner info
4. Enter memo: "수기 송금 완료"
5. Submit
6. Success toast
7. Escrow state → "방출 완료"
8. Contract status → "completed"

### AS SLA Monitoring

**View Metrics**:
1. Navigate to `/admin/as-sla`
2. See 3 metric cards
3. Success rate: 80% (red, below 95% target)
4. Unassigned: 1건 (red with alert)
5. Avg resolution: 18.5시간

**Filter SLA Violations**:
1. Click "SLA 미충족" tab
2. Table shows resolved tickets with red background
3. XCircle icon in SLA column

### Event Logs

**View Chart**:
1. Navigate to `/admin/events`
2. Bar chart shows event distribution
3. 회원가입: 2건, 계약 생성: 1건, etc

**Filter by Type**:
1. Select "회원가입" from dropdown
2. Table filters to only signup_complete events
3. Shows user names and timestamps

### Disputes

**View Disputes**:
1. Navigate to `/admin/disputes`
2. Yellow banner shows count
3. Table lists disputed contracts
4. Mediation process info below

**Empty State**:
1. No disputes exist
2. Shows AlertTriangle icon
3. Message: "진행 중인 분쟁이 없습니다"

---

## Analytics Events (TODO)

Track the following events in Firebase Analytics:

**Admin Actions**:
1. `admin_escrow_confirmed` - Params: contract_id, amount
2. `admin_escrow_released` - Params: contract_id, amount, si_partner_id
3. `admin_dashboard_viewed` - Params: kpi_counts
4. `admin_dispute_viewed` - Params: contract_id

---

## Summary

PROMPT 8 successfully implements:

✅ **Admin Dashboard** with 4 KPI cards (clickable navigation)
✅ **Escrow Management** with deposit confirmation and release modals
✅ **AS SLA Monitoring** with success rate tracking and violation highlighting
✅ **Event Logs** with bar chart visualization and type filtering
✅ **Disputes** with mediation process info
✅ Status-based tabs with counts
✅ Modal forms with Zod validation
✅ Helper functions for KPI calculations
✅ Full WCAG 2.1 AA accessibility
✅ Responsive design (desktop/tablet/mobile)
✅ Ready for Firestore integration (mock data layer abstracted)

The admin dashboard provides a comprehensive operations hub for platform administrators to monitor escrow, AS tickets, disputes, and platform activity in real-time.
