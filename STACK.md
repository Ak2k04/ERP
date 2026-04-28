# Technology Stack Documentation

This document defines the locked technology stack and architecture for the project. All development must adhere to these standards.

## Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v3
- **Components**: shadcn/ui
- **Forms**: React Hook Form + Zod resolver
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: React Context (Global), useState (Local)
- **Icons**: Lucide React

## Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Zod
- **ORM**: Prisma (PostgreSQL 16)
- **API Style**: REST (Versioned under `/api/v1/`)
- **Error Handling**: Centralized middleware
- **Logging**: Winston (Structured JSON)

## Database & Infrastructure
- **Primary Database**: PostgreSQL 16
- **Caching/Sessions**: Redis 7
- **Migrations**: Prisma Migrate
- **Containers**: Docker Compose (Local Development)

## Authentication & Authorization
- **Library**: NextAuth.js v5 (Auth.js)
- **Strategies**: Google OAuth + Credentials (Email/Password)
- **Hashing**: bcrypt (Salt rounds: 12)
- **Session Management**: JWT in httpOnly cookie
- **Authorization**: Role-Based Access Control (user / admin)

## Quality & Testing
- **Linting**: ESLint
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Commits**: Conventional Commits
- **Unit/Integration**: Jest + ts-jest + Supertest
- **E2E**: Playwright
- **Coverage Target**: 70% Minimum (Backend)

## Rules
1. TypeScript strict mode everywhere. No `any`.
2. Zod validation for all API request bodies.
3. No raw Prisma errors returned to clients.
4. Try/catch or asyncHandler for all async handlers.
5. All secrets in environment variables.
6. Prisma schema is the single source of truth for DB.
7. Frontend never queries DB directly.
8. Protected routes must check session/JWT.
9. Friendly user errors, detailed server logs.
10. Visual verification and browser testing for every task.
