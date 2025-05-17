# Use Node for build step
FROM node:18 AS build

WORKDIR /app

# Copy dependency files first for better Docker cache
COPY package.json package-lock.json ./

# 1) reproducible install
RUN npm ci

# 2) safety net: ensure axios is installed
RUN npm install axios

# 3) debug: show axios in tree
RUN npm ls axios

COPY . .
RUN npm run build


# Use Nginx to serve the build
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]