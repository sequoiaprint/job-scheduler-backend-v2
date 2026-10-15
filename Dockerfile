# ---- Build: compile TypeScript and generate the Prisma client ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime: production dependencies + compiled output only ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 4000

# Healthy only when the API answers and both databases (Atlas + Grove) are reachable.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/health" > /dev/null || exit 1

CMD ["node", "dist/server.js"]
