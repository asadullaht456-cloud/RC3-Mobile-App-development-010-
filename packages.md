# Shared Living App: Packages

## Stack
- Backend: Node.js + Express (TypeScript)
- Frontend: React Native (TypeScript, Expo)
- Database: SQLite (SQL)

## Backend

```bash
mkdir backend && cd backend
npm init -y
npm install express cors better-sqlite3 zod dotenv
npm install -D typescript tsx @types/node @types/express @types/cors @types/better-sqlite3
npx tsc --init
```

| Package | Use |
|---|---|
| express | REST API server |
| cors | Allow mobile client requests |
| better-sqlite3 | SQLite driver (persistent DB, transactions) |
| zod | Request payload validation |
| dotenv | Environment config |
| typescript, tsx | TS compile / run |
| @types/* | Type definitions |

## Frontend

```bash
npx create-expo-app@latest frontend --template blank-typescript
cd frontend
npx expo install react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage @react-native-community/datetimepicker @react-native-picker/picker
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack axios react-native-toast-message
```

| Package | Use |
|---|---|
| expo | RN toolchain |
| @react-navigation/native, bottom-tabs, native-stack | Tab bar + screens |
| react-native-screens, react-native-safe-area-context | Navigation dependencies |
| axios | API client |
| @react-native-async-storage/async-storage | Persist active member |
| react-native-toast-message | Error / success toasts |
| @react-native-community/datetimepicker | Expense date |
| @react-native-picker/picker | Unit, category, payer, split dropdowns |

## Run

```bash
# backend
npx tsx src/index.ts

# frontend
npx expo start
```
