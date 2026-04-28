# AI Project Knowledge (Robot Platform Prototype V2)

@CONTEXT: Front-end prototype for a Robot-as-a-Service (RaaS) platform. Focuses on Role-Based Access Control (RBAC) and high-quality UI/UX (Tailwind + Shadcn/ui).

## Architecture & Conventions
- **Routing**: `react-router` mapped in `src/app/App.tsx`. Uses `<RouteGuard>` for authentication.
- **State**: `src/contexts/AuthContext.tsx` holds `user`, `role`, `isAuthenticated`.
- **Styling**: `shadcn/ui` components (in `src/app/components/ui`). Strict adherence to "Premium Dynamic" aesthetics: large tracking-tighter typography for metrics, subtle gradient group-hovers, `-translate-y-1` lifts.
- **Config**: `src/config/navigation.ts` handles all role-based paths and label mappings. NO HARDCODED ROLES in UI components.

## Key Abstractions
1. **KpiCard** (`src/app/components/dashboard/KpiCard.tsx`): Reusable metric card. Must be used for ALL dashboard statistics.
2. **PricingPlanCard** (`.../calculator/PricingPlanCard.tsx`): Specialized card for CAPEX/Lease/RaaS comparisons.
3. **useCalculatorData** (`src/hooks/useCalculatorData.ts`): Example of logic decoupling. Handles form validation (`zod`, `react-hook-form`), state, and mock API calls.

## AI Guidelines for Future Edits
- **DO NOT prop-drill `role`**. Always use `useAuth()` context.
- **When adding pages**: Register path in `navigation.ts`, then add Route in `App.tsx` wrapped in `<RoleLayout>`.
- **When adding metrics**: Reuse `KpiCard`. If custom UI (like progress bars) is needed, copy the "Option 2" hover gradient CSS string from `SiPartnerDetail.tsx` to maintain visual consistency.
- **File Headers**: ALL new `.tsx`/`.ts` files MUST have the file name on line 1 (`// Filename.ts`) followed by a JSDoc block describing the file overview.
- **Function Headers**: Add JSDoc to describe props/purpose before exporting functions.
