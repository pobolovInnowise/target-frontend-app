# TASK-001: Training Sessions Workspace — Requirements

Track: Basic Accelerator Onboarding (`frontend-accelerator-onboarding/`)
Role: `requirements-analyst` (discovery)
Application Root: Repository Root (`target-frontend-app`, the only frontend candidate)

## Goal

A trainer can open a small workspace, view training sessions loaded from a mock API, filter them by one status, create a new session with a title and a future date/time, and see the created session in the list.

The exercise exists to practise the accelerator's manual role workflow. Product and technical scope are deliberately minimal. Success is a working, honestly verified main flow, not a production-ready application.

## User And Problem

- User: a trainer managing training sessions.
- Problem: no way to see, narrow down, or add sessions in the current app (the repository holds only the default Vite demo page).
- Desired outcome: one page covering list, filter, and create.

## Confirmed Decisions (human authority)

1. Task identifier: `TASK-001`.
2. Session statuses: `scheduled`, `completed`, `cancelled`. A newly created session has status `scheduled`.
3. Failure of the create request is out of scope. Only the list request needs an error state.
4. Adding test and mock dependencies is explicitly allowed at the implementation stage: Vitest, React Testing Library, jsdom, and MSW or a standard HTTP mock. Dependency installation and `package.json`/lockfile changes belong to implementation (`coder`), not to this role.

## Required User Flow

1. Open the workspace and see sessions loaded from a mock API.
2. Filter sessions by one status.
3. Open a create form.
4. Create a session with a title and a future date/time.
5. See the created session in the list.

## Acceptance Criteria

Each criterion is independently verifiable.

### Sessions list

- AC-1: On open, the app requests sessions from the mock API and renders each session's title, status, and start date/time.
- AC-2: While the list request is pending, a loading state is visible and no session rows are shown.
- AC-3: If the list request fails, one understandable error message is shown together with a retry action. Activating retry repeats the request and, on success, shows the list.
- AC-4: The filter offers `All`, `scheduled`, `completed`, and `cancelled`. Exactly one option is active at a time; `All` is the default.
- AC-5: Selecting a status shows only sessions with that status. Selecting `All` shows every session. Filtering does not require a new request.

### Create session

- AC-6: The user can open a create form from the workspace.
- AC-7: Title is required. After trimming whitespace, its length must be 3 to 80 characters. Otherwise submission is rejected and a useful validation message is shown.
- AC-8: Date and time are required and must be in the future relative to the browser's current local time. Otherwise submission is rejected and a useful validation message is shown.
- AC-9: While the create request is pending, the user cannot submit again (no duplicate requests).
- AC-10: On successful creation, the new session (trimmed title, chosen date/time, status `scheduled`) appears in the visible list.
- AC-11: If the active filter would hide the new session (any status other than `scheduled` or `All`), behavior is not specified by the task. Implementation may choose either; the choice must be stated in the plan and not left implicit.

### Mock boundary

- AC-12: Mock data and responses are reachable only through an HTTP client or an equivalent replaceable request boundary. UI components do not hold hard-coded session data.
- AC-13: No backend service is implemented. The repository has no mock mechanism, so MSW or another conventional HTTP mock may be added (permitted by decision 4).

### Essential test

- AC-14: At least one behavior-level automated test covers the main flow (filtering or successful creation) and passes. Recommended: successful creation, because it exercises the form, validation, mock boundary, and list update together.

### Manual check

- AC-15: The application is started with a documented repository command (`npm run dev`) and the list, filter, and create flow is exercised once in a browser. What was actually observed is recorded in `workflow-log.md`.

## Non-Goals

- Session details, drawers, or deep links.
- Search or multiple simultaneous filters.
- Pagination.
- A complete API contract or scenario matrix.
- Desktop/mobile screenshot sets; exhaustive responsive and accessibility validation.
- Full test coverage.
- CI, deployment, or a public URL.
- Strict TypeScript migration or unrelated refactoring.
- Error handling for the create request (decision 3).
- Editing or deleting sessions; changing a session's status.
- Persistence across page reloads (mock data is in memory).
- Time zone handling beyond the browser's local time.
- A real backend service.

## Constraints

- Use the repository's existing framework (React 19, Vite, TypeScript), package manager (npm), and scripts. Add only the test/mock dependencies permitted above.
- Do not rewrite unrelated code or configuration.
- Do not add features outside the required flow until onboarding is complete.
- Report incomplete behavior honestly; never claim checks that were not performed.
- Do not use files from `frontend-accelerator-assessment/`.
- Timebox: up to six hours of active work; stop adding scope once the required flow works.

## Facts About The Current Repository

- Stack: React `^19.3.1`, Vite `^8.3.6`, TypeScript `~6.0.3`, ESLint. Scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`.
- `src/` contains only the default Vite demo (`App.tsx` with a counter, `main.tsx`, styles, assets).
- No test stack (no Vitest/Jest/Testing Library) and no `test` script.
- No mock mechanism and no HTTP client (no MSW, axios, or similar).
- `tsconfig.app.json` does not enable `strict`; strict adoption is out of scope.
- `rulesets/project/` is empty (README only).

## Assumptions

- A1: "Future" means later than the browser's local time at submission.
- A2: Mock data is held in memory and resets on reload.
- A3: "Recoverable" list error means an error message with a retry action.
- A4: Filtering is client-side over the already loaded list.
- A5: The list shows sessions in the order returned by the mock API unless the plan decides otherwise (ordering is not required by the task).
- A6: The create form collects a title and a date/time (for example a `datetime-local` input); no other fields are required.

## Open Questions

None blocking. Non-blocking item for the plan:

- Q1: Behavior when a created session is hidden by the active filter (AC-11). Owner: `writing-plans`.

## Specialist Gaps (optional roles)

- Mock library choice and request-client structure: `architect` (optional). Sufficient to settle inside `writing-plans` for this scope.
- Mock endpoint shapes (`GET sessions`, `POST sessions`): `api-integration` (optional). Sufficient to define in the plan.
- Visual direction: `ui-designer` (optional); not needed for onboarding.

## Readiness

Ready for planning. No unresolved blocker remains: the dependency approval and the status set are both confirmed.

Recommended next command: `writing-plans`, which must also settle Q1 and the test/mock tooling setup. The user decides whether to invoke it.
