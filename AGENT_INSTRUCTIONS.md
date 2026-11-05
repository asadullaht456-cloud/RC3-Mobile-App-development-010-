# Agent Instructions

## Step 0: Identify the Developer (MANDATORY)
Before doing anything, ask: **"Which developer are you: Dev 1 (Frontend) or Dev 2 (Backend + Database)?"**
- Do not read, write, or run anything until the dev answers.
- Then follow only the matching section below.
- If the answer is unclear, ask again.

## Shared Rules (Both Agents)
1. Read `REQUIREMENTS.md` first. It is the single source of truth.
2. Work only in the current phase of your dev's section.
3. Do not start the next phase until every checkbox in the current phase is ticked and verified.
4. Tick a box only after the item is built and tested.
5. Before starting a phase, state the phase name and its unchecked items.
6. After finishing a phase, summarize what was done and ask the dev to confirm before moving on.
7. Edit only your own dev's folder and checkboxes. Never touch the other dev's folder.
8. Never change `/docs/API_CONTRACT.md` unless you are Dev 2's agent.
9. Money is PKR with two decimals. Store as integer paisa in the backend.
10. Use TypeScript everywhere. Keep clean naming and separation of concerns.
11. Commit after each completed phase with message: `[B#]` or `[F#] phase name`.
12. If a requirement is unclear, ask the dev. Do not guess.
13. Never commit secrets: `.env`, Firebase service account JSON, private keys. Confirm they are in `.gitignore`.
14. Firebase: Auth (email + password) for login, FCM for push notifications. One shared Firebase project.

---

## Dev 1 Agent: Frontend + Animations

**Scope:** `/frontend` only (React Native, TypeScript, Expo dev build, Firebase client SDK).
**Forbidden:** editing `/backend`, the database, or `/docs/API_CONTRACT.md`.

Rules:
- Follow phases F1 to F9 in order.
- Build against mock data (`USE_MOCK = true`) for backend calls until Dev 2 announces Sync S2 (B7 complete). Do not start F8 before that.
- Firebase Auth login (F2) and FCM token retrieval (F6) work directly with Firebase and do not need the backend. Anything that calls the backend stays mocked until S2.
- Use the Expo dev build (`expo-dev-client`). Do not use Expo Go; FCM does not work in it.
- Use `@react-native-firebase/app`, `auth`, and `messaging`. Never put the Firebase Admin SDK or service account in the frontend.
- Attach the Firebase ID token to every API request through the axios interceptor. On 401, sign out and return to Login.
- Types and API calls must match `/docs/API_CONTRACT.md`. If the contract looks wrong or missing something, tell the dev to raise it with Dev 2. Do not work around it.
- Never calculate financial splits or balances on the client. Display what the API returns. Client-side checks are only for input validation.
- Keep the active-member selector on Home. Default it to the logged-in member, but allow switching.
- Notification handling: foreground = toast, tap = navigate using payload `screen`, refresh data on arrival.
- Use reusable components (`Card`, `ProgressBar`, `MemberSelector`, `Modal`, etc.).
- State management in `context/`; API calls only inside `api/`; Firebase calls only inside `services/`.
- Animations: use Reanimated or the Animated API with native driver. Add them in F7, not earlier.
- Every async action needs a loading state and a disabled submit button.
- Always show PKR labels with 2 decimals.

---

## Dev 2 Agent: Backend + Database

**Scope:** `/backend` and `/docs/API_CONTRACT.md` only (Node.js, Express, TypeScript, SQLite, firebase-admin).
**Forbidden:** editing `/frontend`.

Rules:
- Follow phases B1 to B8 in order.
- Write `/docs/API_CONTRACT.md` in B1 and keep it updated (including the auth header and notification payload format). Any endpoint or payload change must be reflected immediately and the dev must tell Dev 1.
- Structure: `routes/` (HTTP) -> `controllers/` (request handling) -> `services/` (business logic) -> `db/` (queries). Auth in `middleware/`. No business logic in routes.
- Verify Firebase ID tokens with `firebase-admin` on every `/api` route except health check. Return 401 for missing/invalid token, 403 for an email with no matching member.
- Service account key is loaded from env path only. Never hardcode or commit it.
- Notifications are sent from a dedicated notification service. They must never block or fail the main request: log errors and continue.
- Notification payload must include `type` and `screen` fields. Remove invalid/expired FCM tokens automatically. Send budget alerts only when status changes.
- Validate every request with zod. Return `{ error, details? }` with correct HTTP status codes.
- Store money as integer paisa. Equal split remainder goes 1-by-1 in ascending member ID order (1000.00 -> 333.34 / 333.33 / 333.33).
- Use DB transactions for checkout (mark items Bought + post expense).
- Settlements never change total household spending. Reject amount <= 0, self-payment, and over-settlement.
- Balances must always sum to exactly 0.00.
- Verify against the benchmark: spending 4,200.00; Ali +250.00, Ayesha -450.00, Bilal +200.00.
- Announce Sync S2 to the dev only when all B7 items are ticked.

---

## Handoff Protocol
| Event | Who | Action |
|---|---|---|
| B1 done | Dev 2 agent | Tell dev: contract ready, Firebase project info to share (Sync S1) |
| Contract change | Dev 2 agent | Tell dev to notify Dev 1 |
| B7 done | Dev 2 agent | Tell dev: Sync S2, frontend can integrate |
| F7 done | Dev 1 agent | Tell dev: waiting for S2 if not yet announced |
| F8 done | Dev 1 agent | Tell dev: run full benchmark with auth and notifications (Sync S3) |
