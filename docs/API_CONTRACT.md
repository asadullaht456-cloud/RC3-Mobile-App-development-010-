# Shared Living App — API Contract

Version: `1.0.0`  
Owner: **Dev 2 (Backend)**  
Status: **Official Baseline (Sync S1)**

All routes except `/api/health` require a valid Firebase ID Token passed in the `Authorization` header.

```http
Authorization: Bearer <Firebase_ID_Token>
```

---

## 1. Global Standards

### Base URL
- Local Dev: `http://localhost:3000/api`
- LAN / Mobile Dev Build: `http://<YOUR_LAN_IP>:3000/api`

### Monetary Policy
- **Storage / Backend calculation**: Integer **paisa** (1 PKR = 100 paisa).
- **API Payloads / Display**: Amounts are sent/received in PKR decimal format (e.g. `1250.00` PKR) or documented paisa equivalent. For maximum clarity across Dev 1 and Dev 2:
  - All endpoint amounts are expressed in standard **PKR** with up to 2 decimal places (e.g. `1000.00`, `333.34`).
  - Backend converts PKR to integer paisa internally for all arithmetic to avoid floating point drift.

### Standard Response Formats
#### Success Response
Responses return `200 OK` (or `201 Created`) with a JSON payload or object.

#### Standard Error Response
All errors return the standardized structure:
```json
{
  "error": "Descriptive error message",
  "details": null
}
```
If validation fails via Zod, `details` will contain an array of field errors:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "requested_qty",
      "message": "Must be greater than 0"
    }
  ]
}
```

### HTTP Status Codes
| Code | Meaning | When Used |
|---|---|---|
| `200` | OK | Successful GET, PUT, DELETE, or action |
| `201` | Created | Successfully created resource (POST) |
| `400` | Bad Request | Zod validation failed or illegal operation |
| `401` | Unauthorized | Missing, expired, or invalid Firebase ID Token |
| `403` | Forbidden | Authenticated email does not belong to any household member |
| `404` | Not Found | Requested member, expense, or item does not exist |
| `500` | Server Error | Unhandled server error |

---

## 2. Authentication & Identity

### `GET /api/health`
Health check (Unprotected).
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "timestamp": "2026-11-05T11:00:00.000Z"
}
```

### `GET /api/auth/me`
Fetches the household member identity linked to the authenticated Firebase user.
- **Auth**: Required (`Bearer <token>`)
- **Response `200 OK`**:
```json
{
  "id": "M01",
  "name": "Ali",
  "email": "ali@demo.com"
}
```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Invalid or expired Firebase token" }`
  - `403 Forbidden`: `{ "error": "Authenticated user is not an active household member" }`

---

## 3. Members API

### `GET /api/members`
Fetches all household members.
- **Auth**: Required
- **Response `200 OK`**:
```json
[
  {
    "id": "M01",
    "name": "Ali",
    "email": "ali@demo.com"
  },
  {
    "id": "M02",
    "name": "Ayesha",
    "email": "ayesha@demo.com"
  },
  {
    "id": "M03",
    "name": "Bilal",
    "email": "bilal@demo.com"
  }
]
```

---

## 4. Shopping List API

### `GET /api/shopping`
List all shopping items.
- **Auth**: Required
- **Response `200 OK`**:
```json
[
  {
    "id": "item_1",
    "title": "Milk Carton",
    "unit": "bottle",
    "requested_qty": 2,
    "status": "Pending"
  },
  {
    "id": "item_2",
    "title": "Eggs",
    "unit": "dozen",
    "requested_qty": 1,
    "status": "Bought"
  }
]
```

### `POST /api/shopping`
Add an item to the shopping list.
- **Auth**: Required
- **Request Body**:
```json
{
  "title": "Cooking Oil",
  "unit": "bottle",
  "requested_qty": 2
}
```
*Constraints*:
- `title`: string (1-100 characters)
- `unit`: strictly one of `"pack" | "dozen" | "bottle" | "bag"`
- `requested_qty`: integer >= 1
- **Response `201 Created`**:
```json
{
  "id": "item_3",
  "title": "Cooking Oil",
  "unit": "bottle",
  "requested_qty": 2,
  "status": "Pending"
}
```

### `POST /api/shopping/checkout`
Purchases shopping items, marks them as `Bought`, and records an expense in a single atomic database transaction.
- **Auth**: Required
- **Request Body**:
```json
{
  "item_ids": ["item_1", "item_3"],
  "total_paid": 1200.00,
  "payer_id": "M01",
  "split_members": ["M01", "M02", "M03"]
}
```
*Rules*:
- Automatically posts an expense with category `"Groceries"`.
- Uses Equal Split across `split_members`.
- Marks items in `item_ids` as `status: "Bought"`.
- Triggers push notification to other split members.
- **Response `201 Created`**:
```json
{
  "success": true,
  "expense": {
    "id": "exp_101",
    "title": "Checkout: 2 items",
    "category": "Groceries",
    "amount": 1200.00,
    "payer_id": "M01",
    "split_type": "EQUAL",
    "date": "2026-11-05"
  },
  "bought_item_ids": ["item_1", "item_3"]
}
```

