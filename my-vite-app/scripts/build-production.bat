@echo off
REM Production build script for Windows that excludes test files

echo 🚀 Starting production build...

REM Clean previous build
echo 🧹 Cleaning previous build artifacts...
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Install dependencies (production only)
echo 📦 Installing production dependencies...
npm ci --only=production --no-audit --no-fund

REM Build the application
echo 🏗️  Building application...
npm run build

REM Verify no test files were included in the build
echo 🔍 Verifying test files are excluded from build...
dir /s /b dist\*.test.* dist\*.spec.* dist\__tests__ 2>nul && (
    echo ❌ ERROR: Test files found in build directory!
    exit /b 1
) || (
    echo ✅ No test files found in build directory
)

echo ✅ Production build completed successfully
