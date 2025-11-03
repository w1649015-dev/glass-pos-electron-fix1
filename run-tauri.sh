#!/bin/bash

##############################################
# Glass POS - Tauri Safe Launcher
# Fixes WebKit snap conflicts on Ubuntu
##############################################

echo "🚀 Starting Glass POS (Tauri)..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}❌ Rust is not installed${NC}"
    echo "Install Rust with: curl --proto='=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo -e "${GREEN}✅ Environment checks passed${NC}"
echo ""

# Set environment variables to fix WebKit issues
echo "🔧 Setting up environment..."

# Fix snap library conflicts
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

# WebKit settings
export WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_FORCE_COMPLEX_TEXT=0

# GTK settings
export GTK_MODULES=""
export NO_AT_BRIDGE=1

# Disable hardware acceleration (if needed)
# export LIBGL_ALWAYS_SOFTWARE=1

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""
echo "🎯 Starting Tauri development server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run Tauri
npm run tauri:dev

# Cleanup on exit
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Tauri stopped${NC}"