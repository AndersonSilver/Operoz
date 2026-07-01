#!/bin/bash

# Operoz — setup de desenvolvimento local
# Copia .env.example → .env, gera SECRET_KEY e instala dependências (pnpm).

# Set colors for output messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print header
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${BLUE}                         Operoz — ambiente local                        ${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Setting up your development environment...${NC}\n"

# Function to handle file copying with error checking
copy_env_file() {
    local source=$1
    local destination=$2

    if [ ! -f "$source" ]; then
        echo -e "${RED}Error: Source file $source does not exist.${NC}"
        return 1
    fi

    cp "$source" "$destination"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Copied $destination"
    else
        echo -e "${RED}✗${NC} Failed to copy $destination"
        return 1
    fi
}

# Export character encoding settings for macOS compatibility
export LC_ALL=C
export LC_CTYPE=C
echo -e "${YELLOW}Setting up environment files...${NC}"

# Copy all environment example files
services=("" "web" "api" "space" "admin" "live")
success=true

for service in "${services[@]}"; do
    if [ "$service" == "" ]; then
        # Handle root .env file
        prefix="./"
    else
        # Handle service .env files in apps folder
        prefix="./apps/$service/"
    fi

    copy_env_file "${prefix}.env.example" "${prefix}.env" || success=false
done

# Ajustes para docker-compose-local.yml (MinIO + Redis no host)
if [ -f "./apps/api/.env" ]; then
    sed -i 's/^USE_MINIO=0$/USE_MINIO=1/' ./apps/api/.env 2>/dev/null || true
    if ! grep -q '^MINIO_PUBLIC_ENDPOINT_URL=' ./apps/api/.env; then
        echo 'MINIO_PUBLIC_ENDPOINT_URL="http://localhost:9000"' >> ./apps/api/.env
    else
        sed -i 's|^MINIO_PUBLIC_ENDPOINT_URL=.*|MINIO_PUBLIC_ENDPOINT_URL="http://localhost:9000"|' ./apps/api/.env 2>/dev/null || true
    fi
fi
if [ -f "./apps/live/.env" ]; then
    sed -i 's/^REDIS_PORT=6379$/REDIS_PORT=16379/' ./apps/live/.env 2>/dev/null || true
    sed -i 's|redis://localhost:6379/|redis://localhost:16379/|' ./apps/live/.env 2>/dev/null || true
fi

# Generate SECRET_KEY for Django
if [ -f "./apps/api/.env" ]; then
    echo -e "\n${YELLOW}Generating Django SECRET_KEY...${NC}"
    SECRET_KEY=$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)

    if [ -z "$SECRET_KEY" ]; then
        echo -e "${RED}Error: Failed to generate SECRET_KEY.${NC}"
        echo -e "${RED}Ensure 'tr' and 'head' commands are available on your system.${NC}"
        success=false
    else
        echo -e "SECRET_KEY=\"$SECRET_KEY\"" >> ./apps/api/.env
        echo -e "${GREEN}✓${NC} Added SECRET_KEY to apps/api/.env"
    fi
else
    echo -e "${RED}✗${NC} apps/api/.env not found. SECRET_KEY not added."
    success=false
fi

# Install Node dependencies (pnpm 10.x — ver packageManager em package.json)
if command -v pnpm >/dev/null 2>&1; then
    pnpm install || success=false
elif command -v corepack >/dev/null 2>&1; then
    corepack enable pnpm || success=false
    pnpm install || success=false
else
    echo -e "${YELLOW}!${NC} pnpm não encontrado. Instale com: npm install -g pnpm@10.32.1"
    echo -e "   Depois execute: ${BOLD}pnpm install${NC} nesta pasta."
fi

# Summary
echo -e "\n${YELLOW}Setup status:${NC}"
if [ "$success" = true ]; then
    echo -e "${GREEN}✓${NC} Environment setup completed successfully!\n"
    echo -e "${BOLD}Next steps:${NC}"
    echo -e "1. Review the .env files in each folder if needed"
    echo -e "2. Start the services with: ${BOLD}docker compose -f docker-compose-local.yml up -d${NC}"
    echo -e "\n${GREEN}Happy coding! 🚀${NC}"
else
    echo -e "${RED}✗${NC} Some issues occurred during setup. Please check the errors above.\n"
    echo -e "Reveja README.md na raiz do workspace (pasta pai) ou AGENTS.md."
    exit 1
fi
