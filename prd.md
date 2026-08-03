# RULES.md — AI Implementation Guide

## How to Read and Implement This Project

You are building **AttendX**, an attendance management system. This file tells you how to work with the project documentation and how to implement changes correctly.

---

## 1. Documentation Hierarchy

Read these files in this order before writing any code:

1. **PRD.md** — What to build. Business rules, user flows, features, and phases.
2. **TRD.md** — How to build it. Tech stack, database schema, project structure, algorithms, security.
3. **APP_FLOW.md** — How it looks and behaves. Screen layouts, component states, navigation, UX.
4. **RULES.md** (this file) — How to implement it. Coding standards, constraints, and patterns.

**If PRD.md and TRD.md conflict, PRD.md wins.** The PRD defines what the system does. The TRD defines how. Business logic always overrides technical preference.

---

## 2. Phase Discipline

### CRITICAL: Build one phase at a time.

The PRD defines 5 phases. You MUST complete each phase fully before starting the next. Never jump ahead.

| Phase | Focus | Prerequisites |
|---|---|---|
| Phase 1 | Backend foundation, auth, database | None |
| Phase 2 | Attendance logic, GPS, scheduled jobs | Phase 1 complete and tested |
| Phase 3 | Frontend UI, all screens | Phase 2 complete and tested |
| Phase 4 | Reports, analytics, charts | Phase 3 complete and tested |
| Phase 5 | Security hardening, polish, tests | Phase 4 complete and tested |

### What "complete" means:

- All endpoints for that phase respond correctly.
- Edge cases from PRD Section 14 that apply to this phase are handled.
- Error responses follow the format in TRD Section 8.
- The code compiles without errors.
- You can demonstrate the feature works (describe how to test it with curl, Postman, or the browser).

### What to do when asked to implement a phase:

```
1. Re-read the relevant PRD sections for this phase.
2. Re-read the relevant TRD sections (schema, routes, algorithms).
3. List every file you will create or modify.
4. Implement in this order:
   a. Database changes (new tables, migrations)
   b. Types/interfaces
   c. Validators (zod schemas)
   d. Services (business logic)
   e. Controllers (request handling)
   f. Routes (endpoint wiring)
   g. Middleware (if new middleware is needed)
   h. Scheduled jobs (if applicable)
   i. Frontend components (if Phase 3+)
5. After implementation, provide testing instructions.
```

---

## 3. Code Patterns — Backend

### File Naming

- All files: `camelCase.ts` (e.g., `authController.ts`, `gpsService.ts`)
- One concern per file. Do not put multiple controllers in one file.

### Controller Pattern

Every controller function follows this structure:

```typescript
export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Extract validated data (already validated by middleware)
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user.id; // Set by auth middleware

    // 2. Call service function (all business logic lives in services)
    const result = await attendanceService.processCheckIn(userId, {
      latitude, longitude, accuracy
    });

    // 3. Return consistent response
    res.status(200).json({ success: true, data: result });

  } catch (error) {
    next(error); // Global error handler catches this
  }
}
```

### Service Pattern

Services contain ALL business logic. Controllers are thin.

```typescript
// GOOD — logic in service
export async function processCheckIn(userId: string, gpsData: GpsData) {
  const existingRecord = await prisma.attendance.findFirst({
    where: { employeeId: userId, date: today() }
  });
  if (existingRecord) {
    throw new AppError('ALREADY_CHECKED_IN', 400, 'You have already checked in today.');
  }
  // ... rest of business logic
}

// BAD — logic in controller
export async function checkIn(req, res) {
  const existing = await prisma.attendance.findFirst(...);
  if (existing) return res.status(400).json(...);
  // DON'T DO THIS
}
```

### Error Handling

Use a custom `AppError` class. Never return raw strings.

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

// Usage:
throw new AppError('OUTSIDE_RADIUS', 400, 'You are 342m from the office.', {
  distance: 342,
  allowed_radius: 150
});
```

The global error handler in `errorHandler.ts` catches all AppErrors and formats them per TRD Section 8.

### Validation Pattern

Use zod schemas in the `validators/` folder. Apply them via the `validate` middleware.

```typescript
// validators/attendanceSchemas.ts
export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().max(10000),
});

// routes/attendanceRoutes.ts
router.post('/check-in',
  authenticate,          // Verify JWT
  authorize('employee'), // Check role
  validate(checkInSchema), // Validate body
  attendanceController.checkIn
);
```

### Database Queries

- Use Prisma for all database operations. No raw SQL unless absolutely necessary.
- Always use transactions for operations that modify multiple tables.
- Always use `select` to limit returned fields. Never return password hashes.
- Always handle the case where a query returns null.

### Date/Time Rules

- Store all times as `TIMESTAMPTZ` (UTC) in PostgreSQL.
- Convert to office timezone only for display and comparison.
- Use `date-fns` and `date-fns-tz` for timezone conversion.
- The `date` field on attendance records is a `DATE` (no time component) in the office timezone.
- When comparing check-in time to office start time, convert both to the office timezone first.

---

## 4. Code Patterns — Frontend

### Component Structure

```
components/
  ui/           → ShadCN components (Button, Card, Input, Dialog, etc.)
  layout/       → Shared layout components (Sidebar, Header, MobileNav)
  attendance/   → Domain-specific (CheckInButton, LiveTimer, CalendarView)
  dashboard/    → StatCard, SummaryGrid
  admin/        → EmployeeTable, AttendanceFilters, SettingsForm
  auth/         → GoogleLoginButton, AdminLoginForm, OnboardingForm
