# Mobile-Centric Frontend Build Prompt — AttendX Mobile

---

You are building a dedicated mobile-centric frontend for AttendX, an employee attendance management system. This is not a responsive version of the existing desktop frontend. This is a completely separate frontend application that lives in its own folder, has its own build pipeline, and is served exclusively to users on mobile devices (viewport width below 768px). The desktop frontend already exists and will continue to serve desktop users. Your job is to build the mobile experience from scratch as a standalone project.

Read every project document before writing code: `PRD.md` for features and business logic, `TRD.md` for API endpoints and response shapes, `APP_FLOW.md` for user flows and component states, and `RULES.md` for coding patterns. The mobile frontend talks to the exact same backend API — every endpoint, every request payload, every response format is identical. You are building a new face on the same body.

---

## Project Setup

Create a new folder at the project root called `mobile/`. This is a standalone Node.js project with its own `package.json`, its own dev server, and its own build output. It does not share code with the desktop `frontend/` folder. Structure it as follows:

```
mobile/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── attendance/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── navigation/
│   │   ├── shared/
│   │   └── ui/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── lib/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── DESIGN.md              ← Placeholder for design system (see below)
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
├── .env.example
└── package.json
```

**Tech stack for this folder:**

- React 19 + TypeScript 5
- Vite 6 as the build tool and dev server
- TailwindCSS 4 for styling
- ShadCN UI components (installed fresh into this project)
- @tanstack/react-query v5 for data fetching
- React Router 7 for routing
- framer-motion 11 for transitions and gestures
- zod 3 for validation
- date-fns 4 for dates
- react-hot-toast for notifications

Install all dependencies and configure the project so that `npm run dev` starts a working dev server on a port different from the desktop frontend (use port 5174).

---

## DESIGN.md — Placeholder for Design System Integration

Create the file `mobile/DESIGN.md` with the following content. This file is a placeholder that will later be replaced with a full design system document. When the real `DESIGN.md` is provided, you (or the next AI agent) must re-read it and update every component's styling to match. For now, follow the interim design direction written below.

```markdown
# DESIGN.md — AttendX Mobile Design System

## Status: PLACEHOLDER

This file will be replaced with the full design system document.
When the real DESIGN.md is attached to this directory, the AI agent
(Antigravity, Claude, or Gemini) must:

1. Read the new DESIGN.md in full before modifying any component.
2. Extract the color palette and map it to the CSS variables in globals.css.
3. Extract the typography choices and update tailwind.config.ts font families.
4. Extract the spacing system and enforce it across all components.
5. Extract the signature element and implement it on the primary interaction
   (the check-in experience).
6. Audit every component against the new design tokens and update them.
7. Do NOT change any functionality, routing, API calls, or business logic.
   Only change visual presentation.

## Interim Design Direction

Until the real DESIGN.md is provided, follow these principles:

**Philosophy:** This is a tool people open every morning and use for 30 seconds.
It must feel instant, effortless, and satisfying — like tapping a transit card,
not like navigating enterprise software. Every screen has one primary action and
everything else is secondary. No clutter. No walls of text. No feature overload.

**Color:** Use a neutral foundation (near-white backgrounds, soft grays for
secondary surfaces) with a single strong accent color for the primary action
(check-in/check-out button). Status colors: green for present, amber for late,
red for absent, slate for weekend/holiday. Dark mode: deep charcoal backgrounds,
not pure black.

**Typography:** Two weights of one clean sans-serif font is enough. Bold for
numbers, stats, and the timer. Regular for everything else. The live timer
should be the largest text element on the employee dashboard — it is the
hero of the mobile experience.

**Spacing:** Generous. Mobile screens have less space but fingers are bigger
than cursors. Touch targets minimum 44x44px. Card padding 16–20px. Gaps
between sections 24px. Page padding 16px horizontal. No cramming.

**Motion:** Page transitions (slide left/right for navigation, fade for modals).
Check-in button press animation (scale down on press, spring back on release).
Timer digit transitions (subtle roll or fade when digits change). Pull-to-refresh
on the dashboard. No gratuitous animation on every element.

**Shape:** Rounded corners (12–16px radius on cards, full-round on buttons
and avatars). Soft shadows (no hard box-shadows). No sharp edges anywhere.
```

This placeholder gives the AI enough direction to build a complete, good-looking mobile app right now, while making it trivially easy to swap in the real design system later without restructuring anything.

---

## Mobile Design Philosophy

Every design decision must answer one question: what does the person standing in the office lobby at 8:58 AM need to see and do? The answer is almost always: one big button, one clear status, and nothing else in the way.

The mobile app is not a shrunken desktop dashboard. It is a different product with different priorities:

**Desktop priority:** overview, analytics, tables, bulk actions, configuration.
**Mobile priority:** check in, check out, see today's status, glance at recent history.

Admin features on mobile are simplified. Admins on mobile need to see who is present today and approve pending employees. They do not need to generate reports, edit GPS coordinates, or browse audit logs on a phone. Those features exist on mobile for completeness but they are not optimized for — the desktop is.

---

## Page-by-Page Build Specification

### Login Page (`/login`)

