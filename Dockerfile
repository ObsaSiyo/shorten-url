# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

# --- Dependencies layer (cached unless package*.json changes) ---
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- Runtime image ---
FROM base AS runtime
ENV NODE_ENV=production

# Non-root user
RUN addgroup -S bot && adduser -S bot -G bot

COPY --from=deps --chown=bot:bot /app/node_modules ./node_modules
COPY --chown=bot:bot . .

USER bot

# Healthcheck — bot has no HTTP server, so just verify the process is alive
HEALTHCHECK --interval=60s --timeout=5s --start-period=15s --retries=3 \
  CMD pgrep -f "node index.js" > /dev/null || exit 1

CMD ["node", "index.js"]
