# Manufacturer & SI Partner Portals (PROMPT 7)

## Overview
This document describes the Manufacturer Portal and SI Partner Portal implementations for the Robot SI Trusted Warranty Matching Platform.

## Features Implemented

### UI-009: Manufacturer Portal (`/manufacturer/*`)

A dedicated portal for robot manufacturers to manage their certified SI partner network through badge issuance and partnership proposals.

#### Routes
- `/manufacturer/dashboard` - Overview dashboard with KPIs
- `/manufacturer/badges` - Badge issuance and management
- `/manufacturer/proposals` - Partnership proposal management

#### Access Control
- **RBAC**: `manufacturer` role required
- **Layout**: Sidebar navigation (240px desktop, collapsible mobile)

---

### Manufacturer Dashboard (`/manufacturer/dashboard`)

#### KPI Summary Cards (4 horizontal)
1. **활성 파트너**: Current count of SI partners with active badges
2. **대기 중인 제안**: Pending proposals awaiting SI response
3. **만료 예정 뱃지**: Badges expiring within 30 days
4. **이번 달 신규**: New partnerships established this month

All cards are **clickable** and navigate to relevant detail pages.

#### Partner Table
Displays all badges issued by the manufacturer with:
- **Columns**: 파트너사명, 발급일, 만료일, 상태, 비고
- **Filters**: 
  - Search by partner name
  - Status filter: 전체 | 활성 | 만료됨 | 철회됨
- **Status Badge Colors**:
  - Active (D-30+): Green
  - Active (D-8 to D-30): Yellow background
  - Active (D-7 or less): Red with warning background
  - Expired: Gray secondary badge
  - Revoked: Red destructive badge

---

### Badge Management (`/manufacturer/badges`)

#### Issue Badge Form (Modal)
**Fields**:
1. **SI Partner** (Combobox with search)
   - Search by company name or ID
   - Real-time filtering
   - Keyboard accessible

2. **Expiry Date** (DatePicker)
   - Future dates only (past dates disabled)
   - Korean locale (date-fns/locale/ko)
   - Calendar UI (shadcn/ui Calendar component)

3. **Issue Memo** (Textarea, optional, max 500 chars)

**Validation**:
- Duplicate check: Prevents issuing if active badge already exists for same SI + manufacturer
- Error: "이미 활성 뱃지가 존재합니다"

**Success Flow**:
- Badge created with `is_active: true`
- Toast: "{파트너사명}에 뱃지가 발급되었습니다"
- Table auto-refreshes

#### Badge Table
**Columns**: 파트너사명, 발급일, 만료일, 상태, 철회일, 작업

**Row Highlighting**:
- Rows expiring ≤ D-7: Yellow background

**Actions**:
- **"철회" button**: Only for active, non-revoked badges
  - Opens revoke confirmation modal

#### Revoke Badge Flow
1. Click "철회" button
2. Modal shows:
   - Warning: "철회 시 SI 프로필에서 즉시 비노출됩니다"
   - Target partner name
   - Required reason field (min 10 chars)
3. Confirm button: "뱃지 철회"
4. On success:
   - `is_active: false`
   - `revoked_at: now()`
   - `revoke_reason: {user input}`
   - Toast: "{파트너사명}의 뱃지가 철회되었습니다"

**Performance Target**:
- Badge visibility change: ≤ 1 hour (ISR revalidate or cache bust)
- Hidden after revoke: ≤ 10 minutes

---

### Proposal Management (`/manufacturer/proposals`)

#### Send Proposal Form (Modal)
**Fields**:
1. **SI Partner** (Combobox)
   - **Prioritization**: Partners without active badge from this manufacturer listed first
   - Badge holders shown with "(뱃지 보유)" label
   - Hint text: "뱃지가 없는 파트너가 우선 표시됩니다"

2. **Proposal Message** (Textarea, optional, max 1000 chars)

**Validation**:
- Duplicate check: "이미 대기 중인 제안이 있습니다" if pending proposal exists

**Success Flow**:
- Proposal created with `status: 'pending'`
- Deadline: 5 business days from sent_at (D+5)
- Toast: "{파트너사명}에 제안이 발송되었습니다. SI의 응답 기한은 5영업일입니다."

