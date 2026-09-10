FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm run build --filter=frontend

FROM base AS runner
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/apps/frontend/.next/standalone ./
COPY --from=build /usr/src/app/apps/frontend/.next/static ./.next/static
COPY --from=build /usr/src/app/apps/frontend/public ./public
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
EXPOSE 3000
CMD ["node", "server.js"]
