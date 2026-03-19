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

# create temp upload directory first
RUN mkdir -p public/temp

# copy only production-only artifacts with node ownership
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

RUN chown -R node:node public/temp

USER node

EXPOSE 3000
CMD ["node", "dist/index.js"]