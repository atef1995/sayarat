# Backend Dockerfile
ARG TAG=latest
FROM node:18-bullseye-slim

# Set working directory
WORKDIR /app

# Install system dependencies for TensorFlow and other native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    postgresql-client \
    libstdc++6 \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads && chmod 755 uploads

# Make scripts executable
RUN chmod +x scripts/*.sh scripts/*.js

# Create non-root user
RUN addgroup --gid 1001 nodejs && \
    adduser --uid 1001 --gid 1001 --disabled-password --gecos "" nodejs


# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node scripts/health-check.js || exit 1

# Start application
CMD ["sh", "scripts/docker-start.sh"]
