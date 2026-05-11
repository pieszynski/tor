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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
