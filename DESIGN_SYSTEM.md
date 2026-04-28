# Design System - Robot SI Trusted Warranty Matching Platform

## Overview
This document describes the unified design system for the Robot SI Trusted Warranty Matching Platform prototype. All 15 screens (UI-001 through UI-015) follow these guidelines to create a cohesive, demo-ready experience.

---

## Color Tokens

### Primary (Trust Blue)
Used for platform identity, CTAs, and safety/escrow signals.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | #EFF6FF | Lightest backgrounds |
| `primary-500` | #3B82F6 | Standard primary |
| `primary-600` | #2563EB | Default buttons, links |
| `primary-700` | #1D4ED8 | Hover states |

**Tailwind**: Use `bg-primary-600`, `text-primary-700`, `border-primary-500`

### Semantic Colors

#### Success (검수 합격, SLA 충족, 예치 완료)
- **Background**: #ECFDF5 (`success-50`)
- **Text**: #10B981 / #059669 (`success-500`, `success-600`)

**Usage**: Completed contracts, passed inspections, SLA met, escrow released

#### Warning (D-3 이하, 만료 임박)
- **Background**: #FFFBEB (`warning-50`)
- **Text**: #F59E0B / #D97706 (`warning-500`, `warning-600`)

**Usage**: Deadlines, expiring badges, approaching SLA violations

#### Destructive (검수 거절, 철회, 분쟁)
- **Background**: #FEF2F2 (`destructive-50`)
- **Text**: #EF4444 / #DC2626 (`destructive-500`, `destructive-600`)

**Usage**: Rejected inspections, disputes, revoked badges, cancellations

#### Info (Admin 안내, 시스템 메시지)
- **Background**: #EEF2FF (`info-50`)
- **Text**: #6366F1 / #4F46E5 (`info-500`, `info-600`)

**Usage**: System notifications, admin banners, informational alerts

### Role-Specific Accent Colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Buyer | Blue | #2563EB | Sidebar headers, role badges |
| SI Partner | Purple | #8B5CF6 | Sidebar headers, role badges |
| Manufacturer | Cyan | #0891B2 | Sidebar headers, role badges |
| Admin | Slate | #334155 | Sidebar headers, authoritative tone |

### Tier Colors (SI 등급)

| Tier | Background | Text | Usage |
|------|------------|------|-------|
| Silver | #F1F5F9 | #94A3B8 | Entry tier |
| Gold | #FEF3C7 | #F59E0B | Mid tier |
| Diamond | #CFFAFE (gradient) | #06B6D4 | Premium tier |

### Neutral Grays

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | #FAFAFA | Page background (reduces eye strain) |
| `gray-200` | #E4E4E7 | Disabled states |
| `gray-300` | #D4D4D8 | Borders, dividers |
| `gray-500` | #71717A | Secondary text |
| `gray-700` | #3F3F46 | Body text, labels |
| `gray-900` | #18181B | Headings, primary text |

**Border Default**: #E5E7EB

---

## Typography

### Font Stack
```css
font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, 
             system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", 
             "Noto Sans KR", "Malgun Gothic", sans-serif;
```

**Korean Optimization**: `word-break: keep-all` to prevent awkward mid-word breaks

### Type Scale

| Style | Size / Line Height | Weight | Tailwind Class | Usage |
|-------|-------------------|--------|----------------|-------|
| Display | 36px / 44px | 700 | `text-display` | KPI numbers, hero stats |
| H1 | 28px / 36px | 700 | `text-h1` | Page titles |
| H2 | 22px / 30px | 600 | `text-h2` | Section titles |
| H3 | 18px / 26px | 600 | `text-h3` | Card titles |
| Body-LG | 16px / 24px | 400 | `text-body-lg` | Default body, paragraphs |
| Body | 14px / 20px | 400 | `text-sm` | Table rows, form fields |
| Caption | 12px / 16px | 500 | `text-caption` | Labels, metadata, timestamps |

### Weight Scale
- **Normal**: 400 (`font-normal`)
- **Medium**: 500 (`font-medium`)
- **Semibold**: 600 (`font-semibold`)
- **Bold**: 700 (`font-bold`)

---

## Spacing

**Base Unit**: 4px

| Token | Value | Tailwind |
|-------|-------|----------|
| spacing-1 | 4px | `space-1`, `p-1`, `gap-1` |
| spacing-2 | 8px | `space-2`, `p-2`, `gap-2` |
| spacing-3 | 12px | `space-3`, `p-3`, `gap-3` |
| spacing-4 | 16px | `space-4`, `p-4`, `gap-4` |
| spacing-6 | 24px | `space-6`, `p-6`, `gap-6` |
| spacing-8 | 32px | `space-8`, `p-8`, `gap-8` |
| spacing-12 | 48px | `space-12`, `p-12`, `gap-12` |

**Common Patterns**:
- Card internal padding: 24px (`p-6`)
- Section gap: 32px (`gap-8`)
- Page container: max-width 1280px, padding 24px

---