A single full-screen page. The AttendX logo or wordmark at the top. A large "Sign in with Google" button in the center for employees. Below it, a subtle "Admin Login" text link that expands to reveal email and password fields. No tab bar. No split layout. The Google button is the primary path — make it obvious and inviting.

The admin login form (when expanded) has email input, password input with visibility toggle, and a "Sign In" button. Validation errors appear inline below each field. Lockout message replaces the form after 5 failures.

No navigation chrome on this page. Full bleed. The background should feel calm and professional — the first impression of the app.

### Onboarding Page (`/onboarding`)

A vertically scrolling form. Each field gets plenty of space. Field order from top to bottom: full name (pre-filled from Google, editable), email (shown but not editable, visually muted), department (native mobile select dropdown, not a custom dropdown — native selects are faster and more accessible on mobile), designation (text input), age (number input with native number keyboard via `inputMode="numeric"`), phone (text input with native phone keyboard via `inputMode="tel"`).

A sticky bottom bar with a single "Complete Registration" button that stretches full-width. This bar stays visible even as the user scrolls through the form. The button disables and shows a spinner during submission.

### Pending Approval Page (`/pending-approval`)

A centered card with a waiting illustration or icon (a clock, a checkmark outline). Title: "Waiting for approval." Subtitle: "Your admin will review your registration shortly." A subtle pulsing dot or animation to indicate the page is alive and checking. Auto-polls every 30 seconds. When approved, transitions to the dashboard with a success animation.

No navigation. No back button. This is a holding state — the user has nothing to do except wait.

### Employee Dashboard (`/dashboard`)

This is the core mobile experience. It must feel like a native app, not a web page.

**Layout — top to bottom:**

1. **Greeting bar.** Small, top of screen. "[Name]" on the left, notification bell on the right. No "Good morning" — space is precious on mobile. Just the name and the bell. Tapping the bell opens a notification sheet from the bottom.

2. **Status card.** Full-width card. This is the hero. It has three possible modes:

   *Mode A — Ready to check in:*
   A large circular or rounded-rectangle "Check In" button that fills most of the card. The current time displayed above it. A small "GPS verified" indicator with a green dot if location is confirmed. If GPS is pending, show a pulsing dot with "Locating...". If GPS failed or outside radius, the button is grayed out with a one-line explanation below it ("You're 340m from the office" or "Enable location access").

   *Mode B — Checked in, working:*
   The live timer dominates the card. Large, bold, monospace or tabular-number digits showing `HH:MM:SS`. Below it, the check-in time in smaller text ("Checked in at 9:02 AM"). Below that, a "Check Out" button (less prominent than check-in — a contained button, not a hero button). If the employee was late, a small amber badge: "Late by 47m."

   *Mode C — Day complete:*
   A completion state. "Done for the day" or a checkmark. Check-in time, check-out time, and total hours displayed cleanly. No action buttons. This card should feel satisfying — the work is done.

3. **Monthly snapshot.** A compact row of 4 stats: Present, Late, Absent, Attendance %. No card border — just the numbers with labels below them in a horizontal row. These update from `GET /api/attendance/monthly-stats`.

4. **Mini calendar.** A compact calendar grid for the current month. Days are small circles or squares, color-coded (green/amber/red/gray). Today has a ring. Tapping a day shows a small tooltip or bottom sheet with that day's details. This calendar must be touch-friendly — each day target at least 36px.

5. **Recent records.** A simple list (not a table) of the last 5 attendance records. Each item is a row: date on the left, status badge in the middle, hours on the right. Tapping a row could expand to show check-in/check-out times. No "View All" link — swipe up naturally to see more if pagination exists.

**The late reason dialog** (triggered when check-in response says `requires_late_reason: true`): A bottom sheet that slides up from the bottom (not a centered modal — those are desktop patterns). The sheet is undismissable (no swipe-to-close, no backdrop tap to close). Shows the delay text, a textarea, and a "Submit" button. The textarea must auto-focus so the mobile keyboard opens immediately.

**Pull-to-refresh.** Pulling down on the dashboard should refetch today's attendance and monthly stats. Use a native-feeling pull indicator (a subtle spinner that appears as you pull).

### Admin Dashboard (`/admin/dashboard`)

Simplified for mobile. Top to bottom:

1. **Summary cards.** A 2x2 grid of cards: Present, Late, Absent, Total. Each card is a number with a label. Color-coded left border or icon.

2. **Today's list.** A scrollable list of all employees with today's status. Each row: avatar, name, status badge, check-in time (or "—"). This list auto-refreshes every 60 seconds. A search bar at the top filters by name.

3. **Pending approvals.** If pending employees exist, a banner appears at the top of the page (above the summary cards) with "X employees pending approval" and a tap-to-view action. This navigates to the employees page filtered to pending.

### Admin Employees Page (`/admin/employees`)

A search bar at the top. Filter chips below it: All, Pending, Approved, Deactivated (horizontally scrollable chip bar). The employee list below as full-width cards. Each card shows name, department, designation, status badge. Pending cards have "Approve" and "Reject" buttons directly on the card. Tapping an approved employee opens a detail bottom sheet with their full profile and attendance summary.

