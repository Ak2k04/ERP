# Full-Stack Web Application

A production-grade full-stack monorepo built with Next.js 15, Express.js, Prisma, and PostgreSQL.

## Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

## Local Setup

### 1. Clone the repository
```bash
git clone <repo-url>
cd final
```

### 2. Infrastructure Setup
Spin up the database and redis services:
```bash
docker compose up -d
```

### 3. Environment Configuration
Copy the example environment files and update them with your local secrets:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### 4. Installation
Install dependencies for both services:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 5. Database Migration
Run Prisma migrations to set up your local database:
```bash
cd backend
npx prisma migrate dev
```

### 6. Start Development Servers
- **Backend**: `npm run dev` (Runs on http://localhost:3001)
- **Frontend**: `npm run dev` (Runs on http://localhost:3000)
- **Prisma Studio**: `npx prisma studio` (Runs on http://localhost:5555)

## Documentation
- [STACK.md](./STACK.md) - Detailed technology stack and rules.
- [backend/README.md](./backend/README.md) - Backend specific details (TBD).
- [frontend/README.md](./frontend/README.md) - Frontend specific details (TBD).

## Project Structure
Refer to [STACK.md](./STACK.md) for architecture overview.
