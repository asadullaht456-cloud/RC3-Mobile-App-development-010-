# Shared Living App — Master Parallel Execution & Phases Blueprint

This document defines the end-to-end execution phases and strict file ownership boundaries for **Dev 1 (Frontend)** and **Dev 2 (Backend)** to work simultaneously without Git merge conflicts.

---

## 1. Zero-Conflict Architecture & Rules

### File System Ownership Matrix
To guarantee **zero merge conflicts**, both developers must adhere to strict directory boundaries:

| Developer | Role | Exclusive Write Scope | Forbidden Scope |
|---|---|---|---|
| **Dev 1** | Frontend, UI, Animations, Client Firebase | `/frontend/**` | `/backend/**`, `/docs/**`, DB files |
| **Dev 2** | Backend API, SQLite DB, Admin Firebase, Contract | `/backend/**`, `/docs/API_CONTRACT.md` | `/frontend/**` |

> **Crucial Rule:**
> - Dev 1 never modifies `/backend` or `/docs/API_CONTRACT.md`. If an API field is missing or ambiguous, Dev 1 requests a change from Dev 2.
> - Dev 2 never modifies `/frontend`.
> - Root files (`package.json`, `.gitignore` in root, etc.) are never modified during feature sprints. Each subsystem has its own `.gitignore` and `package.json` inside its respective folder.

---

### Git Branching & Synchronization Strategy

```
main ──────────────┬───────────────────────────(S1)───────────────────────(S2)────────────────────────(S3: Demo Ready)───
                   │                            ▲                          ▲                               ▲
                   ├─► [dev2/backend] ──(B1)────┘──(B2-B7)─────────────────┘                               │
                   │                                                                                       │
                   └─► [dev1/frontend] ──────────────(F1-F7 using mocks)─────────(F8 Integration)──────────┘
```

1. **Branch Setup**:
   - Dev 1 operates on: `git checkout -b dev1/frontend`
   - Dev 2 operates on: `git checkout -b dev2/backend`
2. **Commit Convention**:
   - Dev 1: `[F#] phase name` (e.g. `git commit -m "[F1] setup navigation and mock api"`)
   - Dev 2: `[B#] phase name` (e.g. `git commit -m "[B1] setup express, sqlite schema, and api contract"`)
3. **Sync Checkpoints**:
   - **Sync S1 (After B1)**: Dev 2 publishes `/docs/API_CONTRACT.md` and basic backend skeleton to `main`. Dev 1 pulls `main` into `dev1/frontend`. Dev 1 uses this contract for mock data and TypeScript interfaces.
   - **Sync S2 (After B7)**: Dev 2 has completed and tested all endpoints, seeded the benchmark data, and enabled CORS. Dev 2 merges `dev2/backend` into `main`. Dev 1 merges `main` into `dev1/frontend`, flips `USE_MOCK = false`, and connects live API.
   - **Sync S3 (After F8)**: Full end-to-end benchmark test together (Auth -> Expense -> Split -> Settle -> FCM Notifications).

---

## 2. Dev 2 Phases: Backend + Database (Your Role)

### Phase B1: Setup, Schema & API Contract
- [x] Initialize `/backend` (`npm init -y`, TypeScript, tsx, express, cors, better-sqlite3, zod, dotenv, firebase-admin)
- [x] Establish architecture: `src/routes/`, `src/controllers/`, `src/services/`, `src/db/`, `src/middleware/`, `src/utils/`
- [x] Create persistent SQLite database schema in `src/db/`:
  - `members`: `id` (TEXT PK), `name` (TEXT), `email` (TEXT UNIQUE), `firebase_uid` (TEXT NULL)
  - `shopping_items`: `id` (TEXT PK), `title` (TEXT), `unit` (TEXT), `requested_qty` (INTEGER), `status` (TEXT: Pending/Bought)
  - `expenses`: `id` (TEXT PK), `title` (TEXT), `category` (TEXT), `amount` (INTEGER paisa), `payer_id` (TEXT FK), `split_type` (TEXT: EQUAL/CUSTOM), `date` (TEXT)
  - `expense_splits`: `id` (TEXT PK), `expense_id` (TEXT FK), `member_id` (TEXT FK), `owed_amount` (INTEGER paisa)
  - `settlements`: `id` (TEXT PK), `sender_id` (TEXT FK), `recipient_id` (TEXT FK), `amount` (INTEGER paisa), `created_at` (TEXT)
  - `settings`: `key` (TEXT PK), `value` (TEXT) (e.g. monthly_budget = 500000 paisa)
  - `device_tokens`: `token` (TEXT PK), `member_id` (TEXT FK), `updated_at` (TEXT)
