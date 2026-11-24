# TASK-001: Training Sessions Workspace — Implementation Plan

Role: `writing-plans`
Inputs: `tasks/TASK-001/requirements.md` (AC-1…AC-15), `frontend-accelerator-onboarding/TASK.md`
Application Root: Repository Root (`target-frontend-app`, the only frontend candidate)
Status: ready for implementation (`coder`). No production code was written by this role.

## 1. Current And Intended Behavior

Current: `src/App.tsx` is the default Vite demo (counter, logos, `App.css`). No test stack, no `test` script, no HTTP client, no mock mechanism. `tsconfig.app.json` is non-strict (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly` are on) and includes all of `src`, so `npm run build` (`tsc -b`) will also type-check test files.

Intended: one page, "Training Sessions Workspace", that loads sessions through a replaceable request boundary, shows loading / recoverable error / list, filters client-side by one status, and creates a session through a validated form with duplicate-submit protection.

## 2. Decisions Settled In This Plan

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 (Q1 / AC-11) | **After a successful create, reset the active filter to `All`.** Human-confirmed. | The user is guaranteed to see the new session. Applies always, not only when the filter would hide it. |
| D2 | Request boundary = a small `SessionsApi` interface (`listSessions`, `createSession`) with an in-memory mock implementation. **No MSW.** | Allowed by the task ("equivalent replaceable request boundary"). Avoids `mockServiceWorker.js` generation, Node-fetch relative-URL issues, and extra dependencies within the six-hour timebox. If MSW is wanted later, a `fetch`-based implementation of the same interface can replace the mock without UI changes. |
| D3 | `SessionsApi` is passed to the workspace as an optional prop (`api`), defaulting to the in-memory mock. Tests pass their own fake. | Makes AC-12 testable; UI holds no session data. |
| D4 | Display order = order returned by the API (A5). A created session is appended to the end of the list. | Not specified by the task; simplest and consistent with A5. |
| D5 | After successful creation the form closes and its fields are cleared. | Not specified; keeps the next create clean. |
| D6 | Filter control is a group of buttons with `aria-pressed` (`All`, `scheduled`, `completed`, `cancelled`). | Exactly one active; easily queryable by role in tests. |
| D7 | Create-request failure is not handled (requirements decision 3). The submit-in-progress flag must still be released in `finally` so the form cannot stay locked. | Out of scope, but avoids a stuck UI. |
| D8 | "Future" = `Date.parse(value) > Date.now()` at submit time; `datetime-local` value is interpreted as browser local time (A1). | Matches AC-8. |

No specialist decision (architecture, API, UI direction) is missing. `architect`, `api-integration`, and `ui-designer` are not needed for this scope.

## 3. Contracts Between Steps

```ts
// src/features/sessions/types.ts
type SessionStatus = 'scheduled' | 'completed' | 'cancelled'
type StatusFilter = 'all' | SessionStatus
interface Session { id: string; title: string; status: SessionStatus; startsAt: string /* ISO 8601 */ }
interface NewSessionInput { title: string /* already trimmed */; startsAt: string /* ISO 8601 */ }

// src/features/sessions/sessionsApi.ts
interface SessionsApi {
  listSessions(): Promise<Session[]>
  createSession(input: NewSessionInput): Promise<Session> // resolves with status 'scheduled'
}
```

- `listSessions` rejects on failure; the UI shows one message and a Retry button.
- `createSession` assigns `id` and `status: 'scheduled'`; the UI does not invent either.
- Validation (`validation.ts`) is a pure function: `(title: string, dateTimeLocal: string, now: number) => { title?: string; startsAt?: string }` (error messages per field; empty object = valid).
- Accessible hooks relied on by tests: heading text; loading `role="status"`; error `role="alert"` with a button named `Retry`; filter buttons named `All` / `scheduled` / `completed` / `cancelled`; a button named `New session` (opens form); form fields labelled `Title` and `Date and time`; submit button named `Create session`; validation messages as `role="alert"` linked to fields.

## 4. Files

### Create

| File | Purpose |
| --- | --- |
| `src/test/setup.ts` | Imports `@testing-library/jest-dom/vitest`; registers `afterEach(cleanup)` (no Vitest globals are used). |
| `src/features/sessions/types.ts` | Types from section 3. |
| `src/features/sessions/sessionsApi.ts` | `SessionsApi` interface. |
| `src/features/sessions/mockSessionsApi.ts` | `createMockSessionsApi(options?)` — in-memory data (a few sessions across all three statuses), short artificial delay, `listSessions` / `createSession`. Optional options for tests/manual runs (`delayMs`). Only place with hard-coded session data (AC-12). |
| `src/features/sessions/validation.ts` | Pure validation (AC-7, AC-8). |
| `src/features/sessions/SessionsWorkspace.tsx` | Owns state: load status (`loading` / `error` / `ready`), sessions, active filter, form open flag, submitting flag. Loads on mount with a stale-response guard (safe under `StrictMode`). Retry re-runs the load. Applies D1 on create success. |
| `src/features/sessions/StatusFilter.tsx` | Presentational filter buttons (AC-4, AC-5). |
| `src/features/sessions/SessionList.tsx` | Presentational list/rows: title, status, formatted start date/time (AC-1). Empty-filter result shows a short "no sessions" message. |
| `src/features/sessions/CreateSessionForm.tsx` | Controlled form, validation messages, disabled submit while pending plus a guard in the handler against double invocation (AC-6…AC-9). |
| `src/features/sessions/SessionsWorkspace.test.tsx` | Behavior tests (section 6). |
| `src/features/sessions/validation.test.ts` | Optional unit tests (section 6, additional). |

### Modify

| File | Change |
| --- | --- |
| `package.json` | Add devDependencies (step 1) and script `"test": "vitest run"`. Add nothing else. |
| `package-lock.json` | Updated by `npm install` only. |
| `vite.config.ts` | Import `defineConfig` from `vitest/config` and add `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' }`. Keep the React plugin as is. |
| `src/App.tsx` | Replace the demo counter with `<SessionsWorkspace />`. |
| `src/App.css` | Replace demo styles with minimal workspace styles (layout, filter active state, form, error). Keep it small. |
| `src/index.css` | Only if the demo's global layout (e.g. centered `#root`, fixed width) breaks the page; otherwise untouched. |

### Leave untouched

`src/main.tsx`, `tsconfig*.json` (the setup file's import brings jest-dom matcher types into `tsc -b`; touch tsconfig only if the build proves it is needed), `eslint.config.js`, `src/assets/`, `rulesets/`, `.claude/`, `.agents/`, `frontend-accelerator-assessment/`.

## 5. Implementation Steps (ordered by dependency)

### Step 1 — Minimal test stack (blocks step 5; steps 2–4 can start in parallel after step 1's config is in place, or before it)

1. **Approval gate:** `npm install` changes the filesystem and uses the network. `coder` must state this and get explicit confirmation before running it (dependency approval is already given in requirements decision 4, but the execution gate still applies).
2. Install as devDependencies: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`. Versions: let npm resolve latest compatible with React 19 / Vite 8; do not pin guesses in this plan. If peer-dependency conflicts appear with the installed Vite, report them rather than forcing `--force`.
3. Edit `package.json` script and `vite.config.ts` as in section 4; add `src/test/setup.ts`.
4. Smoke check: `npm run test` runs and reports "no test files" or passes once step 5's test exists; `npm run build` and `npm run lint` still pass.

Boundary of mocks: all session data and simulated latency live in `mockSessionsApi.ts` only. Components receive a `SessionsApi` and never import the mock directly except `SessionsWorkspace` for its default (or `App.tsx`, if the default is wired there — pick one place and keep it single).

### Step 2 — Types, API boundary, mock (AC-12, AC-13)

Create `types.ts`, `sessionsApi.ts`, `mockSessionsApi.ts`. The mock keeps a mutable in-memory array; `createSession` generates an id and `status: 'scheduled'`. No network, no service worker, no backend.

### Step 3 — Validation (AC-7, AC-8)

Create `validation.ts`. Title: trim, then 3–80 characters (empty gives a "required" message; out-of-range gives a length message). Date/time: empty gives "required"; unparsable or not later than `now` gives a "must be in the future" message. Messages are specific enough to be "useful" (state the rule).

### Step 4 — UI (AC-1…AC-11, depends on 2 and 3)

1. `SessionsWorkspace`: load on mount → `loading` (AC-2: status message shown, no rows), → `ready` (AC-1), → `error` (AC-3: one message + `Retry`; Retry re-enters `loading`, then `ready` on success).
2. `StatusFilter` + client-side filtering over loaded sessions with no new request (AC-4, AC-5; default `All`).
3. `New session` button toggles `CreateSessionForm` (AC-6).
4. `CreateSessionForm`: on submit, validate with `validation.ts`; on errors show messages and do not call the API (AC-7, AC-8). On valid input, set submitting, call `createSession` with the trimmed title and ISO `startsAt`; the submit button is disabled while pending and the handler ignores re-entry (AC-9). Release the flag in `finally` (D7).
5. On success: append the returned session, set filter to `All` (D1, AC-10, AC-11), close and clear the form (D5).
6. Replace `App.tsx` / `App.css` per section 4.

### Step 5 — Essential behavior test (AC-14, depends on 1 and 4)

See section 6.

### Step 6 — Verification and manual check (AC-15, depends on all)

See section 7.

## 6. Tests

### Essential (must exist and pass; AC-14)

`SessionsWorkspace.test.tsx` — **successful creation, end to end through the UI**, with a fake `SessionsApi` injected via the `api` prop:

1. Render with a fake api whose `listSessions` resolves a fixed list including at least one `completed` session; `createSession` is a `vi.fn` resolving a `scheduled` session built from its input.
2. Await the list (rows with title/status visible).
3. Click the `completed` filter, confirming only completed sessions show (covers AC-5 as a side benefit).
4. Click `New session`; enter a title with surrounding whitespace (via `user-event`); set `Date and time` with a far-future value using `fireEvent.change` (jsdom's `datetime-local` handling is unreliable with `user.type`); submit.
5. Assert: `createSession` was called once with the trimmed title and a future ISO `startsAt`; the filter is back to `All` (`aria-pressed`); the new session with status `scheduled` is visible; the form is closed.

Use a far-future date (for example a fixed distant year) rather than fake timers, so async `findBy*` queries are not disturbed.

### Additional (risk-based, optional, only after the essential test passes; stop if the timebox is tight)

Place beside the behavior they protect in the same test file unless noted.

- AC-2: loading state visible and no rows while `listSessions` is pending (deferred promise).
- AC-3: first `listSessions` rejects → error message and `Retry` shown; second call resolves → list shown.
- AC-7 / AC-8: too-short title, too-long title (81), whitespace-only title, empty date, past date → message shown and `createSession` not called. Pure-function cases may go in `validation.test.ts`.
- AC-9: `createSession` returns a never-resolving/deferred promise; click submit twice (or submit with Enter) → called once and the button is disabled.
- AC-4: default `All` is active; exactly one filter active at a time.
- AC-5: switching filters does not call `listSessions` again.

Not covered by automated tests, by design: styling, responsive layout, accessibility audit, create-request failure (out of scope).

## 7. Verification

Existing commands discovered from `package.json`:

- `npm run lint` — ESLint (`eslint .`).
- `npm run build` — `tsc -b && vite build` (also type-checks the new test files).
- `npm run dev` — Vite dev server for the manual check. Use the URL the server prints; do not assume a port.
- `npm run preview` — optional.

Added by this plan (exists only after step 1): `npm run test` (`vitest run`).

Order after implementation: `npm run test` → `npm run lint` → `npm run build` → `npm run dev` + manual browser pass.

Manual check (AC-15), performed once and recorded honestly in `tasks/TASK-001/workflow-log.md`: open the page; see sessions after the mock delay; filter by a status and back to `All`; open the form; try an invalid title and a past date (see messages); create a valid session; confirm it shows with status `scheduled` and the filter reads `All`. Record only what was observed; list the list-error/Retry path as covered by the automated test only (if that additional test is written) or as unverified.

## 8. Independence And Ordering

- Steps 2 and 3 are independent of each other and of step 1's installation.
- Step 4 needs steps 2 and 3.
- Step 5 needs steps 1 and 4.
- Step 6 is last.

## 9. Risks And Rollback

- Risk: peer-dependency or version incompatibility between Vitest/RTL and Vite 8 / React 19 / TypeScript 6. Mitigation: report the exact error; do not use `--force` without approval.
- Risk: `tsc -b` fails on test-only types (jest-dom matchers). Mitigation: keep the matcher import in `src/test/setup.ts`; adjust `tsconfig.app.json` `types` only if the build proves it is necessary and report that change.
- Risk: demo CSS in `index.css` interferes with the layout. Mitigation: minimal edit only.
- Rollback: the work is additive plus a replacement of the demo `App.tsx`/`App.css`; revert through git. No feature flag is justified for an onboarding exercise.

## 10. Requirement Coverage

| AC | Covered by |
| --- | --- |
| AC-1 | Step 4 (`SessionList`), essential test (rows visible) |
| AC-2 | Step 4, additional test |
| AC-3 | Step 4, additional test |
| AC-4 | Step 4 (`StatusFilter`), additional test |
| AC-5 | Step 4, essential test (filter step) |
| AC-6 | Step 4 (`New session`), essential test |
| AC-7 | Steps 3–4, additional tests |
| AC-8 | Steps 3–4, additional tests |
| AC-9 | Step 4, additional test |
| AC-10 | Step 4, essential test |
| AC-11 | D1 (filter reset to `All`), essential test asserts it |
| AC-12 | Step 2, D2/D3 |
| AC-13 | Step 2 (no backend, no MSW needed) |
| AC-14 | Step 5 / essential test |
| AC-15 | Step 6 manual check |

## 11. Open Items

None blocking. Unspecified-by-task choices (ordering D4, form reset D5) are stated above and may be changed by the human without affecting any AC.

Recommended next command: `coder` (implements steps 1–4 and the essential test), with the dependency-install approval gate honored. `git-worktrees` is optional if isolation is wanted. The user decides whether to invoke either.
