#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🏃 Titanium Test Suite${NC}"
echo "================================"

# Unit tests
echo -e "${YELLOW}1️⃣  Running unit tests (Vitest)...${NC}"
npm test
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Unit tests failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Unit tests passed${NC}"
echo ""

# E2E tests (optional, requires dev server)
echo -e "${YELLOW}2️⃣  Running E2E tests (Playwright)...${NC}"
echo "Make sure 'npm run dev' is running in another terminal"
read -p "Press enter to continue, or Ctrl+C to skip E2E tests..."

npm run test:e2e
if [ $? -ne 0 ]; then
  echo -e "${RED}⚠️  E2E tests had issues${NC}"
  echo "Ensure the dev server is running: npm run dev"
fi

echo -e "${GREEN}✅ Test suite complete${NC}"
