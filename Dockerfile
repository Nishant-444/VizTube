# build stage

FROM node:22-alpine AS builder

WORKDIR /app

# copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# install all dependencies
RUN npm ci

# copy the rest of the source code
COPY . .

# gnerate prisma client
RUN npx prisma generate

# build the typescript/code
RUN npm run build


# run stage

FROM node:22-alpine AS runner

WORKDIR /app

# set to prod
ENV NODE_ENV=production

# copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# expose the port
EXPOSE 3000

# start command
CMD ["node", "dist/index.js"]