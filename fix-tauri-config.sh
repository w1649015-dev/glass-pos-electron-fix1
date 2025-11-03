#!/bin/bash

##############################################
# Glass POS - Fix Tauri Configuration
# Removes conflicting old config files
##############################################

echo "🔧 Fixing Tauri configuration..."
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

# Remove old tauri.conf.json from root if it exists
if [ -f "tauri.conf.json" ]; then
    echo -e "${YELLOW}⚠️  Found old tauri.conf.json in root directory${NC}"
    echo "Removing..."
    rm -f tauri.conf.json
    echo -e "${GREEN}✅ Removed old config${NC}"
else
    echo -e "${GREEN}✅ No conflicting config file found${NC}"
fi

# Check if src-tauri/tauri.conf.json exists
if [ ! -f "src-tauri/tauri.conf.json" ]; then
    echo -e "${RED}❌ Error: src-tauri/tauri.conf.json not found${NC}"
    echo "Please ensure Tauri is properly initialized"
    exit 1
fi

echo -e "${GREEN}✅ Configuration check passed${NC}"
echo ""

# Verify the config has required properties
if grep -q '"identifier"' src-tauri/tauri.conf.json; then
    echo -e "${GREEN}✅ Config has identifier property${NC}"
else
    echo -e "${RED}❌ Config missing identifier property${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Configuration fixed successfully!${NC}"
echo ""
echo "You can now run:"
echo "  ./run-tauri.sh"
echo ""