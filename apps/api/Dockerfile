FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages ./packages
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund || true

COPY apps/api ./apps/api
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
WORKDIR /app/apps/api
CMD ["npx", "tsx", "src/index.ts"]
