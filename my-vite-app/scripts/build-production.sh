#!/bin/bash

# Production build script that excludes test files
echo "🚀 Starting production build..."

# Clean previous build
echo "🧹 Cleaning previous build artifacts..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies (production only)
echo "📦 Installing production dependencies..."
npm ci --only=production --no-audit --no-fund

# Build the application
echo "🏗️  Building application..."
npm run build

# Verify no test files were included in the build
echo "🔍 Verifying test files are excluded from build..."
if find dist/ -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__" | grep -q .; then
    echo "❌ ERROR: Test files found in build directory!"
    exit 1
else
    echo "✅ No test files found in build directory"
fi

echo "✅ Production build completed successfully"