### Admin Attendance Page (`/admin/attendance`)

A filter bar at the top: date picker (tapping opens the native date picker), employee dropdown, status filter. The results below as a list of cards, each showing: employee name, date, check-in/out times, hours, status badge. An "Export" button in the header opens a small menu (CSV or Excel).

### Admin Reports Page (`/admin/reports`)

Simple form: month picker, format selector (three buttons: PDF, CSV, Excel), and a "Generate" button. Below it, a list of previously generated reports with download buttons.

### Admin Settings Page (`/admin/settings`)

A vertically scrolling form identical in fields to the desktop version but laid out as single-column mobile form. Each section (Location, Timing, Working Days, Holidays) is a collapsible accordion or separate card. Save button is sticky at the bottom.

### Admin Audit Logs Page (`/admin/audit-logs`)

A simple reverse-chronological list. Each item shows: timestamp, action, user name. Tapping expands to show full details (resource, IP, metadata). Filterable by date range.

### Profile Page (`/profile`)

The user's avatar large at the top. Below it, their details in a form layout. Editable fields (name, phone) have edit icons that enable inline editing. Read-only fields (email, employee ID) are visually distinct (muted text, no edit icon). "Save Changes" button at the bottom, only visible when changes are made.

---

## Mobile Navigation

**Employee navigation:** A bottom tab bar with 3 tabs: Dashboard (home icon), History (calendar or clock icon), Profile (person icon). The dashboard is the default and primary tab. Three tabs only — no hamburger menus, no sidebars.

**Admin navigation:** A bottom tab bar with 5 tabs: Dashboard (home icon), Employees (people icon), Attendance (clipboard icon), More (three dots icon). The "More" tab opens a bottom sheet with: Reports, Settings, Audit Logs, Profile, Logout. Five tabs is the maximum for mobile — anything beyond that goes into the "More" sheet.

The active tab has a filled icon and the accent color. Inactive tabs have outline icons and muted color. Tab transitions use a horizontal slide animation.

---

## Mobile-Specific Technical Requirements

**Viewport.** Set the meta viewport tag: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">`. The `viewport-fit=cover` ensures the app fills the screen on notched devices. The `user-scalable=no` prevents accidental zoom during button presses.

**Safe areas.** The bottom tab bar must account for the home indicator on iPhones. Use `padding-bottom: env(safe-area-inset-bottom)` on the tab bar. The top greeting bar must account for the notch. Use `padding-top: env(safe-area-inset-top)`.

**Touch targets.** Every tappable element must be at least 44x44px. This is non-negotiable. Buttons, list items, calendar days, tab icons — all of them.

**Native inputs.** Use `inputMode="numeric"` for age and radius fields (opens number keyboard). Use `inputMode="tel"` for phone fields (opens phone keyboard). Use `inputMode="email"` for email fields. Use `type="date"` and `type="time"` for date and time pickers to trigger native mobile pickers instead of custom JavaScript date pickers.

**Performance.** Mobile networks are slower. Every API call must show a loading state immediately (within 100ms). Use React Query's `staleTime` and `gcTime` aggressively — the dashboard data doesn't change every second, so serve cached data instantly and refetch in the background. Images (avatars) must be lazy-loaded.

**PWA readiness.** Include a `manifest.json` with the app name, icons, theme color, and `"display": "standalone"`. This allows users to add the app to their home screen and it will open without the browser chrome, looking like a native app. Set the status bar color to match the app's background.

**Gesture support.** Use framer-motion's gesture system for: swipe between tabs (horizontal), pull-to-refresh on dashboard (vertical), swipe to dismiss bottom sheets. Every gesture must have visual feedback — the element follows the finger, not just reacting on release.

---

## Connection to Desktop Frontend

The backend must detect the user's device and serve the correct frontend. Add a detection layer (either at the reverse proxy level or in a small Express middleware) that checks the `User-Agent` header:

- Mobile user agents (containing "Mobile", "Android", "iPhone") → serve `mobile/dist/`
- Everything else → serve `frontend/dist/`

Alternatively, if both frontends are deployed separately (e.g., desktop on `app.attendx.com` and mobile on `m.attendx.com`), add a redirect on the desktop frontend that detects mobile viewports and redirects to the mobile URL, and vice versa.

Both frontends use the same `VITE_API_URL` pointing to the same backend. The backend does not know or care which frontend is calling it.

---

## What NOT to Build

Do not build a responsive version that serves both mobile and desktop. This is a separate mobile app. Do not import or reference any code from the desktop `frontend/` folder. Do not build tablet-specific layouts — tablets will use the desktop frontend. Do not build offline support or service workers (Phase 1 does not need it). Do not build push notifications (the app uses in-app notifications only). Do not build biometric authentication or native device features beyond GPS.

---

Begin by scaffolding the `mobile/` folder with the project setup, installing dependencies, creating the `DESIGN.md` placeholder, configuring Vite and Tailwind, and setting up the routing structure with all pages as empty shells. Then build the login page and the employee dashboard (the two most important mobile screens) first. Every subsequent page follows after those two are complete and tested.