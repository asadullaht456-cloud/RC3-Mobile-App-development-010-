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
- [ ] `/backend` initialized (Express + TypeScript + better-sqlite3 + zod + cors + firebase-admin)
- [ ] Folder structure: `routes/`, `controllers/`, `services/`, `db/`, `middleware/`, `utils/`
- [ ] SQLite tables: `members`, `shopping_items`, `expenses`, `expense_splits`, `settlements`, `settings`, `device_tokens`
- [ ] `members` includes `email` and `firebase_uid`
- [ ] Seed members: M01 Ali, M02 Ayesha, M03 Bilal (with emails)
- [ ] Seed monthly budget: PKR 5,000.00
- [ ] Money stored as integer paisa
- [ ] DB file persists across server restarts
- [ ] Firebase Admin initialized from env (service account path in `.env`, gitignored)
- [ ] `/docs/API_CONTRACT.md` written (all endpoints, payloads, responses, auth header, error format)
- [ ] Standard error response: `{ error: string, details?: any }`

## Phase B2: Firebase Authentication
- [ ] Auth middleware verifies `Authorization: Bearer <Firebase ID token>`
- [ ] Missing/invalid token returns 401
- [ ] First login links Firebase user to member by matching email; stores `firebase_uid`
- [ ] `GET /api/auth/me` returns the linked member `{id, name}`
- [ ] All `/api/*` routes protected except health check
- [ ] Unknown email (no matching member) returns 403

## Phase B3: Members & Shopping APIs
- [ ] `GET /api/members` returns `[{id, name}]`
- [ ] `GET /api/shopping` returns items `{id, title, unit, requested_qty, status}`
- [ ] `POST /api/shopping` validates and creates item (status = Pending)
- [ ] Unit limited to: pack, dozen, bottle, bag
- [ ] Zod validation on all inputs

## Phase B4: Financial Engine & Expenses
- [ ] Equal split: remainder paisa given 1-by-1 in ascending member ID order
- [ ] Rounding check: 1000.00 across M01/M02/M03 = 333.34 / 333.33 / 333.33
- [ ] Custom split: splits must sum exactly to amount
- [ ] `POST /api/expenses` (title, category, amount, payer_id, split_type, splits, date)
- [ ] `GET /api/balances` using: Paid - Share Owed + Settlements Received - Settlements Sent
- [ ] Sum of all balances = 0.00 always
- [ ] Monthly spending + budget status endpoint (e.g. `GET /api/budget`): total, budget, remaining, percent, status (84% = "Near Limit")

## Phase B5: Checkout & Settlement
- [ ] `POST /api/shopping/checkout` (item_ids, total_paid, payer_id, split_members)
- [ ] Checkout marks items Bought and auto-posts expense in one DB transaction
- [ ] `POST /api/settle` (sender_id, recipient_id, amount)
- [ ] Reject: amount <= 0, sender = recipient, over-settlement (exceeds debtor's debt or recipient's credit)
- [ ] Settlements do not change total household spending

## Phase B6: Notifications (FCM)
- [ ] `POST /api/devices/token` saves/updates FCM token for the logged-in member
- [ ] `DELETE /api/devices/token` removes token (logout)
- [ ] Notification service wraps `firebase-admin` messaging
- [ ] Push on: expense added / checkout posted, settlement recorded, budget Near Limit / Exceeded
- [ ] Budget alert sent only when status changes (no repeat spam)
- [ ] Invalid/expired tokens are removed automatically
- [ ] Notification failure never breaks the main API response (fire-and-forget with logging)
- [ ] Payload includes `type` and `screen` fields for frontend routing

## Phase B7: Validation, Testing & Handoff
- [ ] Benchmark data verified: spending 4,200.00; Ali +250, Ayesha -450, Bilal +200
- [ ] Settle 250 (Ayesha to Ali) and 200 (Ayesha to Bilal): all balances 0.00, spending still 4,200.00
- [ ] Invalid requests return clear error messages
- [ ] Unauthenticated requests rejected on every protected route
- [ ] Server restart keeps all data
- [ ] CORS enabled; server reachable from phone on LAN
- [ ] API_CONTRACT.md matches final behavior
- [ ] Reset/seed script for demo
- [ ] **Sync S2 announced to Dev 1**

