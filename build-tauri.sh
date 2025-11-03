#!/bin/bash

##############################################
# Glass POS - Tauri Production Builder
# Builds production-ready Tauri application
##############################################

echo "🏗️  Building Glass POS for Production..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}❌ Rust is not installed${NC}"
    echo "Install Rust with: curl --proto='=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo -e "${GREEN}✅ Environment checks passed${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Set environment variables
echo "🔧 Setting up build environment..."
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
export WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔨 Building frontend...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build frontend
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🦀 Building Tauri application...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build Tauri
npm run tauri:build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tauri build failed${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show build output
echo -e "${BLUE}📦 Build artifacts:${NC}"
echo ""

if [ -f "src-tauri/target/release/app" ]; then
    APP_SIZE=$(du -h src-tauri/target/release/app | cut -f1)
    echo "✅ Executable: src-tauri/target/release/app (${APP_SIZE})"
fi

if [ -d "src-tauri/target/release/bundle" ]; then
    echo "✅ Bundles: src-tauri/target/release/bundle/"
    ls -lh src-tauri/target/release/bundle/
fi

echo ""
echo -e "${GREEN}🎉 Glass POS is ready for production!${NC}"
echo ""
echo "To run the application:"
echo "  ./src-tauri/target/release/app"
echo ""
