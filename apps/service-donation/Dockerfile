# --- Stage 1: Builder ---
FROM node:18-alpine AS builder
WORKDIR /app

# Copy ไฟล์ package.json และติดตั้ง Dependencies
COPY package*.json ./
RUN npm ci

# Copy Source Code ทั้งหมดและ Build TypeScript
COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine
WORKDIR /app

# Copy เฉพาะโฟลเดอร์ dist (ผลลัพธ์จากการ build) และ node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose Port (ปรับตาม Service เช่น 3001)
EXPOSE 3001

# รัน Service
CMD ["node", "dist/app.js"]