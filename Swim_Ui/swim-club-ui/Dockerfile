# ── Stage 1 : build Angular ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build for production
COPY . .
RUN npm run build -- --configuration=production

# ── Stage 2 : serve with Nginx ────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist/swim-club-ui/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
