# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Build argument for version
ARG APP_VERSION=unknown

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Create version file
RUN echo "{\"version\": \"${APP_VERSION}\"}" > /app/dist/version.json

# Stage 2: Production
FROM nginx:stable-alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
