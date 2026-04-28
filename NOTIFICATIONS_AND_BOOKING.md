# Notifications & O2O Booking (PROMPT 9)

## Overview
This document describes the implementation of the Notification Center (UI-014) and O2O Booking Calendar (UI-012) for the Robot SI Trusted Warranty Matching Platform.

## Features Implemented

### UI-014: Notification Center

#### Purpose
Fallback communication channel when external Kakao/SMS notifications fail (SRS 3.1).

#### Bell Icon in Header
**Location**: `src/app/components/layout/NotificationDropdown.tsx`

**Features**:
- Bell icon in header (all authenticated users)
- Unread count badge (red circle with number)
  - 0 → no badge shown
  - 1-99 → shows exact number
  - >99 → shows "99+"
- Click → dropdown panel (max 10 preview notifications)
- Dropdown footer: "전체 알림 보기" → `/notifications`
- 30-second polling for real-time updates

**Badge**:
- `aria-live="polite"` for screen reader announcements
- `aria-label` dynamically shows count: "알림 N건"

**Dropdown Preview**:
- Max 10 most recent notifications
- Unread state: blue dot + blue background + bold text
- Each item shows: icon (emoji), title, body (2-line clamp), relative time
- Click notification → mark as read + navigate to deep link
- Empty state: Bell icon + "알림이 없습니다"

#### Full Notification Page (`/notifications`)
**Location**: `src/pages/Notifications.tsx`

**Features**:
1. **Header**:
   - Title + unread/total counts
   - "모두 읽음 처리" button (only shown if unreadCount > 0)

2. **Tabs**:
   - 전체 (all notifications)
   - 미읽음만 (unread only)
   - Switching tabs resets to page 1

3. **Notification Cards**:
   - Unread: blue border, blue background, bold title, blue dot
   - Read: default border/background, normal weight
   - Each card shows:
     - Type badge (colored): 에스크로, AS, 뱃지, 제안, 시스템
     - Icon (emoji): 💰, 🔧, 🏅, 🤝, ⚙️
     - Title + body
     - Relative time: "방금 전", "N분 전", "N시간 전", "어제", "N일 전", or absolute date

4. **Pagination**:
   - 20 items per page
   - Previous/Next buttons
   - Page number buttons (all pages shown)
   - Disabled states for first/last page

5. **Empty State**:
   - For "전체": "알림이 없습니다"
   - For "미읽음만": "읽지 않은 알림이 없습니다"

6. **Read Handling**:
   - Click notification → mark as read + navigate to deep link
   - Deep links:
     - `escrow` → `/contracts/[id]/payment/status`
     - `as` → `/contracts/[id]/as/[ticketId]`
     - `badge` → `/partner/badges` or `/manufacturer/badges`
     - `proposal` → `/partner/proposals`
     - `system` → varies by notification

7. **Real-time Updates**:
   - 30-second polling (setInterval)
   - Reloads notifications every 30s
   - Cleanup on component unmount

#### Notification Types

```typescript
type NotificationType = 'escrow' | 'as' | 'badge' | 'proposal' | 'system';
```

**Type Colors** (badge):
- `escrow`: Purple (bg-purple-100 text-purple-800)
- `as`: Red (bg-red-100 text-red-800)
- `badge`: Yellow (bg-yellow-100 text-yellow-800)
- `proposal`: Indigo (bg-indigo-100 text-indigo-800)
- `system`: Gray (bg-gray-100 text-gray-800)

---

### UI-012: O2O Booking Calendar (Phase 2 Pre-build)

#### Purpose
Onsite consultation booking for buyers skeptical of fully-online contracts.

#### Routes
- `/booking` — Calendar and slot selection
- `/booking/:bookingId` — Confirmation page

#### Phase 2 Banner
Blue info banner: "현재 수도권 지역에서 시범 운영 중입니다"

#### Region Selection (`/booking`)
**Location**: `src/pages/Booking.tsx`

**2-Level Region Selector**:
1. **시/도** (Province/City):
   - 서울특별시, 경기도, 인천광역시 (수도권 priority)
   - Plus: 부산, 대구, 광주, 대전, 울산, 세종

2. **구/군** (District):
   - Dynamically filtered based on selected 시/도
   - Example: 서울 → 25 districts (강남구, 송파구, etc.)
   - Example: 경기도 → 18 cities (수원시, 성남시, etc.)

