FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build --filter=frontend

FROM base AS runner
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/apps/frontend/.next ./.next
COPY --from=build /usr/src/app/apps/frontend/public ./public
COPY --from=build /usr/src/app/apps/frontend/package.json ./package.json

EXPOSE 3000
CMD ["pnpm", "start", "--filter=frontend"]
