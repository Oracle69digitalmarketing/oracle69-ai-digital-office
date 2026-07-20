# Deployment Guide - Oracle69 AI Digital Office

## Overview
This guide outlines the production deployment strategy for the Oracle69 AI Digital Office platform.

## Prerequisites
- Docker & Docker Compose
- Environment variables configured (DATABASE_URL, SUPABASE_URL, etc.)
- Node.js 20+

## Deployment Steps

### 1. Environment Configuration
Create a `.env` file based on `.env.example`:
```bash
DATABASE_URL=...
NEXT_PUBLIC_API_URL=...
# ... other vars
```

### 2. Docker Deployment
The project is containerized for production.
```bash
docker-compose up -d
```

### 3. Readiness Checks
- Backend: `/health` (GET) - Returns 200 OK.
- Frontend: `next build` produces a ready-to-serve optimized build.

## Monitoring
- Logs are available via `docker-compose logs -f`.
- APM integration is recommended for production performance monitoring.
