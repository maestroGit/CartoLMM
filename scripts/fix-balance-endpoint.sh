#!/bin/bash
# Quick Fix Script for CartoLMM Balance Endpoint Production Issue
# Run on production server to diagnose and fix balance endpoint failure

set -e

echo "🔍 CartoLMM Balance Endpoint Diagnostic Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if .env exists
echo "📋 Step 1: Checking .env file..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found in current directory${NC}"
    echo "   Please run this script from the CartoLMM root directory"
    exit 1
fi
echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Step 2: Check current BLOCKCHAIN_API_URL
echo "📋 Step 2: Checking BLOCKCHAIN_API_URL..."
CURRENT_URL=$(grep "^BLOCKCHAIN_API_URL=" .env | cut -d '=' -f 2 || echo "NOT_SET")
echo "   Current value: $CURRENT_URL"

if [[ "$CURRENT_URL" == "http://localhost:6001" ]]; then
    echo -e "${RED}❌ BLOCKCHAIN_API_URL is set to localhost (WRONG)${NC}"
    echo "   This will fail in production!"
    echo ""
    echo "🔧 Fixing BLOCKCHAIN_API_URL..."
    
    # Backup original .env
    cp .env .env.backup
    echo -e "${YELLOW}💾 Backed up .env to .env.backup${NC}"
    
    # Replace the URL
    sed -i 's|^BLOCKCHAIN_API_URL=.*|BLOCKCHAIN_API_URL=https://app.blockswine.com|' .env
    
    NEW_URL=$(grep "^BLOCKCHAIN_API_URL=" .env | cut -d '=' -f 2)
    echo -e "${GREEN}✅ Updated BLOCKCHAIN_API_URL to: $NEW_URL${NC}"
else
    echo -e "${GREEN}✅ BLOCKCHAIN_API_URL looks good: $CURRENT_URL${NC}"
fi
echo ""

# Step 3: Check BLOCKCHAIN_LOCAL_URL
echo "📋 Step 3: Checking BLOCKCHAIN_LOCAL_URL..."
LOCAL_URL=$(grep "^BLOCKCHAIN_LOCAL_URL=" .env | cut -d '=' -f 2 || echo "NOT_SET")
echo "   Current value: $LOCAL_URL"

if [[ "$LOCAL_URL" != "http://localhost:6001" ]]; then
    echo -e "${YELLOW}⚠️  BLOCKCHAIN_LOCAL_URL is not set to localhost:6001${NC}"
    echo "   This is only a problem if magnumslocal is running locally"
fi
echo ""

# Step 4: Test connectivity to magnumsmaster
echo "📋 Step 4: Testing connectivity to magnumsmaster..."
RELAY_URL="${CURRENT_URL:-https://app.blockswine.com}"

if curl -s -m 5 "$RELAY_URL/system-info" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Relay server is reachable: $RELAY_URL${NC}"
else
    echo -e "${RED}❌ Relay server is NOT reachable: $RELAY_URL${NC}"
    echo "   This could indicate network issues or incorrect URL"
fi
echo ""

# Step 5: Show required environment variables
echo "📋 Step 5: Required environment variables in production:"
echo ""
grep -E "^BLOCKCHAIN_API_URL=|^BLOCKCHAIN_LOCAL_URL=" .env || echo "   (variables not found)"
echo ""

# Step 6: Summary
echo "📊 Summary"
echo "========="
echo -e "   Relay URL (magnumsmaster): ${GREEN}${CURRENT_URL:-https://app.blockswine.com}${NC}"
echo -e "   Local URL (magnumslocal):  ${YELLOW}$LOCAL_URL${NC}"
echo ""

# Step 7: Next steps
echo "📝 Next Steps:"
echo ""
echo "1. Verify the URLs are correct for your environment"
echo "2. If you made changes, restart CartoLMM:"
echo "   npm run dev"
echo "   # or"
echo "   pm2 restart cartoLMM"
echo ""
echo "3. Test the balance endpoint:"
echo "   curl 'https://your-cartoLMM-domain/api/balance?address=04ba...'"
echo ""
echo "4. Check logs for errors:"
echo "   pm2 logs cartoLMM | grep -i balance"
echo ""
echo -e "${GREEN}✅ Diagnostic complete!${NC}"
