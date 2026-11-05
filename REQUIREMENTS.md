# Shared Living App: Requirements

## Team
| Dev | Role | Folder |
|---|---|---|
| Dev 1 | Frontend (React Native, TypeScript, Expo dev build) + animations + Firebase client | `/frontend` |
| Dev 2 | Backend (Node.js, Express, TypeScript) + Database (SQLite) + Firebase Admin | `/backend` |

Shared: `/docs/API_CONTRACT.md` (owned by Dev 2, read-only for Dev 1)

## Firebase Usage
- **Authentication:** Firebase Auth (email + password). Frontend signs in; backend verifies the ID token on every `/api` request.
- **Notifications:** Firebase Cloud Messaging (FCM). Backend sends via `firebase-admin`; frontend registers the device token and receives pushes.
- Single shared Firebase project. Secrets (service account JSON, `.env`) are never committed.
- FCM requires an Expo **dev build** (`expo-dev-client`), not Expo Go.
- 3 test users created in Firebase console: ali@, ayesha@, bilal@ (linked to M01, M02, M03 by email).
- The Home active-member selector stays (required by the task). Auth identifies who is logged in; the selector switches the viewed member for demo.

### Notification Events
| Event | Recipients |
|---|---|
| Expense added (or checkout posted) | Every member in the split except the payer: "You owe PKR X for <title>" |
| Settlement recorded | Recipient: "<Name> paid you PKR X" |
| Budget reaches Near Limit / Exceeded | All members |

## Rules
- Phases are sequential per dev. Do not start the next phase until every checkbox in the current phase is ticked and committed.
- Devs work in parallel. Frontend uses mock data until Dev 2 finishes Phase B7.
- Each dev ticks boxes only in their own section.
- Branches: `dev1/frontend`, `dev2/backend`. Merge to `main` only at sync points.

## Sync Points
| Sync | Condition | Action |
|---|---|---|
| S1 | Dev 2 finishes B1 | API_CONTRACT.md published; Firebase project shared; Dev 1 aligns types |
| S2 | Dev 2 finishes B7 | Dev 1 may start F8 (integration) |
| S3 | F8 done | Full benchmark test together, including auth and notifications |

---

# Dev 2: Backend + Database

## Phase B1: Setup & Schema
- [x] `/backend` initialized (Express + TypeScript + better-sqlite3 + zod + cors + firebase-admin)
- [x] Folder structure: `routes/`, `controllers/`, `services/`, `db/`, `middleware/`, `utils/`
- [x] SQLite tables: `members`, `shopping_items`, `expenses`, `expense_splits`, `settlements`, `settings`, `device_tokens`
- [x] `members` includes `email` and `firebase_uid`
- [x] Seed members: M01 Ali, M02 Ayesha, M03 Bilal (with emails)
- [x] Seed monthly budget: PKR 5,000.00
- [x] Money stored as integer paisa
- [x] DB file persists across server restarts
- [x] Firebase Admin initialized from env (service account path in `.env`, gitignored)
- [x] `/docs/API_CONTRACT.md` written (all endpoints, payloads, responses, auth header, error format)
- [x] Standard error response: `{ error: string, details?: any }`

## Phase B2: Firebase Authentication
- [x] Auth middleware verifies `Authorization: Bearer <Firebase ID token>`
- [x] Missing/invalid token returns 401
- [x] First login links Firebase user to member by matching email; stores `firebase_uid`
- [x] `GET /api/auth/me` returns the linked member `{id, name}`
- [x] All `/api/*` routes protected except health check
- [x] Unknown email (no matching member) returns 403

## Phase B3: Members & Shopping APIs
- [x] `GET /api/members` returns `[{id, name}]`
- [x] `GET /api/shopping` returns items `{id, title, unit, requested_qty, status}`
- [x] `POST /api/shopping` validates and creates item (status = Pending)
- [x] Unit limited to: pack, dozen, bottle, bag
- [x] Zod validation on all inputs

## Phase B4: Financial Engine & Expenses
- [x] Equal split: remainder paisa given 1-by-1 in ascending member ID order
- [x] Rounding check: 1000.00 across M01/M02/M03 = 333.34 / 333.33 / 333.33
- [x] Custom split: splits must sum exactly to amount
- [x] `POST /api/expenses` (title, category, amount, payer_id, split_type, splits, date)
- [x] `GET /api/balances` using: Paid - Share Owed + Settlements Received - Settlements Sent
- [x] Sum of all balances = 0.00 always
- [x] Monthly spending + budget status endpoint (e.g. `GET /api/budget`): total, budget, remaining, percent, status (84% = "Near Limit")

## Phase B5: Checkout & Settlement
- [x] `POST /api/shopping/checkout` (item_ids, total_paid, payer_id, split_members)
- [x] Checkout marks items Bought and auto-posts expense in one DB transaction
- [x] `POST /api/settle` (sender_id, recipient_id, amount)
- [x] Reject: amount <= 0, sender = recipient, over-settlement (exceeds debtor's debt or recipient's credit)
- [x] Settlements do not change total household spending

## Phase B6: Notifications (FCM)
- [x] `POST /api/devices/token` saves/updates FCM token for the logged-in member
- [x] `DELETE /api/devices/token` removes token (logout)
- [x] Notification service wraps `firebase-admin` messaging
- [x] Push on: expense added / checkout posted, settlement recorded, budget Near Limit / Exceeded
- [x] Budget alert sent only when status changes (no repeat spam)
- [x] Invalid/expired tokens are removed automatically
- [x] Notification failure never breaks the main API response (fire-and-forget with logging)
- [x] Payload includes `type` and `screen` fields for frontend routing

