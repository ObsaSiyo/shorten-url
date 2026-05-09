# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

# --- Dependencies layer ---
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# --- Runtime image ---
FROM base AS runtime
ENV NODE_ENV=production

# Define Build Arguments
ARG DISCORD_TOKEN
ARG CLIENT_ID

# Map Build Args to Environment Variables
ENV DISCORD_TOKEN=$DISCORD_TOKEN
ENV CLIENT_ID=$CLIENT_ID

# Non-root user
RUN addgroup -S bot && adduser -S bot -G bot

COPY --from=deps --chown=bot:bot /app/node_modules ./node_modules
COPY --chown=bot:bot . .

USER bot

# Healthcheck
HEALTHCHECK --interval=60s --timeout=5s --start-period=15s --retries=3 \
  CMD pgrep -f "node index.js" > /dev/null || exit 1

CMD ["node", "index.js"]