#### Proposal Table with Status Tabs
**Tabs**:
- 전체 (all)
- 대기 중 (pending)
- 수락됨 (accepted)
- 거절됨 (rejected)
- 만료됨 (expired)

**Columns**: 파트너사명, 발송일, 응답 기한, 상태, 메시지

**Status Colors**:
- `pending`: Yellow badge
- `accepted`: Green badge
- `rejected`: Red destructive badge
- `expired`: Gray secondary badge

**Deadline Display**:
- Pending proposals: Show "D-5", "D-4", etc.
- D-2 or fewer: Red text with warning
- Non-pending: Show deadline date

**Future Enhancement** (PROMPT 7 spec):
- Expired proposals → "대안 SI 3개사 추천" section

---

## UI-013: SI Partner Portal (`/partner/*`)

A dedicated portal for SI partners to manage their profile, respond to manufacturer proposals, and track their certification badges.

#### Routes
- `/partner/profile` - Profile management
- `/partner/proposals` - Received proposals from manufacturers
- `/partner/badges` - Badge status viewer

#### Access Control
- **RBAC**: `si_partner` role required
- **Layout**: Sidebar navigation (240px desktop, collapsible mobile)

---

### Profile Management (`/partner/profile`)

#### Edit Mode Toggle
- **Read Mode**: Display current profile with status badge
- **Edit Mode**: Editable form with save/cancel buttons

**Status Badge**:
- "승인됨" (approved) - Green default badge
- "검토 대기 중" (pending_review) - Gray secondary badge

#### Profile Form (3 Tabs)

**Tab 1: 기본 정보 (Basics)**
- Company name (required)
- Business registration number (auto-hyphen, required)
- Region (select dropdown, required)
- Segment (Q1/Q2/Q3/Q4, required)
- Contact name, email, phone (all required)

**Tab 2: 시공 이력 (History)**
- Completed projects (number, min 0)
- Failed projects (number, min 0)
- **Auto-calculated success rate**: 
  - Formula: `(completed / (completed + failed)) * 100`
  - Displayed as percentage with progress bar
  - Read-only, updates in real-time as user edits counts

**Tab 3: 역량 태그 (Capabilities)**
- TagInput component (reused from signup)
- Predefined suggestions: 용접, 조립, 도장, 검사, 팔레타이징, etc.
- Min 1, max 10 tags

**Save Flow**:
- All fields validated with Zod schema (reused from `siPartnerSignupSchema`)
- Success toast: "프로필이 업데이트되었습니다"
- Exit edit mode

---

### Proposals (`/partner/proposals`)

#### Proposal Table with Status Tabs
**Tabs**: 전체, 대기 중, 수락됨, 거절됨, 만료됨

**Columns**: 제조사명, 제안일, 응답 기한, 상태, 메시지, 작업

**Row Highlighting**:
- Pending proposals with D-2 or fewer: Yellow background

**Deadline Countdown**:
- Pending: "D-5", "D-4", "D-3"
- D-2 or fewer: Red text font-semibold
- Warning color at D-2

#### Accept Action
1. Click "수락" button
2. Modal shows:
   - Green success banner: "파트너십 체결 확인"
   - "제안을 수락하면 자동으로 파트너십 뱃지가 발급됩니다"
   - Manufacturer name and proposal message
3. Confirm: "수락하기"
4. On success:
   - Proposal `status: 'accepted'`
   - **Auto-issue partnership badge** (1-year expiry)
   - Toast: "파트너십이 체결되었습니다!"
   - Manufacturer notified

#### Reject Action
1. Click "거절" button
2. Modal shows:
   - Red warning banner: "제안 거절"
   - "거절 시 제조사에게 알림이 전송됩니다"
   - Optional reason textarea (max 500 chars)
3. Confirm: "거절하기"
4. On success:
   - Proposal `status: 'rejected'`
   - `response_reason` saved
   - Toast: "제안을 거절했습니다"
   - Manufacturer notified

---

### Badges (`/partner/badges`)

#### Stats Summary Cards (3 horizontal)
1. **활성 뱃지**: Count of active, non-expired badges
2. **만료된 뱃지**: Count of expired badges
3. **철회된 뱃지**: Count of revoked badges

#### Badge Cards (Grouped Sections)

