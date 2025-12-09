# Knwdle

Knwdle is an open-source, multi-tenant education & organisation platform. It gives schools, coaching centres, universities, and training orgs one place to manage people, units (departments/classes), attendance, announcements, assessments, fees, and a “Connect” portal for students/parents.

The project is a pnpm/Turbo monorepo with a TypeScript/Express API, multiple Next.js frontends, and shared UI/state packages.

## Monorepo at a Glance
- `apps/api` – Express + Prisma API, JWT auth, multi-tenant org/unit model, S3 uploads (Localstack in dev). API map: `apps/api/src/api-map.md`.
- `apps/web` – Org/staff/teacher experience built with Next.js.
- `apps/web-admin` – Admin console for managing org structure, permissions, dashboards.
- `apps/connect` – Student/parent “Connect” portal.
- `packages/ui` – Shared shadcn-style component library + styles.
- `packages/state` – Shared Redux/Jotai state utilities and API helpers.
- `packages/eslint-config`, `packages/typescript-config` – Tooling presets.

## Features (API coverage)
Implemented domains: auth/session, invites, orgs & units, roles/permissions, uploads, notifications, org + unit dashboards, attendance, Connect dashboard. Planned/next domains: assignments, tests/results, fees, timetable/calendar, announcements, notes/content, messaging, analytics, audit, achievements. See `apps/api/src/api-map.md` for current endpoints.

## Tech Stack
- Monorepo: pnpm workspaces + Turborepo
- API: Node 20, Express, Prisma/PostgreSQL, Zod schemas, JWT auth, AWS S3 (or Localstack), Swagger UI
- Frontend: Next.js 15, React 19, Tailwind-based shadcn-style UI, Redux Toolkit + Jotai
- Tooling: TypeScript, ESLint, Prettier

## Getting Started (Local)
Prereqs: Node 20+, pnpm 10+, Docker + docker-compose.

1) Install deps  
`pnpm install`

2) Start local infra (Postgres, Mailhog, Localstack S3)  
`docker compose up -d`

3) Generate env files (dev + prod templates)  
`chmod +x scripts/setup-envs.sh && ./scripts/setup-envs.sh`

4) Apply database schema  
```
cd apps/api
pnpm dlx prisma migrate dev
```

5) Run development servers (in parallel terminals)  
```
pnpm dev --filter api
pnpm dev --filter web
pnpm dev --filter web-admin
pnpm dev --filter connect
```

Optional: create the Localstack S3 bucket once per machine  
`chmod +x scripts/setup-localstack.sh && ./scripts/setup-localstack.sh`

## Useful Commands
- Lint all: `pnpm lint`
- Format: `pnpm format`
- API build: `pnpm run build --filter api`
- Web builds: `pnpm run build --filter web --filter web-admin --filter connect`

## Environment Notes
- Dev API runs on `http://localhost:4000` (see `apps/api/.env.local`).
- Frontends default to ports 3000 (web), 3001 (connect), 3002 (admin).
- Local S3 via Localstack: endpoint `http://localhost:9000` (see env templates).
- Never commit real secrets; prod templates are placeholders only.

## Deployment
A sample GitHub Actions workflow is in `.github/workflows/deploy.yml`, deploying the API to EC2 via SSH + PM2. Adjust hosts/secrets before use and remove any infra you do not intend to publish.

## License
Intended license: GNU Affero General Public License v3. The root `LICENSE` must contain the full official AGPLv3 text (link in file). All contributions are under the same license.
