FROM node:20-bullseye-slim as build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/* \
 && if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build -- --output-path=dist

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
