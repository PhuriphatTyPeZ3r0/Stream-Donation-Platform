# --- Stage 1: Builder ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# ต้องตั้งค่า output: 'standalone' ใน next.config.js ก่อนทำการ build
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy ไฟล์ที่จำเป็นสำหรับรัน Next.js แบบ Standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]