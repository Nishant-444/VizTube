# build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# 1. Install ALL dependencies (including dev) to build
RUN npm ci

COPY . .

# 2. Generate Client & Build
RUN npx prisma generate
RUN npm run build

# 3. Clean up! Remove devDependencies to shrink size
RUN npm prune --production

# run stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 4. Copy only the pruned (production-only) node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/index.js"]