#!/bin/bash

# Test frontend Docker build
echo "🏗️ Testing frontend Docker build..."

cd my-vite-app

echo "📦 Building frontend container..."
docker build -t cars-bids-frontend-test .

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    echo "🧹 Cleaning up test image..."
    docker rmi cars-bids-frontend-test
else
    echo "❌ Frontend build failed!"
    exit 1
fi
