# Multi-stage build for frontend
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./
COPY .env* .

# Install dependencies
RUN npm install

COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine
# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Install curl for health checks (optional)
RUN apk add --no-cache curl

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh


# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

# Expose port
EXPOSE 80
