# --- Stage 1: Builder ---
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose Port สำหรับ WebSocket (ต่างจาก Webhook ที่ใช้ 3002)
EXPOSE 3003

CMD ["node", "dist/server.js"]