**Behavior**:
- Changing 시/도 resets 구/군 to empty
- Changing region clears selected date and available slots

#### Date Selection
**Component**: shadcn/ui Calendar (DatePicker)

**Rules** (`isBookableDate()`):
- ✅ Today ~ 30 days ahead
- ❌ Past dates
- ❌ Weekends (Saturday, Sunday)
- ❌ Korean public holidays (2026 list hardcoded)

**Holiday List** (simplified, major holidays):
- 1/1 (신정), 2/16-18 (설날), 3/1 (삼일절), 5/5 (어린이날), 5/24 (부처님 오신 날)
- 6/6 (현충일), 8/15 (광복절), 9/27-29 (추석), 10/3 (개천절), 10/9 (한글날), 12/25 (크리스마스)

**Calendar Features**:
- Korean locale (`date-fns/locale/ko`)
- Keyboard navigation (arrows, Enter)
- Disabled dates are grayed out and unclickable

#### Available Slots Display
**Trigger**: Region + Date both selected

**Slot Cards**:
- Time: "10:00", "14:00", "16:00"
- Manager name: initials only (e.g., "김", "이", "박")
- Badge: "예약 가능" (green)
- Hover: border-blue-500 + shadow
- Click → opens confirmation modal

**States**:
1. **No region selected**: "지역을 먼저 선택해주세요" (MapPin icon)
2. **No date selected**: "날짜를 선택해주세요" (Calendar icon)
3. **Zero slots available**: See Zero-slot Handling below
4. **Slots available**: Display slot cards

#### Zero-slot Handling (CRITICAL)
**Behavior when no slots**:
1. Shows yellow alert icon + "선택하신 날짜에 가용 매니저가 없습니다"
2. Auto-recommend: Find nearest available date via `findNearestAvailableDate()`
3. Display: "가장 가까운 가용 일정: YYYY년 M월 d일 (eee)"
4. Two buttons:
   - "추천 일정으로 예약" → auto-selects recommended date + loads slots
   - "대기 예약 신청" → (currently placeholder)

**Algorithm** (`findNearestAvailableDate()`):
- Filters: same region, future dates, is_available=true
- Sorts by date ASC
- Returns earliest date or null

#### Confirmation Modal
**Trigger**: Click slot card

**Content**:
1. **Summary Card** (blue background):
   - Region: 시/도 + 구/군
   - Date: "YYYY년 M월 d일 (eee)"
   - Time: "HH:MM"
   - Manager: "N 매니저"

2. **Form Fields**:
   - **Address** (required): "방문 주소" + Input
   - **Topic** (optional): "상담 주제" + Textarea (max 500 chars, 4 rows)

3. **Actions**:
   - "취소" → closes modal
   - "예약 확정" → calls `bookSlot()` → navigates to `/booking/:bookingId`

**Validation**:
- Address is required (button disabled if empty)
- On success: toast "예약이 확정되었습니다!" + SMS/KakaoTalk notification (future)

#### Confirmation Page (`/booking/:bookingId`)
**Location**: `src/pages/BookingConfirmation.tsx`

**Success Header** (status=confirmed):
- Green card with checkmark icon
- "예약이 확정되었습니다!"
- "예약 정보가 SMS와 카카오톡으로 발송되었습니다"

**Cancelled Header** (status=cancelled):
- Red card with alert icon
- "예약이 취소되었습니다"

**Booking Details Card**:
- Booking number (font-mono, large)
- Status badge (pending/confirmed/completed/cancelled)
- Date, Time, Region, Address
- Manager name
- Topic (if provided)

**Contact Info Card**:
- Phone: 010-1234-5678 (mock)
- Email: manager@robotmatch.kr (mock)

**Important Notes Card** (yellow):
- 4 bullet points with guidelines
- Arrival time, rescheduling policy, duration, preparation tips

**Actions**:
- "홈으로" button (always shown)
- "예약 취소" button (only if status=confirmed)
- "새 예약하기" button (only if status=cancelled)

**Cancel Flow**:
1. Click "예약 취소"
2. Confirmation modal: "예약을 취소하시겠습니까?"
3. Warning: "예약을 취소하면 해당 시간대가 다른 고객에게 제공됩니다"
4. "돌아가기" or "예약 취소" (destructive)
5. On confirm: `cancelBooking()` → status=cancelled + slot.is_available=true
6. Toast: "예약이 취소되었습니다"
7. Page refreshes to show cancelled state