- [x] Seed base data:
  - Members: `M01` (Ali, ali@demo.com), `M02` (Ayesha, ayesha@demo.com), `M03` (Bilal, bilal@demo.com)
  - Budget: PKR 5,000.00 (`500000` paisa)
- [x] Initialize Firebase Admin SDK from environment variable path (`FIREBASE_SERVICE_ACCOUNT_PATH`)
- [x] Write complete specification in `/docs/API_CONTRACT.md` (Endpoints, request/response JSON, HTTP status codes, error payload `{ error: string, details?: any }`)
- [x] **Trigger Sync S1**: Notify Dev 1 that API contract is ready.

### Phase B2: Firebase Authentication & Identity
- [ ] Implement Auth middleware `src/middleware/auth.ts`:
  - Extract `Authorization: Bearer <token>`
  - Verify ID token via `firebase-admin.auth().verifyIdToken(token)`
  - Reject missing/invalid tokens with HTTP 401
  - Match token `email` with `members` table. On first login, save `firebase_uid`.
  - Reject unknown emails with HTTP 403
  - Attach `req.member = { id, name, email }` to request
- [ ] Implement `GET /api/auth/me` returning current member details `{ id, name, email }`
- [ ] Protect all `/api/*` endpoints except `/api/health`

### Phase B3: Members & Shopping List APIs
- [ ] Implement `GET /api/members` -> `[{ id, name, email }]`
- [ ] Implement `GET /api/shopping` -> `[{ id, title, unit, requested_qty, status }]`
- [ ] Implement `POST /api/shopping`:
  - Validate with Zod: `title` (string min 1), `unit` (enum: 'pack' | 'dozen' | 'bottle' | 'bag'), `requested_qty` (int > 0)
  - Status defaults to `Pending`

### Phase B4: Financial Engine, Rounding & Expenses
- [ ] Implement Paisa conversion utility (e.g. PKR 12.50 <-> 1250 paisa)
- [ ] Implement exact integer paisa split engine:
  - **Equal Split**: Floor division `base = floor(total / N)`. Remainder `R = total % N` distributed 1 paisa each to the first `R` members sorted ascending by `member_id`.
  - *Verification Test*: 1,000.00 PKR (100,000 paisa) between M01, M02, M03 -> M01: 33,334 paisa (333.34), M02: 33,333 paisa (333.33), M03: 33,333 paisa (333.33).
  - **Custom Split**: Validate sum of `owed_amount` across splits equals total `amount` exactly.
- [ ] Implement `POST /api/expenses` with Zod validation
- [ ] Implement `GET /api/balances`:
  - Formula: `(Total Paid for Expenses) - (Total Share Owed in Splits) + (Settlements Received) - (Settlements Sent)`
  - Mathematical Invariant: Sum of all net balances must equal exactly `0.00`
- [ ] Implement `GET /api/budget`:
  - Calculate total monthly spending, current budget, remaining amount, percentage, and status (`Safe` < 80%, `Near Limit` 80%-100%, `Exceeded` > 100%)

### Phase B5: Atomic Checkout & Settlement Engine
- [ ] Implement `POST /api/shopping/checkout`:
  - Zod validate payload: `item_ids: string[]`, `total_paid: number`, `payer_id: string`, `split_members: string[]`
  - Wrap in SQLite database transaction:
    1. Mark selected shopping items as `Bought`
    2. Create corresponding expense record and expense splits
- [ ] Implement `POST /api/settle`:
  - Validate: `sender_id`, `recipient_id`, `amount`
  - Validation rules:
    1. `amount > 0` (reject <= 0)
    2. `sender_id !== recipient_id` (reject self-payment)
    3. Reject over-settlement: Cannot settle more than debtor owes or more than recipient is owed
  - Ensure settlements do NOT change household total spending

### Phase B6: Push Notifications (FCM)
- [ ] Implement `POST /api/devices/token` and `DELETE /api/devices/token` for managing FCM registration tokens
- [ ] Build isolated `NotificationService`:
  - Asynchronous / fire-and-forget (never block or throw errors that fail the main HTTP request)
  - Automatically delete expired / `messaging/registration-token-not-registered` tokens
- [ ] Trigger events:
  - Expense / Checkout created: Notify other split members: `"You owe PKR X for <title>"`
  - Settlement recorded: Notify recipient: `"<Name> paid you PKR X"`
  - Budget status transitions: Trigger alert to all members only when status transitions into `Near Limit` or `Exceeded`
  - Include navigation payload `{ type: string, screen: string }`

