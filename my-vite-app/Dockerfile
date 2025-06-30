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

# Debug: Print env files and contents to verify they are present and correct
RUN echo "\n--- .env.production ---" && cat .env.production || echo "No .env.production" \
    && echo "\n--- .env ---" && cat .env || echo "No .env"

# Build the application
RUN npm run build

# Manual verification that no test files are in the build
RUN echo "🔍 Verifying no test files in build..." && \
    find dist/ -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__" | grep -q . && \
    (echo "❌ ERROR: Test files found in build!" && exit 1) || \
    echo "✅ SUCCESS: No test files found in build"

# Production stage
FROM nginx:stable-alpine

# Install curl for health checks (optional)
RUN apk add --no-cache curl

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

# Expose port
EXPOSE 80