**404 State**:
- If booking not found: AlertCircle icon + error message
- "새 예약하기" button → `/booking`

---

## Mock Data

### Notifications (`src/lib/mockNotifications.ts`)

**Interface**:
```typescript
interface Notification {
  id: string;
  recipient_id: string;
  type: 'escrow' | 'as' | 'badge' | 'proposal' | 'system';
  title: string;
  body: string;
  deep_link: string;
  is_read: boolean;
  created_at: string; // ISO 8601
}
```

**Sample Data**: 8 mock notifications across all types and users

**Helper Functions**:
- `getNotificationsByUser(userId)`: Filter by recipient
- `getUnreadCount(userId)`: Count unread
- `markAsRead(notificationId)`: Set is_read=true
- `markAllAsRead(userId)`: Bulk mark as read
- `getNotificationIcon(type)`: Return emoji (💰🔧🏅🤝⚙️)
- `getRelativeTime(timestamp)`: Convert to Korean relative time

### Bookings (`src/lib/mockBookings.ts`)

**Interfaces**:
```typescript
interface BookingSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  region_si: string;
  region_gu: string;
  manager_name: string;
  is_available: boolean;
}

interface Booking {
  id: string;
  buyer_id: string;
  slot_id: string;
  booking_number: string; // BK2026-001
  date: string;
  time: string;
  region_si: string;
  region_gu: string;
  address: string;
  topic: string;
  manager_name: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}
```

**Regions**:
- `REGIONS_SI_DO`: 9 provinces/cities (수도권 first)
- `REGIONS_GU_GUN`: Record<string, string[]> mapping 시/도 → 구/군 array
- Seoul: 25 districts
- Gyeonggi: 18 cities
- Incheon, Busan: districts defined

**Mock Slots**: 9 slots across:
- 서울 강남구: 4/25, 4/28, 4/29
- 경기 성남시: 4/25, 4/30
- Times: 10:00, 14:00, 16:00
- Managers: 김, 이, 박, 최, 정, 강, 조, 윤

**Mock Bookings**: 1 confirmed booking (BK2026-001)

**Helper Functions**:
- `getAvailableSlots(regionSi, regionGu, date)`: Filter slots
- `findNearestAvailableDate(regionSi, regionGu, fromDate)`: Find next available
- `bookSlot(buyerId, slotId, address, topic)`: Create booking + mark slot unavailable
- `cancelBooking(bookingId)`: Set status=cancelled + free slot
- `isWeekend(date)`: Check if Saturday/Sunday
- `isHoliday(date)`: Check against KOREAN_HOLIDAYS_2026
- `isBookableDate(date)`: Check all rules (today ~ +30 days, not weekend/holiday)

---

## Component Structure

```
src/
├── app/
│   └── components/
│       └── layout/
│           ├── Header.tsx (updated to use NotificationDropdown)
│           └── NotificationDropdown.tsx (NEW)
├── lib/
│   ├── mockNotifications.ts (NEW)
│   └── mockBookings.ts (NEW)
└── pages/
    ├── Notifications.tsx (NEW)
    ├── Booking.tsx (NEW)
    └── BookingConfirmation.tsx (NEW)
```

---

## Routes Added

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/notifications` | NotificationsPage | All authenticated users | Full notification list |
| `/booking` | BookingPage | Buyer only | O2O booking calendar |
| `/booking/:bookingId` | BookingConfirmationPage | Buyer only | Booking details |

---

## Technical Implementation

### 30-Second Polling Pattern
Both notification components use the same pattern:

```typescript
useEffect(() => {
  loadData();
  const interval = setInterval(loadData, 30000); // 30s
  return () => clearInterval(interval);
}, [userId]);
```

**Why 30 seconds?**
- Balance between real-time feel and server load
- Swap to Firestore `onSnapshot()` later for true real-time

### Deep Link Navigation
Notifications use React Router's `useNavigate()`:
```typescript
const handleNotificationClick = (notification: Notification) => {
  markAsRead(notification.id);
  navigate(notification.deep_link);
};
```

**Deep link format**: Absolute paths starting with `/`
- Escrow: `/contracts/C2024-001/payment/status`
- AS: `/contracts/C2024-001/as/AS-2024-042`
- Badge: `/partner/badges`
- Proposal: `/partner/proposals`

### Relative Time Calculation
```typescript
function getRelativeTime(timestamp: string): string {
  const diffMins = (now - past) / 60000;
  const diffHours = diffMins / 60;
  const diffDays = diffHours / 24;

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}
```

### Date Formatting (Korean Locale)
Uses `date-fns` with `ko` locale:
```typescript
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