## Elevation (Shadows)

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-hover: 0 4px 12px rgba(0,0,0,0.08);
--shadow-modal: 0 20px 40px rgba(0,0,0,0.15);
--shadow-dropdown: 0 10px 25px rgba(0,0,0,0.10);
```

**Tailwind**: Use `shadow-card`, `shadow-hover`, `shadow-modal`, `shadow-dropdown` (defined in theme)

---

## Border Radius

| Component | Radius | CSS Variable | Tailwind |
|-----------|--------|--------------|----------|
| Button / Input | 8px | `--radius-sm` | `rounded-lg` |
| Card | 12px | `--radius-md` | `rounded-xl` |
| Modal | 16px | `--radius-lg` | `rounded-2xl` |
| Badge / Pill | 9999px | `--radius-full` | `rounded-full` |

---

## Component Library

### Buttons

**Variants**: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`

**Sizes**:
- `sm`: 32px height
- `md`: 40px height (default)
- `lg`: 48px height (mobile touch)

**States**:
- Default: `bg-primary-600 hover:bg-primary-700`
- Disabled: 50% opacity, `cursor-not-allowed`
- Loading: Spinner + "처리 중..." or contextual text

**Usage**:
```tsx
import { Button } from "@/app/components/ui/button";
import { LoadingButton } from "@/app/components/ui/loading-button";

<Button variant="default" size="md">계약 생성</Button>
<LoadingButton loading={isSubmitting} loadingText="저장 중...">
  저장
</LoadingButton>
```

### Form Fields

**Specs**:
- Label: 14px, weight 500, gray-700, 8px margin-bottom
- Input: 40px height (44px mobile), 12px horizontal padding
- Focus ring: 2px primary-500 with 2px offset
- Error state: border destructive, helper text destructive + AlertCircle icon
- Success state: subtle green checkmark icon in field right
- Required asterisk: destructive color

**Pattern**:
```tsx
<div className="space-y-2">
  <Label htmlFor="field">
    Label <span className="text-destructive-500">*</span>
  </Label>
  <Input id="field" aria-invalid={!!error} />
  {error && (
    <p className="text-sm text-destructive-600 flex items-center gap-1">
      <AlertCircle className="h-4 w-4" />
      {error.message}
    </p>
  )}
</div>
```

### Cards

**Specs**:
- White background
- 12px radius (`rounded-xl`)
- Shadow: `shadow-card`
- Padding: 24px (`p-6`)
- Hover (interactive): `card-interactive` class

**Pattern**:
```tsx
<Card className="card-interactive cursor-pointer">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Status Badges

**Usage**:
```tsx
import { StatusBadge } from "@/app/components/ui/status-badge";

<StatusBadge status="held" />           // 예치 완료
<StatusBadge status="accepted" />       // 수락됨
<StatusBadge status="urgent" showDot /> // 긴급 (with dot)
```

**Available Statuses**:
- Contract: `pending`, `active`, `completed`, `cancelled`, `expired`
- Escrow: `held`, `released`, `refunded`, `release_pending`
- Dispute: `disputed`
- Proposal: `accepted`, `rejected`
- AS Ticket: `reported`, `assigned`, `dispatched`, `resolved`
- Badge: `revoked`
- Priority: `urgent`, `normal`
- Inspection: `inspection_passed`, `inspection_failed`

### Tier Badges

**Usage**:
```tsx
import { TierBadge } from "@/app/components/ui/tier-badge";

<TierBadge tier="silver" />   // 실버 등급
<TierBadge tier="gold" />     // 골드 등급
<TierBadge tier="diamond" />  // 다이아몬드 등급
```

### Tables

**Specs**:
- Header row: bg-gray-50, weight 600, caption size (12px)
- Row hover: bg-gray-50
- Row height: 56px
- No alternating rows (clean design)
- Sortable columns: chevron icon right-aligned

**Zero State**:
```tsx
{items.length === 0 && (
  <div className="text-center py-16">
    <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">데이터가 없습니다</h3>
    <p className="text-gray-600">메시지...</p>
  </div>
)}
```

### Modals (Dialog)

**Specs**:
- Backdrop: `rgba(0,0,0,0.5)`, blur 4px
- Widths: sm (400px), md (560px), lg (720px)
- Header with close X
- Footer with right-aligned buttons
- Enter animation: fade + scale 0.95 → 1.0, 200ms ease-out
- Focus trap enabled
- ESC to close (except destructive confirmations)

**Pattern**:
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* Content */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        취소
      </Button>
      <Button onClick={handleSubmit}>확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toasts (Sonner)

**Specs**:
- Position: bottom-right desktop, bottom-full mobile
- Auto-dismiss: 4s (success/info), 6s (error)
- Types: success (green), error (red), info (blue), warning (amber)

**Usage**:
```tsx
import { toast } from "sonner";