---

## 5. Financial & Expenses API

### `POST /api/expenses`
Record a manual expense.
- **Auth**: Required
- **Request Body (Equal Split)**:
```json
{
  "title": "Internet Bill",
  "category": "Utilities",
  "amount": 3000.00,
  "payer_id": "M01",
  "split_type": "EQUAL",
  "date": "2026-11-05",
  "splits": [
    { "member_id": "M01" },
    { "member_id": "M02" },
    { "member_id": "M03" }
  ]
}
```
- **Request Body (Custom Split)**:
```json
{
  "title": "Takeout Dinner",
  "category": "Food",
  "amount": 1000.00,
  "payer_id": "M02",
  "split_type": "CUSTOM",
  "date": "2026-11-05",
  "splits": [
    { "member_id": "M01", "amount": 400.00 },
    { "member_id": "M02", "amount": 350.00 },
    { "member_id": "M03", "amount": 250.00 }
  ]
}
```
*Validation Rules*:
- `amount > 0`
- Equal split remainder is distributed 1 paisa each in ascending member ID order.
- Custom split must sum *exactly* to `amount`.
- **Response `201 Created`**:
```json
{
  "id": "exp_102",
  "title": "Internet Bill",
  "category": "Utilities",
  "amount": 3000.00,
  "payer_id": "M01",
  "split_type": "EQUAL",
  "date": "2026-11-05",
  "splits": [
    { "member_id": "M01", "owed_amount": 1000.00 },
    { "member_id": "M02", "owed_amount": 1000.00 },
    { "member_id": "M03", "owed_amount": 1000.00 }
  ]
}
```

### `GET /api/balances`
Calculates net balances for all members using:
`Net Balance = Paid - Share Owed + Settlements Received - Settlements Sent`
- **Auth**: Required
- **Response `200 OK`**:
```json
{
  "balances": [
    {
      "member_id": "M01",
      "name": "Ali",
      "net_balance": 250.00,
      "status": "owed"
    },
    {
      "member_id": "M02",
      "name": "Ayesha",
      "net_balance": -450.00,
      "status": "owes"
    },
    {
      "member_id": "M03",
      "name": "Bilal",
      "net_balance": 200.00,
      "status": "owed"
    }
  ],
  "total_net_sum": 0.00
}
```
*Note*: Positive `net_balance` means the member is owed money. Negative means they owe money.

### `GET /api/budget`
Household monthly budget tracking.
- **Auth**: Required
- **Response `200 OK`**:
```json
{
  "total_spent": 4200.00,
  "budget_limit": 5000.00,
  "remaining": 800.00,
  "spent_percentage": 84.0,
  "status": "Near Limit"
}
```
*Status Logic*:
- `< 80.0%` -> `"Safe"`
- `80.0% - 100.0%` -> `"Near Limit"`
- `> 100.0%` -> `"Exceeded"`

---

## 6. Settlement API

### `POST /api/settle`
Records a direct debt settlement between two members.
- **Auth**: Required
- **Request Body**:
```json
{
  "sender_id": "M02",
  "recipient_id": "M01",
  "amount": 250.00
}
```
*Rejection Rules (HTTP 400)*:
1. `amount <= 0`
2. `sender_id === recipient_id`
3. Sender net balance is not negative (sender doesn't owe money).
4. Recipient net balance is not positive (recipient is not owed money).
5. Over-settlement: `amount > abs(sender.net_balance)` or `amount > recipient.net_balance`.
*Note*: Settlements do **not** affect total household spending or budget.
- **Response `200 OK`**:
```json
{
  "id": "settle_501",
  "sender_id": "M02",
  "recipient_id": "M01",
  "amount": 250.00,
  "created_at": "2026-11-05T12:00:00.000Z"
}
```

---

## 7. Device Tokens & Push Notifications

### `POST /api/devices/token`
Registers or updates an FCM token for the authenticated member.
- **Auth**: Required
- **Request Body**:
```json
{
  "token": "eXamPle_fcm_t0ken_string..."
}
```
- **Response `200 OK`**:
```json
{
  "success": true
}
```

### `DELETE /api/devices/token`
Unregisters an FCM token upon user logout.
- **Auth**: Required
- **Request Body**:
```json
{
  "token": "eXamPle_fcm_t0ken_string..."
}
```
- **Response `200 OK`**:
```json
{
  "success": true
}
```

### Push Notification Payload Format
Every FCM data push notification sent by the backend contains the following standard structure:

```json
{
  "notification": {
    "title": "Expense Added",
    "body": "You owe PKR 400.00 for Groceries"
  },
  "data": {
    "type": "EXPENSE_ADDED",
    "screen": "Expenses",
    "reference_id": "exp_101"
  }
}
```

| Event Type | Title | Target Recipient | `screen` |
|---|---|---|---|
| `EXPENSE_ADDED` | "Expense Added" | All split members (except payer) | `"Expenses"` |
| `SETTLEMENT_RECORDED` | "Settlement Received" | Recipient member | `"Expenses"` |
| `BUDGET_ALERT` | "Budget Alert" | All household members | `"Home"` |