**Active Badges** (2-column grid on desktop):
- Manufacturer name + Award icon
- "인증 파트너 뱃지" subtitle
- Issued date / Expiry date
- Status badge (활성, D-7, D-30)
- **Expiry warning** (D-7 or fewer):
  - Yellow banner with AlertCircle icon
  - "만료 임박 - 뱃지가 곧 만료됩니다. 제조사에 문의하여 갱신하세요."

**Expired Badges**:
- Grayed out icon (bg-gray-100, text-gray-400)
- "만료됨" badge

**Revoked Badges**:
- Red banner showing:
  - Revoked date
  - Revoke reason (if provided)

**Empty State**:
- Award icon (gray)
- "아직 뱃지가 없습니다"
- "제조사로부터 파트너십 제안을 받으면 뱃지가 발급됩니다"

---

## Mock Data Structure

### Badges (`/src/lib/mockBadges.ts`)

```typescript
interface Badge {
  id: string;
  si_partner_id: string;
  si_partner_name: string;
  manufacturer_id: string;
  manufacturer_name: string;
  issued_at: string;
  expires_at: string;
  is_active: boolean;
  revoked_at?: string;
  revoke_reason?: string;
}
```

### Partner Proposals (`/src/lib/mockBadges.ts`)

```typescript
interface PartnerProposal {
  id: string;
  manufacturer_id: string;
  manufacturer_name: string;
  si_partner_id: string;
  si_partner_name: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sent_at: string;
  deadline: string; // D+5 from sent_at
  responded_at?: string;
  response_reason?: string;
}
```

### Helper Functions

- `getBadgesByManufacturerId(id)`: Filter badges by manufacturer
- `getBadgesBySiPartnerId(id)`: Filter badges by SI partner
- `getActiveBadgeCount(manufacturerId)`: Count active badges
- `getExpiringBadges(manufacturerId, daysThreshold)`: Get badges expiring soon
- `getProposalsByManufacturerId(id)`: Filter proposals by manufacturer
- `getProposalsBySiPartnerId(id)`: Filter proposals by SI partner
- `getDaysUntilDeadline(deadline)`: Calculate days remaining
- `getDaysUntilExpiry(expiresAt)`: Calculate days until badge expires
- `issueBadge(...)`: Simulate badge creation
- `revokeBadge(badgeId, reason)`: Simulate badge revocation
- `sendProposal(...)`: Simulate proposal creation
- `respondToProposal(proposalId, accept, reason?)`: Simulate accept/reject

---

## File Structure

```
src/
├── lib/
│   └── mockBadges.ts                  # Badge & proposal mock data + helpers
├── pages/
│   ├── manufacturer/
│   │   ├── Dashboard.tsx              # Manufacturer dashboard with KPIs
│   │   ├── BadgeManagement.tsx        # Badge issuance and revocation
│   │   └── ProposalManagement.tsx     # Send proposals to SI partners
│   └── partner/
│       ├── Profile.tsx                # SI partner profile management
│       ├── Proposals.tsx              # View and respond to proposals
│       └── Badges.tsx                 # View badge status
└── app/
    └── App.tsx                        # Updated routing
```

---

## Responsive Design

### Desktop (≥1024px)
- **Sidebar**: 240px width, persistent
- **Tables**: Full width with all columns
- **Cards**: 2-3 column grids
- **Modals**: 28rem (sm:max-w-md)

### Tablet (768px - 1023px)
- **Sidebar**: Collapsible (hamburger menu)
- **Tables**: Horizontal scroll if needed
- **Cards**: 2 columns

### Mobile (≤767px)
- **Sidebar**: Bottom tab bar (max 5 items)
- **Tables**: Card view (table → stacked cards)
- **Modals**: Bottom sheet or full-screen
- **Touch targets**: ≥44px

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- All interactive elements accessible via Tab
- Combobox: Arrow keys, Enter, Esc
- Tabs: Arrow keys to navigate
- Modals: Focus Trap (Tab cycles within), Esc to close

### ARIA Labels
- Tables: `aria-label` on table element
- Status badges: `aria-label` with full status text
- Combobox: `role="combobox"`, `aria-expanded`
- Modal: `aria-modal="true"`, `role="dialog"`, `aria-labelledby`
- Form errors: `role="alert"`, `aria-describedby`, `aria-invalid`

### Screen Reader Support
- Status changes announced with `aria-live="polite"`
- Error messages linked to inputs
- Modal titles properly labeled

---

## Performance Targets

