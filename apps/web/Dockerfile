FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages ./packages
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund || true

COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
