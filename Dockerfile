# ============================================
# Stage 1: Base image with dependencies
# ============================================
FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy dependency files first (better layer caching)
COPY package.json package-lock.json ./

# ============================================
# Stage 2: Install dependencies
# ============================================
FROM base AS deps

# Install all dependencies (including devDependencies)
RUN npm ci

# ============================================
# Stage 3: Development
# ============================================
FROM base AS dev

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite dev server port
EXPOSE 8080

# Run dev server — host 0.0.0.0 so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ============================================
# Stage 4: Build for production
# ============================================
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for env variables needed at build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN npm run build

# ============================================
# Stage 5: Production — serve with nginx
# ============================================
FROM nginx:alpine AS production

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Custom nginx config for SPA (handle client-side routing)
COPY --from=build /app/dist /usr/share/nginx/html

RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback — all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
