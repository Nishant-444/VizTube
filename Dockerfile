FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# copy deps
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# install and rebuild deps
RUN pnpm install --ignore-scripts
RUN pnpm rebuild bcrypt prisma @prisma/client
RUN pnpm prisma generate

# copy source code
COPY . .

# build
RUN pnpm run build 

EXPOSE 5000
CMD ["pnpm", "start"]