### PROMPT 7 Requirements
- **Dashboard LCP**: ≤2000ms (p95)
- **Badge visibility change**: ≤1 hour (cache revalidate)
- **Hidden after revoke**: ≤10 minutes
- **Table pagination**: Server-side (10-20 per page)

---

## TODO: Future Firestore Integration

### Collections to Create

**1. `badges` collection**
```typescript
{
  id: string;
  si_partner_id: string;
  manufacturer_id: string;
  issued_at: Timestamp;
  expires_at: Timestamp;
  is_active: boolean;
  revoked_at?: Timestamp;
  revoke_reason?: string;
  issue_memo?: string;
  created_by: string; // admin user ID
}
```

**2. `partner_proposals` collection**
```typescript
{
  id: string;
  manufacturer_id: string;
  si_partner_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sent_at: Timestamp;
  deadline: Timestamp; // sent_at + 5 business days
  responded_at?: Timestamp;
  response_reason?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Firestore Security Rules

```javascript
// Manufacturer can only read/write their own badges and proposals
match /badges/{badgeId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth.token.role == 'manufacturer'
                        && request.resource.data.manufacturer_id == request.auth.uid;
  allow delete: if false; // Never delete, only revoke
}

match /partner_proposals/{proposalId} {
  allow read: if request.auth != null 
              && (resource.data.manufacturer_id == request.auth.uid 
                  || resource.data.si_partner_id == request.auth.uid);
  allow create: if request.auth.token.role == 'manufacturer'
                && request.resource.data.manufacturer_id == request.auth.uid;
  allow update: if request.auth.token.role == 'si_partner'
                && resource.data.si_partner_id == request.auth.uid
                && resource.data.status == 'pending'
                && request.resource.data.status in ['accepted', 'rejected'];
}

// SI partner can only read badges/proposals addressed to them
match /badges/{badgeId} {
  allow read: if request.auth != null 
              && (resource.data.si_partner_id == request.auth.uid 
                  || request.auth.token.role == 'manufacturer');
}
```

### Firestore Indexes

```
Collection: badges
- (manufacturer_id, is_active, expires_at) — for dashboard queries
- (si_partner_id, is_active, expires_at) — for SI badge listing

Collection: partner_proposals
- (manufacturer_id, status, sent_at DESC) — for manufacturer proposal list
- (si_partner_id, status, deadline) — for SI proposal list with deadlines
```

### Cloud Functions

**1. `onBadgeRevoked` (Trigger)**
```typescript
functions.firestore.document('badges/{badgeId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Detect revocation
    if (!before.revoked_at && after.revoked_at) {
      // Update si_profiles to remove badge from display
      // Send notification to SI partner
      await createNotification({
        recipient_id: after.si_partner_id,
        type: 'badge',
        title: '뱃지 철회 알림',
        body: `${after.manufacturer_name}의 인증 뱃지가 철회되었습니다.`,
      });
    }
  });
```

**2. `onProposalResponded` (Trigger)**
```typescript
functions.firestore.document('partner_proposals/{proposalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Detect response
    if (before.status === 'pending' && after.status !== 'pending') {
      // Notify manufacturer
      await createNotification({
        recipient_id: after.manufacturer_id,
        type: 'proposal',
        title: after.status === 'accepted' ? '제안 수락됨' : '제안 거절됨',
        body: `${after.si_partner_name}이(가) 제안에 ${after.status === 'accepted' ? '수락' : '거절'}했습니다.`,
      });
      
      // If accepted, auto-issue badge
      if (after.status === 'accepted') {
        await firestore.collection('badges').add({
          si_partner_id: after.si_partner_id,
          manufacturer_id: after.manufacturer_id,
          issued_at: admin.firestore.FieldValue.serverTimestamp(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          is_active: true,
        });
      }
    }
  });
```

**3. Scheduled Functions**

**`expireBadges` (Daily cron)**
```typescript
// Run daily at 00:00 UTC
exports.expireBadges = functions.pubsub.schedule('0 0 * * *')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const expiredBadges = await firestore.collection('badges')
      .where('is_active', '==', true)
      .where('expires_at', '<', now)
      .get();
    
    const batch = firestore.batch();
    expiredBadges.forEach(doc => {
      batch.update(doc.ref, { is_active: false });
    });
    await batch.commit();
  });