## Phase B8: Surprise Slot (Hour 3.5)
- [ ] Reserved for the organizer's surprise requirement (backend part)
- [ ] Existing endpoints still pass benchmark after changes

---

# Dev 1: Frontend + Animations

## Phase F1: Setup, Navigation & API Layer
- [ ] `/frontend` initialized (Expo + TypeScript) with `expo-dev-client`
- [ ] Firebase packages installed and configured (`google-services.json` / `GoogleService-Info.plist`, config plugins in `app.json`)
- [ ] Dev build runs on device/emulator
- [ ] Folder structure: `screens/`, `components/`, `api/`, `context/`, `services/`, `types/`, `utils/`, `theme/`
- [ ] Bottom tab navigation: Home, Shopping, Expenses
- [ ] Theme file (colors, spacing, typography)
- [ ] Shared TypeScript types matching API_CONTRACT.md
- [ ] API client (axios) with configurable base URL and interceptor that attaches the Firebase ID token
- [ ] Mock data layer toggle (`USE_MOCK`)
- [ ] Money formatting helper (PKR, 2 decimals)

## Phase F2: Authentication UI
- [ ] Login screen (email + password) using Firebase Auth
- [ ] Auth context with `onAuthStateChanged` (session persists across app restarts)
- [ ] Auth-gated navigation: logged out sees Login, logged in sees tabs
- [ ] Logout action
- [ ] Friendly error messages (wrong password, no network, user not found)
- [ ] Loading state and disabled button during login
- [ ] After login, fetch `GET /api/auth/me` (mocked until S2) and set as default active member

## Phase F3: Home Dashboard
- [ ] Active member selector (Ali, Ayesha, Bilal), persisted with AsyncStorage
- [ ] Monthly spending + budget progress bar with status label (Safe / Near Limit / Exceeded)
- [ ] Net balance card ("You are owed PKR X" / "You owe PKR X")
- [ ] Pending shopping items count
- [ ] Reusable components: `Card`, `ProgressBar`, `MemberSelector`

## Phase F4: Shopping List & Checkout
- [ ] Item list with status tags (Pending, Bought)
- [ ] Add item form (title, unit picker, requested quantity)
- [ ] Multi-select items
- [ ] Checkout modal: total price, payer picker, split members
- [ ] Form validation before submit

## Phase F5: Expenses & Settle Up
- [ ] Manual expense form (title, category, date, amount, payer, split strategy)
- [ ] Custom split input per member with live sum check
- [ ] Live balance summary table
- [ ] Settle Up dialog (sender, recipient, amount)
- [ ] Client-side checks: amount > 0, sender != recipient

## Phase F6: Notifications (FCM)
- [ ] Notification permission request (Android 13+/iOS)
- [ ] Get FCM token after login and send via `POST /api/devices/token` (mocked until S2)
- [ ] Handle token refresh
- [ ] Remove token on logout
- [ ] Foreground messages shown as in-app toast
- [ ] Background/quit notification tap navigates to the right screen using payload `screen`
- [ ] Data refresh when a notification arrives

## Phase F7: Animations & Polish
- [ ] Animated budget progress bar fill (on load and on update)
- [ ] Balance card number count-up
- [ ] Tab screen transitions
- [ ] Login screen entrance animation
- [ ] Shopping item select/deselect animation
- [ ] Item status change animation (Pending to Bought)
- [ ] Modal/dialog slide + fade
- [ ] Button press feedback
- [ ] Loading skeletons for lists/cards
- [ ] Toast enter/exit animation
- [ ] Animations use native driver or Reanimated; no frame drops on lists

## Phase F8: Integration & Error Handling
- [ ] Starts only after Sync S2
- [ ] `USE_MOCK` off; all screens use real API with Firebase token
- [ ] 401 response triggers logout / re-auth
- [ ] Loading spinner on every async request
- [ ] Submit buttons disabled while request is in flight (checkout, expense, settle)
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