toast.success("저장되었습니다");
toast.error("오류가 발생했습니다");
toast.info("알림: 새 메시지가 있습니다");
toast.warning("주의: 기한이 임박했습니다");
```

---

## Transitions & Animations

**Timing**:
- Fast: 150ms (hover, focus)
- Base: 200ms (default, button states, card hover)
- Slow: 300ms (modal open, page transitions)
- Timing function: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)

**Common Patterns**:
```css
/* Card hover */
transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Loading spinner */
animation: spin 1s linear infinite;
```

---

## Loading States

**Patterns**:
1. **Button Loading**: Use `LoadingButton` component
2. **Page Loading**: Skeleton screens with shimmer
3. **Data Fetching**: Spinner in empty state area
4. **Form Submission**: Disable form + loading button

**Skeleton Pattern**:
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

---

## Error Handling

**Form Errors**:
- Inline validation with red border + helper text
- AlertCircle icon + error message below field
- Required fields marked with red asterisk

**Toast Errors**:
- 6-second auto-dismiss
- Retry button for recoverable errors
- Clear error message in Korean

**Empty States**:
- Icon + heading + description
- Optional CTA button
- Gray color palette

---

## Accessibility

**Focus Management**:
- All interactive elements have visible focus rings (2px primary-500 offset 2px)
- Focus trap in modals
- Tab order follows visual flow

**ARIA**:
- `aria-label` on icon-only buttons
- `aria-invalid` on error fields
- `aria-live="polite"` on dynamic updates (badge counts, notifications)
- `aria-modal="true"` on dialogs

**Keyboard**:
- ESC closes modals/dropdowns
- Enter submits forms
- Arrow keys navigate calendars
- Tab cycles through interactive elements

**Screen Readers**:
- Semantic HTML (h1-h6, nav, main, footer)
- Descriptive button text (avoid "Click here")
- Loading states announced ("처리 중...")

---

## Responsive Design

**Breakpoints** (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

**Common Patterns**:
- Desktop: Sidebar + content layout
- Tablet: Collapsible sidebar
- Mobile: Bottom nav bar or hamburger menu
- Touch targets: Minimum 44px height on mobile

**Example**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

---

## File Structure

```
src/
├── styles/
│   ├── design-system.css    # Design tokens
│   ├── theme.css            # shadcn theme
│   ├── fonts.css            # Font imports
│   ├── tailwind.css         # Tailwind directives
│   └── index.css            # Main entry (imports all)
└── app/
    └── components/
        └── ui/
            ├── button.tsx           # Base button
            ├── loading-button.tsx   # Button with loading state
            ├── status-badge.tsx     # Status badges
            ├── tier-badge.tsx       # Tier badges
            ├── card.tsx             # Card component
            ├── dialog.tsx           # Modal
            └── ...                  # Other UI components
```

---

## Demo Checklist

Before presenting the prototype, verify:

- [ ] All 15 screens use consistent color tokens (no hardcoded hex values)
- [ ] Typography scale is uniform across all pages
- [ ] All buttons use LoadingButton or standard Button variants
- [ ] Status badges use StatusBadge component
- [ ] All forms have consistent label + input + error styling
- [ ] Cards have consistent padding (24px) and shadow
- [ ] Modals have backdrop blur and focus trap
- [ ] Toasts appear in bottom-right with correct auto-dismiss timing
- [ ] All loading states show spinners with Korean text
- [ ] Mock data is realistic and complete for end-to-end flow
- [ ] Responsive behavior tested on mobile/tablet/desktop
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus rings visible on all focusable elements
- [ ] ARIA labels present on icon-only buttons

---

## CSS Variables Quick Reference

```css
/* Colors */
--primary-600: #2563eb
--success-500: #10b981
--warning-500: #f59e0b
--destructive-500: #ef4444
--info-500: #6366f1

/* Typography */
--font-size-h1: 28px
--font-size-body: 14px
--font-size-caption: 12px

/* Spacing */
--spacing-6: 24px  /* Card padding */
--spacing-8: 32px  /* Section gap */

/* Radius */
--radius-sm: 8px   /* Button */
--radius-md: 12px  /* Card */
--radius-full: 9999px /* Badge */

/* Shadows */
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-hover: 0 4px 12px rgba(0,0,0,0.08)
```

---

## End-to-End Demo Flow

**Recommended walkthrough path**:

1. **Landing Page** (UI-001) → Click "SI 검색"
2. **SI Search** (UI-003) → Search → View SI detail
3. **SI Detail** (UI-004) → Tier badge, badges, contact
4. **Buyer Signup** (UI-002) → Complete registration
5. **Login** (UI-015) → Access buyer dashboard
6. **RaaS Calculator** (UI-010) → Compare pricing, request quote
7. **Escrow Payment** (UI-005) → Pay into escrow
8. **Inspection** (UI-006) → Pass inspection
9. **AS Request** (UI-007) → Create AS ticket
10. **AS Tracking** → Track ticket status
11. **Warranty Page** → View warranty details
12. **O2O Booking** (UI-012) → Book consultation
13. **Notifications** (UI-014) → Check notifications
14. **Admin Dashboard** (UI-008) → View KPIs, manage escrow
15. **Admin AS SLA** → Monitor SLA compliance

---

This design system ensures all 15 screens feel like a cohesive product, not 15 separate prototypes.