## Phase B7: Validation, Testing & Handoff
- [x] Benchmark data verified: spending 4,200.00; Ali +250, Ayesha -450, Bilal +200
- [x] Settle 250 (Ayesha to Ali) and 200 (Ayesha to Bilal): all balances 0.00, spending still 4,200.00
- [x] Invalid requests return clear error messages
- [x] Unauthenticated requests rejected on every protected route
- [x] Server restart keeps all data
- [x] CORS enabled; server reachable from phone on LAN
- [x] API_CONTRACT.md matches final behavior
- [x] Reset/seed script for demo
- [x] **Sync S2 announced to Dev 1**

## Phase B8: Surprise Slot (Hour 3.5)
- [ ] Reserved for the organizer's surprise requirement (backend part)
- [ ] Existing endpoints still pass benchmark after changes

---

# Dev 1: Frontend + Animations

## Phase F1: Setup, Navigation & API Layer
- [x] `/frontend` initialized (Expo + TypeScript) with `expo-dev-client`
- [x] Firebase packages installed and configured (`google-services.json` / `GoogleService-Info.plist`, config plugins in `app.json`)
- [x] Dev build runs on device/emulator
- [x] Folder structure: `screens/`, `components/`, `api/`, `context/`, `services/`, `types/`, `utils/`, `theme/`
- [x] Bottom tab navigation: Home, Shopping, Expenses
- [x] Theme file (colors, spacing, typography)
- [x] Shared TypeScript types matching API_CONTRACT.md
- [x] API client (axios) with configurable base URL and interceptor that attaches the Firebase ID token
- [x] Mock data layer toggle (`USE_MOCK`)
- [x] Money formatting helper (PKR, 2 decimals)

## Phase F2: Authentication UI
- [x] Login screen (email + password) using Firebase Auth
- [x] Auth context with `onAuthStateChanged` (session persists across app restarts)
- [x] Auth-gated navigation: logged out sees Login, logged in sees tabs
- [x] Logout action
- [x] Friendly error messages (wrong password, no network, user not found)
- [x] Loading state and disabled button during login
- [x] After login, fetch `GET /api/auth/me` (mocked until S2) and set as default active member

## Phase F3: Home Dashboard
- [x] Active member selector (Ali, Ayesha, Bilal), persisted with AsyncStorage
- [x] Monthly spending + budget progress bar with status label (Safe / Near Limit / Exceeded)
- [x] Net balance card ("You are owed PKR X" / "You owe PKR X")
- [x] Pending shopping items count
- [x] Reusable components: `Card`, `ProgressBar`, `MemberSelector`

## Phase F4: Shopping List & Checkout
- [x] Item list with status tags (Pending, Bought)
- [x] Add item form (title, unit picker, requested quantity)
- [x] Multi-select items
- [x] Checkout modal: total price, payer picker, split members
- [x] Form validation before submit

## Phase F5: Expenses & Settle Up
- [x] Manual expense form (title, category, date, amount, payer, split strategy)
- [x] Custom split input per member with live sum check
- [x] Live balance summary table
- [x] Settle Up dialog (sender, recipient, amount)
- [x] Client-side checks: amount > 0, sender != recipient

## Phase F6: Notifications (FCM)
- [x] Notification permission request (Android 13+/iOS)
- [x] Get FCM token after login and send via `POST /api/devices/token` (mocked until S2)
- [x] Handle token refresh
- [x] Remove token on logout
- [x] Foreground messages shown as in-app toast
- [x] Background/quit notification tap navigates to the right screen using payload `screen`
- [x] Data refresh when a notification arrives

## Phase F7: Animations & Polish
- [x] Animated budget progress bar fill (on load and on update)
- [x] Balance card number count-up
- [x] Tab screen transitions
- [x] Login screen entrance animation
- [x] Shopping item select/deselect animation
- [x] Item status change animation (Pending to Bought)
- [x] Modal/dialog slide + fade
- [x] Button press feedback
- [x] Loading skeletons for lists/cards
- [x] Toast enter/exit animation
- [x] Animations use native driver or Reanimated; no frame drops on lists

## Phase F8: Integration & Error Handling
- [x] Starts only after Sync S2
- [x] `USE_MOCK` off; all screens use real API with Firebase token
- [x] 401 response triggers logout / re-auth
- [x] Loading spinner on every async request
- [x] Submit buttons disabled while request is in flight (checkout, expense, settle)
- [ ] Error toasts for backend validation errors
- [ ] Network-down banner/toast
- [ ] Pull-to-refresh on lists
- [ ] App restart keeps session, data (from backend), and active member (from AsyncStorage)
- [ ] Real push notification received end to end for expense and settlement
- [ ] Benchmark data flow verified end to end (Sync S3)

## Phase F9: Surprise Slot (Hour 3.5)
- [ ] Reserved for the organizer's surprise requirement (UI part)
- [ ] Existing screens still work after changes

---

# Final Checklist (Both Devs)
- [ ] 5-minute demo rehearsed: login, checkout trip, 2 shared bills, balances, settlement, budget status, notification received
- [ ] Each dev can explain own code (routes, auth middleware, state management, rounding algorithm, FCM flow)
- [ ] Secrets not committed (`.env`, service account JSON)
- [ ] README with run steps for backend and frontend (including dev build)
- [ ] `main` branch builds and runs clean
