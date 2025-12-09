# Contributing to Knwdle

Thank you for your interest in contributing! 🎓  
Knwdle is a multi-tenant education + organization management platform built with:

- pnpm workspace monorepo  
- Node.js / Express API (`apps/api`)  
- Next.js web apps (`apps/web`, `apps/web-admin`, `apps/connect`)  
- PostgreSQL + Prisma  
- Docker + docker-compose for local infra  

Please follow the guidelines below when contributing.

---

## 1. Code of Conduct
By participating, you agree to follow our [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

## 2. Local Development Setup

### Prerequisites
- Node.js 20+
- pnpm 8 or 10+
- Docker & docker-compose

### 2.1 Install dependencies
pnpm install

### 2.2 Start local infrastructure

docker compose up -d

This starts:
	•	PostgreSQL
	•	Mailhog (SMTP testing)
	•	Localstack S3

### 2.3 Generate local .env.local files

chmod +x scripts/create-local-envs.sh
./scripts/create-local-envs.sh

Creates:
	•	apps/api/.env.local
	•	apps/web/.env.local
	•	apps/web-admin/.env.local
	•	packages/state/.env.local

### 2.4 Run database migrations

cd apps/api
pnpm dlx prisma migrate dev

### 2.5 Start development servers

pnpm dev --filter api
pnpm dev --filter web
pnpm dev --filter web-admin

## 3. Branching & PR rules
	•	Create branches from main
	•	Examples:
feature/org-units, fix/login-bug, refactor/state-layer
	•	Ensure:
	•	Lint passes
	•	Tests (if any) pass
	•	No .env or secrets committed
	•	TypeScript types updated if API changes


## 4. Style & Conventions

API (Node.js)
	•	Keep controllers thin
	•	Put logic in services/ and DB code in repositories/
	•	Use TypeScript interfaces consistently

Web (Next.js)
	•	Functional components + hooks
	•	Keep UI clean and reusable
	•	Use Tailwind + shadcn/ui


## 5. Issues & Feature Requests

Use GitHub Issues for:
	•	Bug reports
	•	Feature requests
	•	Documentation updates

Include clear steps and screenshots when possible.

## 6. License for Contributions

All contributions are licensed under AGPLv3, the same as the project.

Thank you for helping improve Knwdle! 💚