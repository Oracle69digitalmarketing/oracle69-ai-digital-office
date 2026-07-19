# Oracle69 AI Digital Office

Oracle69 AI Digital Office is an AI-native enterprise operating system where intelligent AI employees collaborate as a fully functional digital organization.

## Architecture

The project is structured as a monorepo using **Turborepo** and **pnpm**.

### Directory Structure

- `apps/frontend`: Next.js 15 web application.
- `apps/backend`: NestJS backend services.
- `shared/`: Shared TypeScript types, Zod schemas, and utilities.
- `packages/`: Internal library packages (ui, config, types).
- `agent-engine/`: Core logic for AI agent coordination.
- `memory/`: Organizational memory and RAG system.
- `execution-engine/`: Workflow orchestration and task management.
- `database/`: Prisma schema and database migrations.
- `docker/`: Dockerfiles for production deployment.

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS, shadcn/ui.
- **Backend**: NestJS, Prisma, PostgreSQL, Redis, BullMQ.
- **Infrastructure**: Docker, Docker Compose, GitHub Actions, pnpm Workspace, Turborepo.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Installation

```bash
pnpm install
```

### Development

1. Start the infrastructure (PostgreSQL, Redis):
```bash
docker-compose up -d
```

2. Run the development environment:
```bash
pnpm dev
```

### Building

```bash
pnpm build
```

### Linting & Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Documentation

Refer to the `docs/` and `specs/` directories for detailed project documentation and engineering specifications.