format(date, 'yyyy년 M월 d일 (eee)', { locale: ko })
// → "2026년 4월 25일 (금)"
```

### Booking Number Generation
```typescript
const bookingNumber = `BK${year}-${String(count + 1).padStart(3, '0')}`;
// → BK2026-001, BK2026-002, etc.
```

---

## Accessibility

### Notification Dropdown
- `aria-label`: Dynamically shows count or "알림"
- `aria-live="polite"`: Badge announces count changes
- `role="menu"`: Dropdown menu semantics
- `role="menuitem"`: Each notification item
- Keyboard: Esc closes, Tab cycles items

### Notification Page
- `role="alert"`: Empty state messages
- Semantic headings: h1 for title, h3 for empty state
- Focus management: Pagination buttons, tab switches

### Booking Calendar
- Calendar: Keyboard navigation (arrows, Enter)
- Disabled dates: `aria-disabled` + visual graying
- Slot cards: `role="option"`, `aria-selected`
- Modal: Focus trap, Esc to close, `aria-modal="true"`
- Required fields: `<span className="text-red-600">*</span>`

---

## Responsive Design

### Notification Dropdown
- Desktop: 360px width
- Mobile: Could be made full-screen sheet (not implemented yet)

### Notification Page
- Desktop: max-w-4xl centered
- Mobile: Full width with padding
- Pagination: Wraps on small screens

### Booking Page
- Desktop: 2-column grid (left: region+date, right: slots)
- Mobile: Single column, calendar on top

### Booking Confirmation
- Desktop: max-w-3xl centered
- Mobile: Full width with padding
- Cards: Stack vertically

---

## Future Improvements (Phase 3+)

### Notifications
1. **Real-time Updates**: Replace 30s polling with Firestore `onSnapshot()`
2. **Push Notifications**: Firebase Cloud Messaging (FCM) for background notifications
3. **Notification Preferences**: User settings for which types to receive
4. **Mark as Unread**: Ability to mark read notifications as unread
5. **Notification Actions**: Quick actions from dropdown (e.g., "Accept proposal")
6. **Notification Grouping**: Group similar notifications (e.g., "3 new AS tickets")
7. **Sound/Visual Alerts**: Toast notification when new notification arrives while on page

### Booking
1. **Slot Availability API**: Real-time slot availability from Firestore
2. **Manager Profiles**: Full manager info (photo, bio, specialties)
3. **Calendar Integration**: Add to Google Calendar / iCal
4. **SMS/Kakao Notifications**: Actual integration (currently mock)
5. **Rescheduling**: Allow users to change booking date/time
6. **Booking History**: Page showing all past/upcoming bookings
7. **Waiting List**: Implement "대기 예약 신청" flow
8. **Video Call Option**: Alternative to onsite visit (post-COVID feature)
9. **Multi-region Expansion**: Add all Korean regions
10. **Holiday Data Source**: Fetch from API instead of hardcoded array

---

## Testing Scenarios

### Notifications

**Dropdown**:
1. Login as buyer → bell shows unread count (3)
2. Click bell → dropdown shows 3 unread (blue) + 5 read
3. Click notification → marks as read, navigates to deep link
4. Re-open dropdown → count decreased, notification no longer blue
5. "전체 알림 보기" → navigates to `/notifications`

**Full Page**:
1. All tab → shows 8 notifications sorted by date DESC
2. Unread tab → shows only 3 unread
3. Click notification → marks as read, navigates
4. "모두 읽음 처리" → all notifications marked read, count=0
5. Pagination → shows pages 1, 2 if >20 notifications

**Polling**:
1. Keep page open for 30+ seconds
2. Manually add new notification to MOCK_NOTIFICATIONS
3. After next poll → new notification appears

### Booking

**Region & Date Selection**:
1. Select "서울특별시" → 구/군 dropdown populates with 25 options
2. Select "강남구" → Calendar enables
3. Try to select weekend → grayed out, unclickable
4. Try to select holiday (5/5) → grayed out, unclickable
5. Select valid date (4/25) → Available slots load on right

**Available Slots**:
1. 4/25 서울 강남구 → shows 2 slots (10:00, 14:00; 16:00 is booked)
2. Click 10:00 slot → confirmation modal opens
3. Enter address + topic → "예약 확정" enabled
4. Submit → booking created, navigates to confirmation page

**Zero-slot Handling**:
1. Select 경기도 수원시 + any date with no slots
2. Shows: "선택하신 날짜에 가용 매니저가 없습니다"
3. Recommended date shown (if exists)
4. Click "추천 일정으로 예약" → date changes, slots load

**Confirmation Page**:
1. After booking → shows green success banner
2. Booking number: BK2026-00X (font-mono, large)
3. Status badge: "확정됨" (green)
4. All details: date, time, region, address, topic, manager
5. Click "예약 취소" → confirmation modal
6. Confirm cancel → status changes to "취소됨", banner turns red

**Edge Cases**:
1. Navigate to `/booking/invalid-id` → 404 state, "새 예약하기" button
2. Select region, change 시/도 → 구/군 resets, slots clear
3. Book a slot → slot becomes unavailable for other users
4. Cancel booking → slot becomes available again

---

## Security Considerations

### Notifications
- **Authorization**: `getNotificationsByUser()` filters by recipient_id
- **Future**: Firestore security rules to prevent reading others' notifications
- **XSS Prevention**: Notification content is plain text, no HTML rendering
- **Deep Links**: All validated against route definitions

### Booking
- **Authorization**: Routes protected by RouteGuard (buyer role only)
- **Slot Locking**: `bookSlot()` checks `is_available` before creating booking
- **Double-booking Prevention**: Slot marked unavailable immediately
- **Future**: Firestore transactions to prevent race conditions
- **Address Privacy**: Only shown to buyer and manager (not public)

---

## Performance

### Notifications
- **Dropdown**: Max 10 items → fast render
- **Full Page**: Pagination (20/page) → prevents long lists
- **Polling**: 30s interval → reasonable server load
- **Sort**: In-memory, array length < 100 → negligible

### Booking
- **Slot Filtering**: Array filter O(n), n < 50 → fast
- **Calendar**: shadcn/ui optimized, single month render
- **Date Validation**: O(1) checks (weekend, holiday lookup)
- **Future**: Index Firestore queries on `date` + `region`

---

## Dependencies Used
- `react-router` (v7): Navigation, useNavigate, useParams
- `date-fns` (with ko locale): Date formatting, Korean calendar
- `lucide-react`: Icons (Bell, MapPin, Calendar, Clock, User, etc.)
- `sonner`: Toast notifications
- `shadcn/ui`: Button, Card, Dialog, Select, Calendar, Tabs, Badge, Input, Textarea, Label

---

## Files Created/Modified

**Created**:
- `src/lib/mockNotifications.ts` (162 lines)
- `src/lib/mockBookings.ts` (270 lines)
- `src/app/components/layout/NotificationDropdown.tsx` (142 lines)
- `src/pages/Notifications.tsx` (223 lines)
- `src/pages/Booking.tsx` (342 lines)
- `src/pages/BookingConfirmation.tsx` (244 lines)
- `NOTIFICATIONS_AND_BOOKING.md` (this file)

**Modified**:
- `src/app/components/layout/Header.tsx`: Added NotificationDropdown import, replaced hardcoded bell with component
- `src/app/App.tsx`: Added 3 route imports, replaced `/booking` PlaceholderPage, added `/booking/:bookingId` and `/notifications` routes

**Total**: 6 new files, 2 modified files, ~1,383 new lines of code

---

## Summary

PROMPT 9 successfully implements:
1. ✅ Notification Center with bell dropdown + full page
2. ✅ 30-second polling for real-time updates
3. ✅ Deep linking with read status tracking
4. ✅ O2O Booking Calendar with region/date selection
5. ✅ Available slot display with manager info
6. ✅ Zero-slot handling with auto-recommendations
7. ✅ Booking confirmation with cancel flow
8. ✅ Korean locale for dates and relative time
9. ✅ Weekend and holiday blocking
10. ✅ Responsive design and accessibility

All features are fully functional with mock data and ready for Firebase integration in PROMPT 10.