### Phase B7: Benchmark Verification & Sync S2
- [ ] Benchmark test script / verification:
  - Household spending: PKR 4,200.00
  - Net balances: Ali `+250.00`, Ayesha `-450.00`, Bilal `+200.00` (Sum: 0.00)
  - Execute settlements: Ayesha pays Ali 250.00, Ayesha pays Bilal 200.00 -> All balances become 0.00, total spending remains 4,200.00
- [ ] Database persistence test across restarts
- [ ] Reset & seed script (`npm run seed`) for live demo presentation
- [ ] **Trigger Sync S2**: Announce to Dev 1 that API is live and ready for frontend integration.

### Phase B8: Surprise Feature Slot
- [ ] Implement unexpected contest requirements in isolation without breaking Phase B1-B7 endpoints.

---

## 3. Dev 1 Phases: Frontend + Animations (Dev 1's Role)

### Phase F1: Setup, Navigation & Mock API
- [ ] Initialize Expo dev client build (`expo-dev-client`) and React Native Firebase packages
- [ ] Setup Bottom Tab Navigation: Home, Shopping, Expenses
- [ ] Create Axios client with mock mode toggle `USE_MOCK = true` and types derived from `API_CONTRACT.md`
- [ ] PKR currency formatting utility (always 2 decimals)

### Phase F2: Authentication UI
- [ ] Firebase Email/Password Login Screen
- [ ] Auth Context & Session persistence across app restarts
- [ ] Guarded navigation routing: Unauthenticated -> Login, Authenticated -> Tabs
- [ ] Fetch initial member profile (`GET /api/auth/me`)

### Phase F3: Home Dashboard
- [ ] Active member selector (Ali, Ayesha, Bilal) with persistent local storage
- [ ] Monthly budget progress bar with status badge (`Safe` / `Near Limit` / `Exceeded`)
- [ ] Net balance overview card ("You are owed PKR X" vs "You owe PKR X")
- [ ] Pending shopping list count badge

### Phase F4: Shopping List & Checkout
- [ ] Shopping list screen with `Pending` and `Bought` filter/tabs
- [ ] Add item modal (pack, dozen, bottle, bag)
- [ ] Multi-selection checklist & Checkout modal (enter total cost, payer, split members)

### Phase F5: Expenses & Settle Up
- [ ] Add Expense form (Equal split and Custom split with live balance summation)
- [ ] Balance overview table displaying every member's balance
- [ ] Settle Up modal with client-side validation (sender != recipient, amount > 0)

### Phase F6: Push Notifications (Client FCM)
- [ ] Request push permissions
- [ ] Register FCM device token via `POST /api/devices/token`
- [ ] Foreground toast listener & background notification tap handler routing to `screen`

### Phase F7: Animations & Polish
- [ ] Budget progress bar smooth fill animation
- [ ] Balance counter roll/count-up animation
- [ ] Screen transitions, button tactile feedback, loading skeleton states

### Phase F8: Full Backend Integration (Sync S2 -> S3)
- [ ] Switch `USE_MOCK = false`
- [ ] Connect Axios interceptor with real Firebase Auth ID tokens
- [ ] Handle 401 automatic logout and API error toasts
- [ ] End-to-end benchmark test run (Sync S3)

### Phase F9: Surprise Feature Slot (UI)
- [ ] Integrate surprise requirement UI components.

---

## 4. Benchmark Ground Truth Reference

To ensure Dev 1 and Dev 2 are 100% aligned, both must match this exact calculation:

```
Members: M01 (Ali), M02 (Ayesha), M03 (Bilal)
Initial Monthly Budget: PKR 5,000.00 (500,000 paisa)

Benchmark Target State:
- Total Household Spending: PKR 4,200.00 (420,000 paisa)
- Budget Status: 84% ("Near Limit")
- Net Balances:
  * Ali (M01):   +PKR 250.00 (+25,000 paisa)  [Owed money]
  * Ayesha (M02): -PKR 450.00 (-45,000 paisa)  [Owes money]
  * Bilal (M03):  +PKR 200.00 (+20,000 paisa)  [Owed money]
- Total Net Sum: 250.00 - 450.00 + 200.00 = 0.00 PKR

Settlement Test:
- Ayesha pays Ali PKR 250.00
- Ayesha pays Bilal PKR 200.00
- Resulting Balances: Ali: 0.00, Ayesha: 0.00, Bilal: 0.00
- Total Household Spending remains: PKR 4,200.00
```

