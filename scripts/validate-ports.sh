#!/bin/bash

# Port Configuration Validation Script
# Validates that all port configurations are consistent across the project

set -e

echo "🔍 Validating Port Configuration..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Expected values
EXPECTED_WEB_PORT="3000"
EXPECTED_API_PORT="4000"
EXPECTED_MONGO_EXTERNAL="27018"
EXPECTED_MONGO_INTERNAL="27017"
EXPECTED_WEAVIATE_EXTERNAL="9080"
EXPECTED_WEAVIATE_INTERNAL="8080"

ERRORS=0
WARNINGS=0

# Function to check file for pattern
check_file() {
    local file=$1
    local pattern=$2
    local expected=$3
    local description=$4
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  Warning: $file not found${NC}"
        ((WARNINGS++))
        return
    fi
    
    if grep -q "$pattern" "$file"; then
        local found=$(grep "$pattern" "$file" | head -1)
        if echo "$found" | grep -q "$expected"; then
            echo -e "${GREEN}✅ $description${NC}"
        else
            echo -e "${RED}❌ $description - Found: $found${NC}"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠️  Warning: Pattern not found in $file - $description${NC}"
        ((WARNINGS++))
    fi
}

echo "📋 Checking docker-compose.yml..."
check_file "docker-compose.yml" "3000:3000" "3000:3000" "Web port mapping (3000:3000)"
check_file "docker-compose.yml" "4000:4000" "4000:4000" "API port mapping (4000:4000)"
check_file "docker-compose.yml" "27018:27017" "27018:27017" "MongoDB port mapping (27018:27017)"
check_file "docker-compose.yml" "9080:8080" "9080:8080" "Weaviate port mapping (9080:8080)"
check_file "docker-compose.yml" "PORT=4000" "4000" "API environment PORT=4000"
echo ""

echo "📋 Checking apps/api/Dockerfile..."
check_file "apps/api/Dockerfile" "EXPOSE" "4000" "API Dockerfile EXPOSE 4000"
check_file "apps/api/Dockerfile" "ENV PORT" "4000" "API Dockerfile ENV PORT 4000"
echo ""

echo "📋 Checking apps/web/Dockerfile..."
check_file "apps/web/Dockerfile" "EXPOSE" "3000" "Web Dockerfile EXPOSE 3000"
check_file "apps/web/Dockerfile" "ENV PORT" "3000" "Web Dockerfile ENV PORT 3000"
echo ""

echo "📋 Checking env.template..."
check_file "env.template" "^PORT=" "4000" "env.template PORT=4000"
check_file "env.template" "MONGODB_URL=.*27018" "27018" "env.template MongoDB external port 27018"
check_file "env.template" "WEAVIATE_URL=.*9080" "9080" "env.template Weaviate external port 9080"
check_file "env.template" "NEXT_PUBLIC_API_URL=.*4000" "4000" "env.template API URL uses port 4000"
echo ""

echo "📋 Checking terraform/main.tf..."
if [ -f "terraform/main.tf" ]; then
    # Check firewall rules
    if grep -A 10 'resource "google_compute_firewall" "http"' terraform/main.tf | grep -q '3000'; then
        echo -e "${GREEN}✅ Terraform HTTP firewall includes port 3000${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Terraform HTTP firewall may not include port 3000${NC}"
        ((WARNINGS++))
    fi
    
    if grep -A 10 'resource "google_compute_firewall" "api"' terraform/main.tf | grep -q '4000'; then
        echo -e "${GREEN}✅ Terraform API firewall uses port 4000${NC}"
    else
        echo -e "${RED}❌ Terraform API firewall does not use port 4000${NC}"
        ((ERRORS++))
    fi
    
    # Check for incorrect ports
    if grep -A 10 'resource "google_compute_firewall" "api"' terraform/main.tf | grep -q '3001'; then
        echo -e "${RED}❌ Terraform API firewall incorrectly uses port 3001 (should be 4000)${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠️  Warning: terraform/main.tf not found${NC}"
    ((WARNINGS++))
fi
echo ""

echo "📋 Checking terraform/startup-script.sh..."
if [ -f "terraform/startup-script.sh" ]; then
    if grep -q "PORT=4000" terraform/startup-script.sh; then
        echo -e "${GREEN}✅ Terraform startup script uses PORT=4000${NC}"
    else
        echo -e "${RED}❌ Terraform startup script does not use PORT=4000${NC}"
        ((ERRORS++))
    fi
    
    if grep -q "PORT=3001" terraform/startup-script.sh; then
        echo -e "${RED}❌ Terraform startup script incorrectly uses PORT=3001${NC}"
        ((ERRORS++))
    fi
    
    if grep "NEXT_PUBLIC_API_URL=" terraform/startup-script.sh | grep -q ":4000"; then
        echo -e "${GREEN}✅ Terraform NEXT_PUBLIC_API_URL uses port 4000${NC}"
    else
        echo -e "${RED}❌ Terraform NEXT_PUBLIC_API_URL does not use port 4000${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠️  Warning: terraform/startup-script.sh not found${NC}"
    ((WARNINGS++))
fi
echo ""

echo "📋 Checking apps/api/src/index.ts..."
if [ -f "apps/api/src/index.ts" ]; then
    if grep -q "PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000" apps/api/src/index.ts; then
        echo -e "${GREEN}✅ API index.ts defaults to port 4000${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: API index.ts port default may not be 4000${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️  Warning: apps/api/src/index.ts not found${NC}"
    ((WARNINGS++))
fi
echo ""

echo "📋 Checking start-demo.sh..."
if [ -f "start-demo.sh" ]; then
    if grep -q "PORT=\${PORT:-4000}" start-demo.sh || grep -q "PORT=4000" start-demo.sh; then
        echo -e "${GREEN}✅ start-demo.sh uses port 4000 for API${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: start-demo.sh may not use port 4000${NC}"
        ((WARNINGS++))
    fi
    
    if grep -q "localhost:27018" start-demo.sh; then
        echo -e "${GREEN}✅ start-demo.sh uses port 27018 for MongoDB${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: start-demo.sh may not use port 27018 for MongoDB${NC}"
        ((WARNINGS++))
    fi
    
    if grep -q "localhost:9080" start-demo.sh; then
        echo -e "${GREEN}✅ start-demo.sh uses port 9080 for Weaviate${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: start-demo.sh may not use port 9080 for Weaviate${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️  Warning: start-demo.sh not found${NC}"
    ((WARNINGS++))
fi
echo ""

# Summary
echo "========================================="
echo "Validation Summary"
echo "========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All port configurations are correct!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warnings found (non-critical)${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS errors found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warnings found${NC}"
    fi
    echo ""
    echo "Please review and fix the errors above."
    echo "Refer to docs/PORT_CONFIGURATION.md for the correct configuration."
    exit 1
fi

