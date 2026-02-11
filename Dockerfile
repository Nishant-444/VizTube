# build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# install dependencies
RUN npm ci

COPY . .

# generate prisma client and build
RUN npx prisma generate
RUN npm run build

# remove devDependencies to reduce size
RUN npm prune --production

# run stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy only production-only node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/index.js"]