```

**`expireProposals` (Daily cron)**
```typescript
// Run daily at 00:00 UTC
exports.expireProposals = functions.pubsub.schedule('0 0 * * *')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const expiredProposals = await firestore.collection('partner_proposals')
      .where('status', '==', 'pending')
      .where('deadline', '<', now)
      .get();
    
    const batch = firestore.batch();
    expiredProposals.forEach(doc => {
      batch.update(doc.ref, { status: 'expired' });
    });
    await batch.commit();
  });
```

---

## Testing Scenarios

### Manufacturer Portal

**Badge Issuance - Happy Path**:
1. Manufacturer logs in → navigates to /manufacturer/badges
2. Clicks "뱃지 발급"
3. Searches for SI partner (e.g., "서울 로보틱스")
4. Selects expiry date (1 year from now)
5. Enters memo "우수 파트너"
6. Clicks "뱃지 발급"
7. Success toast appears
8. Badge appears in table with "활성" status

**Badge Issuance - Duplicate Error**:
1. Attempt to issue badge to SI that already has active badge
2. Error toast: "이미 활성 뱃지가 존재합니다"

**Badge Revocation**:
1. Click "철회" on active badge
2. Modal opens with warning
3. Enter reason: "품질 기준 미달로 인한 철회"
4. Confirm
5. Badge status changes to "철회됨"
6. SI partner receives notification

**Proposal Sending**:
1. Navigate to /manufacturer/proposals
2. Click "파트너 제안 발송"
3. Select SI partner (prioritized: those without badges)
4. Enter message
5. Submit
6. Proposal appears in "대기 중" tab
7. Deadline shows "D-5"

### SI Partner Portal

**Profile Editing**:
1. SI partner logs in → navigates to /partner/profile
2. Clicks "수정" button
3. Updates completed_projects to 50
4. Success rate auto-updates to new percentage
5. Clicks "저장"
6. Success toast
7. Edit mode exits

**Proposal Accept**:
1. Navigate to /partner/proposals
2. Pending proposal visible with "D-3" deadline
3. Click "수락"
4. Confirmation modal shows manufacturer details
5. Confirm
6. Status changes to "수락됨"
7. Badge auto-issued (visible in /partner/badges)
8. Toast: "파트너십이 체결되었습니다!"

**Proposal Reject**:
1. Click "거절" on pending proposal
2. Modal opens
3. Enter reason: "현재 다른 제조사와 협력 중입니다"
4. Confirm
5. Status changes to "거절됨"
6. Manufacturer notified

**Badge Expiry Warning**:
1. Navigate to /partner/badges
2. Badge with D-5 expiry shows yellow warning banner
3. Text: "만료 임박 - 뱃지가 곧 만료됩니다"

---

## Analytics Events (TODO)

Track the following events in Firebase Analytics:

**Manufacturer Events**:
1. `badge_issued` - Params: manufacturer_id, si_partner_id, expiry_date
2. `badge_revoked` - Params: badge_id, reason_length
3. `proposal_sent` - Params: manufacturer_id, si_partner_id, has_message
4. `manufacturer_dashboard_view` - Params: active_partners_count

**SI Partner Events**:
1. `proposal_accepted` - Params: proposal_id, manufacturer_id
2. `proposal_rejected` - Params: proposal_id, has_reason
3. `profile_updated` - Params: fields_changed
4. `badge_viewed` - Params: badge_count, active_count

---

## Summary

PROMPT 7 successfully implements:

✅ **Manufacturer Portal** with dashboard, badge management, and proposal sending
✅ **SI Partner Portal** with profile editing, proposal responses, and badge viewing
✅ Badge lifecycle management (issue, expire, revoke)
✅ Proposal workflow (send, accept, reject, expire)
✅ Auto-badge issuance on proposal acceptance
✅ Expiry warnings (D-7 for badges, D-2 for proposals)
✅ Duplicate prevention (badges and proposals)
✅ Full WCAG 2.1 AA accessibility
✅ Responsive design (desktop/tablet/mobile)
✅ Combobox search with keyboard navigation
✅ DatePicker with Korean locale
✅ Status-based tabs with counts
✅ Real-time success rate calculation
✅ Mock data layer ready for Firestore migration

The portals provide a complete partner ecosystem management tool for manufacturers and SI partners to establish and maintain certified partnerships.
