# 1. Use Node 22 Alpine
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# 2. Copy dependencies
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# 3. Install and Rebuild
RUN pnpm install --ignore-scripts
RUN pnpm rebuild bcrypt prisma @prisma/client
RUN pnpm prisma generate

# 4. Copy source code
COPY . .

# 5. --- NEW: Build the TypeScript ---
RUN pnpm run build 

# 6. Expose and Start
EXPOSE 5000
CMD ["pnpm", "start"]