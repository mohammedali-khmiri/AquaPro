# ── Stage 1 : Compilation ──────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration=production

# ── Stage 2 : Serveur de Production Nginx ──────────────────────────
FROM nginx:alpine

# 🌟 LA LIGNE À AJOUTER : Remplacer la configuration Nginx par défaut par notre reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers Angular compilés
COPY --from=build /app/dist/swim-club-ui/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
