# Use Node for build step
FROM node:18 AS build

WORKDIR /app

# Copy dependency files first for better Docker cache
COPY package.json package-lock.json ./

# Clean install dependencies (fail if lock file is out of sync)
RUN npm ci

# Copy the rest of the app
COPY . .

# Build the app
RUN npm run build

# Use Nginx to serve the build
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]