```

### Component Rules

1. **One component per file.** File name matches component name: `CheckInButton.tsx`.
2. **No business logic in components.** Components call hooks or services. They render UI and handle user interactions.
3. **All API calls go through React Query hooks.** No direct `fetch()` in components.
4. **All forms validate with zod.** Share schemas between frontend and backend where possible.
5. **Props must be typed.** No `any`. No implicit types.

### Hook Pattern

```typescript
// hooks/useAttendance.ts
export function useTodayAttendance() {
  return useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceService.getToday(),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckInData) => attendanceService.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
    },
  });
}
```

### Styling Rules

1. Use TailwindCSS utility classes. No custom CSS files unless absolutely necessary.
2. Use ShadCN components as the base. Customize via Tailwind, not by modifying ShadCN internals.
3. Responsive design: mobile-first. Start with mobile layout, add `md:` and `lg:` breakpoints.
4. Dark mode: use Tailwind's `dark:` variant. Theme toggle in the header.
5. Consistent spacing: use Tailwind's spacing scale (`p-4`, `gap-6`, `mt-8`). No arbitrary pixel values.
6. Colors: use ShadCN's CSS variable system (`bg-primary`, `text-muted-foreground`). Do not hardcode hex colors.

### State Management

- **Server state:** React Query. This is the primary state management tool.
- **Auth state:** React Context (`AuthContext`). Stores current user, access token, and login/logout functions.
- **Theme state:** React Context (`ThemeContext`). Light/dark mode.
- **Form state:** React Hook Form + zod. No useState for forms.
- **No Redux. No Zustand. No MobX.** React Query + Context covers all needs for this app.

---

## 5. API Integration Rules

### Request/Response Contract

The PRD Section 12 defines all endpoints. The TRD Section 13 shows request/response examples. Follow these exactly. Do not invent new endpoints or change response shapes.

### API Client Setup

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send cookies for refresh token
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = getAccessToken(); // From AuthContext
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 with silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const newToken = await refreshAccessToken();
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      } catch {
        logout(); // Clear auth, redirect to /login
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 6. Security Rules

### Never Trust the Client

- All GPS distance calculations happen on the backend. The frontend sends raw coordinates.
- All time comparisons (late detection) happen on the backend.
- All role checks happen on the backend middleware. Frontend role checks are for UX only.
- Never expose password hashes, refresh tokens, or internal IDs in API responses.

### Input Validation

- Validate on the frontend (for UX — show errors before submit).
- Validate on the backend (for security — never trust frontend validation).
- Use the same zod schemas on both sides when possible.

### Audit Logging

Log these events to the `audit_logs` table:

| Action | When |
|---|---|
| `user.login` | Successful login (admin or employee) |
| `user.login_failed` | Failed login attempt (admin only) |
| `user.logout` | User logs out |
| `attendance.check_in` | Employee checks in |
| `attendance.check_out` | Employee checks out |
| `attendance.auto_checkout` | Auto-checkout job runs |
| `employee.approved` | Admin approves an employee |
| `employee.rejected` | Admin rejects an employee |
| `employee.deactivated` | Admin deactivates an employee |
| `settings.updated` | Admin changes office settings |
| `holiday.added` | Admin adds a holiday |
| `holiday.removed` | Admin removes a holiday |
| `report.generated` | Report is generated |

---

## 7. Common Mistakes to Avoid

### Backend

- ❌ Putting business logic in controllers instead of services.
- ❌ Returning `password_hash` or `refresh_token_hash` in any API response.
- ❌ Using `new Date()` on the server without timezone awareness. Use UTC.
- ❌ Not handling the case where `prisma.findFirst` returns null.
- ❌ Creating multiple attendance records for the same employee on the same day. The `UNIQUE(employee_id, date)` constraint prevents this, but handle it gracefully in code too.
- ❌ Trusting the client's timestamp for check-in time. Use `new Date()` on the server.
- ❌ Allowing employees to submit a late reason for someone else's attendance record.
- ❌ Forgetting to check `user.status === 'approved'` before allowing attendance actions.

### Frontend

- ❌ Storing access tokens in localStorage. Store in memory (React state/context) only.
- ❌ Using `useEffect` for data fetching. Use React Query.
- ❌ Building custom loading spinners. Use ShadCN Skeleton components.
- ❌ Hardcoding API URLs. Use environment variables.
- ❌ Showing admin navigation to employee users. Check role before rendering.
- ❌ Allowing the check-in button to be clicked multiple times rapidly. Disable on first click, wait for response.
- ❌ Not handling the case where geolocation is denied by the user.
- ❌ Using `setInterval` for the live timer without cleanup. Always clear intervals in useEffect cleanup.

### Database

- ❌ Storing times as strings. Use `TIMESTAMPTZ`.
- ❌ Storing GPS coordinates as strings. Use `DOUBLE PRECISION`.
- ❌ Not creating indexes on frequently queried columns.
- ❌ Forgetting that `office_settings` should only have one row.
- ❌ Using `CASCADE` delete on `users` without understanding that it deletes all their attendance records too. This may or may not be desired.

---

## 8. Testing Instructions Per Phase

### After Phase 1

```bash
# 1. Database should be running and migrated
npx prisma migrate dev

