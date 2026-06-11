# /test-fix — Autonomous Test Runner + Fixer

Run the test suite, autonomously fix common failures, and produce a structured handoff for anything requiring human attention.

## Usage
`/test-fix` — run all unit + integration tests
`/test-fix $ARGUMENTS` — run a specific path, e.g. `tests/unit` or `tests/integration/api/tasks.test.ts`

## Step 1 — Run the tests

```bash
npx vitest run $ARGUMENTS --reporter=verbose 2>&1
```

Capture the full output. Parse each `FAIL` block and extract:
- Test file path
- Test name
- Error message
- First 5 lines of stack trace

## Step 2 — Classify each failure

Assign one of these types:

| Type | When |
|---|---|
| `TYPE_ERROR` | TypeScript compile error or type mismatch |
| `MOCK_MISSING` | Real module called where a mock was expected |
| `DB_STATE` | Row not found, FK violation, or unique constraint |
| `AUTH_MOCK` | `auth()` returned wrong shape |
| `ASSERTION` | Value did not match expectation |
| `UNHANDLED_PROMISE` | `await` missing or error not caught |
| `UNKNOWN` | Anything else |

## Step 3 — Attempt autonomous fixes (max 3 passes)

**TYPE_ERROR:** Fix the type annotation. In Next.js 16, dynamic route `params` must be `Promise<{id: string}>` — pass as `Promise.resolve({id})` in tests.

**MOCK_MISSING:** Add the missing `vi.mock()` at the top of the test file. Common missing mocks:
- `vi.mock('@/auth', () => ({ auth: vi.fn() }))`
- `vi.mock('@/lib/services/notifications.service', () => ({ notificationsService: { ... } }))`
- `vi.mock('next/headers', ...)`

**DB_STATE:** Read the test's setup and trace the FK chain: `User → Account → Profile → Household → Category/Task/Reward`. Add the missing factory call. Use helpers from `tests/factories/index.ts`.

**AUTH_MOCK:** The mock must return `{ user: { id: string }, expires: string }` for authenticated, or `null` for unauthenticated. Fix the shape.

**ASSERTION:** Read the route handler and the expectation. Fix whichever is wrong — never weaken a specific assertion to `toBeTruthy()`.

**UNHANDLED_PROMISE:** Add `await` to the call.

After each fix pass, re-run only the affected test files and check if new failures appeared.

## Step 4 — Stop conditions

- ✅ All tests pass → report success
- 🔄 A fix made things worse → revert that change, mark test as `NEEDS_HUMAN`
- 🔄 3 passes without resolution → mark remaining as `NEEDS_HUMAN`
- ❓ `UNKNOWN` type → mark immediately as `NEEDS_HUMAN`, do not attempt a fix

## Step 5 — Safety rules

- Only modify files inside `tests/`, `lib/services/`, and `app/api/`
- Never modify: `prisma/schema.prisma`, `prisma/migrations/`, `auth.ts`, `auth.config.ts`, `proxy.ts`
- Never delete a test — only fix it
- If a fix requires modifying a route handler (`app/api/`), show the diff and ask for confirmation before applying

## Step 6 — Output the handoff report

```
## Test-Fix Report

### Summary
- Total: N  |  Passed: N  |  Fixed by agent: N  |  Needs human: N

### Fixed by Agent
| File | Test | Fix Applied |
|------|------|-------------|
| ...  | ...  | ...         |

### Needs Human Intervention

**File:** `tests/...`
**Test:** "test name"
**Type:** TYPE_ERROR | DB_STATE | etc.
**Error:**
  <error message + first 3 lines of stack>
**Hypothesis:** one sentence about likely root cause
**Suggested fix:** one sentence, not yet attempted
```

If all tests pass with no failures, output: `✅ All tests passed. No human intervention needed.`
