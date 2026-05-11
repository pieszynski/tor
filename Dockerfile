# Multi-stage Dockerfile for the Tor Angular app.
# Builds the app with Node 22, runs tests, then serves the static output via nginx on port 80.
# Target platform: linux/arm64.
#
# Build:
#   docker build -t tor-app .
#
# Run locally:
#   docker run --rm -p 8080:80 tor-app
#   Then open http://localhost:8080
#

# Stage 1: build
FROM node:22-alpine AS builder

WORKDIR /app

COPY src/package*.json ./
RUN npm ci

COPY src/ .
RUN npm test
RUN npm run build

# Stage 2: serve
FROM nginx:alpine

COPY --from=builder /app/dist/tor/browser /usr/share/nginx/html

COPY <<'MAIN' /etc/nginx/nginx.conf
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    # Use CF-Connecting-IP when available, fall back to $remote_addr
    map $http_cf_connecting_ip $real_client_ip {
        ""      $remote_addr;
        default $http_cf_connecting_ip;
    }

    # Use CF-IPCountry when available, fall back to "-"
    map $http_cf_ipcountry $client_country {
        ""      -;
        default $http_cf_ipcountry;
    }

    log_format main '$real_client_ip $client_country [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    access_log /var/log/nginx/access.log main;

    include       /etc/nginx/conf.d/*.conf;
}
MAIN

COPY <<'HTTP' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|webmanifest)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
}
HTTP

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
