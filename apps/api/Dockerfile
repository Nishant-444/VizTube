# Build from the repo root (the pnpm lockfile lives there):
#   docker build -f apps/api/Dockerfile .
FROM node:22-alpine
WORKDIR /app
RUN corepack enable

# install deps for the api package only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @viztube/api

# generate the prisma client, then build
COPY apps/api/prisma apps/api/prisma
RUN pnpm --filter @viztube/api exec prisma generate

COPY apps/api apps/api
WORKDIR /app/apps/api
RUN mkdir -p public/temp && pnpm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