# 2. Seed data should create admin + test employees
npx prisma db seed

# 3. Admin login should work
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@attendx.com", "password": "Admin@123"}'
# Should return: { success: true, data: { accessToken: "...", user: {...} } }

# 4. Google OAuth redirect should work
# Open http://localhost:5000/api/auth/google in browser
# Should redirect to Google consent screen

# 5. Office settings should be readable
curl http://localhost:5000/api/admin/settings \
  -H "Authorization: Bearer <admin_token>"
# Should return office settings with defaults
```

### After Phase 2

```bash
# 1. Check-in should work (use a test employee token)
curl -X POST http://localhost:5000/api/attendance/check-in \
  -H "Authorization: Bearer <employee_token>" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 22.5726, "longitude": 88.3639, "accuracy": 30}'
# Should return attendance record

# 2. Duplicate check-in should fail
# Run the same curl again
# Should return: { success: false, error: { code: "ALREADY_CHECKED_IN" } }

# 3. Out-of-radius check-in should fail
curl -X POST http://localhost:5000/api/attendance/check-in \
  -H "Authorization: Bearer <another_employee_token>" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.6139, "longitude": 77.2090, "accuracy": 30}'
# Should return: { success: false, error: { code: "OUTSIDE_RADIUS" } }

# 4. Check-out should work
curl -X POST http://localhost:5000/api/attendance/check-out \
  -H "Authorization: Bearer <employee_token>" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 22.5726, "longitude": 88.3639, "accuracy": 30}'
# Should return attendance record with working_minutes calculated

# 5. Today's attendance should be retrievable
curl http://localhost:5000/api/attendance/today \
  -H "Authorization: Bearer <employee_token>"
```

### After Phase 3

```
1. Open http://localhost:5173 in browser.
2. Click "Sign in with Google" → should redirect to Google → should redirect back.
3. New user → should see onboarding form.
4. Fill form → should see "Pending Approval" page.
5. Login as admin → should see pending employee → approve.
6. Login as employee again → should see dashboard.
7. Click Check In → should request GPS → should succeed or show error.
8. Live timer should be running.
9. Click Check Out → should stop timer, show total hours.
10. Check admin dashboard → should show today's attendance.
11. Test on mobile viewport (Chrome DevTools) → layout should be responsive.
```

### After Phase 4

```
1. Admin → Reports page → select a month → Generate.
2. PDF should download with employee data.
3. Generate CSV and Excel → verify data matches.
4. Admin dashboard → analytics charts should render with data.
5. Check that the monthly auto-report job runs correctly:
   - Manually trigger the cron job function
   - Verify report appears in the reports list
```

### After Phase 5

```
1. Try logging in as admin with wrong password 5 times → should lock account.
2. Try hitting an endpoint 100 times rapidly → should get rate limited.
3. Try accessing admin endpoints with employee token → should get 403.
4. Toggle dark mode → entire app should switch theme.
5. Check that audit logs are being created for all events.
6. Verify loading skeletons appear while data loads.
7. Verify toast notifications appear for all actions.
```

---

## 9. When Modifying Existing Code

If asked to change or add a feature to existing code:

1. **Read the existing code first.** Understand what's there before changing it.
2. **Do not rewrite files from scratch** unless explicitly asked to. Modify the minimum necessary.
3. **Maintain existing patterns.** If the codebase uses a service pattern, add your logic to a service. Don't put it in the controller.
4. **Update validators** if you add or change any request fields.
5. **Update types** if you change any data shapes.
6. **Check for side effects.** If you change the attendance schema, check that the report service still works with the new shape.
7. **Preserve all imports and exports.** Don't accidentally delete an import that another file depends on.

---

## 10. What NOT to Build

Do not implement any of these unless explicitly asked:

- Leave management module
- Shift scheduling
- Biometric verification
- Payroll integration
- Multiple office locations
- WebSocket real-time updates (use polling with React Query instead)
- Email notifications (use in-app notifications only)
- Mobile native app
- Internationalization (i18n)
- Multi-tenancy

These are potential future features. Building scaffolding for them now adds complexity without value. A well-structured codebase is inherently extensible.