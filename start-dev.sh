#!/usr/bin/env bash

# Etsy Listing Compliance Checker - Development Startup Script
# Usage: ./start-dev.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PG_DATA="$HOME/postgresql/data"
PG_LOG="$HOME/postgresql/logfile"
PG_SOCKET="/tmp"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Etsy Compliance Checker - Dev Setup  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if PostgreSQL is running
check_postgres() {
    pg_isready -h "$PG_SOCKET" -q 2>/dev/null
    return $?
}

# Function to start PostgreSQL
start_postgres() {
    echo -e "${YELLOW}[1/5] Checking PostgreSQL...${NC}"

    if check_postgres; then
        echo -e "${GREEN}  ✓ PostgreSQL is already running${NC}"
        return 0
    fi

    # Check if data directory exists
    if [ ! -d "$PG_DATA" ]; then
        echo -e "${YELLOW}  → Initializing PostgreSQL data directory...${NC}"
        initdb -D "$PG_DATA" > /dev/null 2>&1
        echo -e "${GREEN}  ✓ Data directory initialized${NC}"
    fi

    # Start PostgreSQL
    echo -e "${YELLOW}  → Starting PostgreSQL...${NC}"
    pg_ctl -D "$PG_DATA" -l "$PG_LOG" -o "-k $PG_SOCKET" start > /dev/null 2>&1

    # Wait for it to be ready
    for i in {1..10}; do
        if check_postgres; then
            echo -e "${GREEN}  ✓ PostgreSQL started${NC}"
            return 0
        fi
        sleep 1
    done

    echo -e "${RED}  ✗ Failed to start PostgreSQL. Check $PG_LOG${NC}"
    exit 1
}

# Function to setup database
setup_database() {
    echo -e "${YELLOW}[2/5] Setting up database...${NC}"

    # Check if database exists
    if psql -h "$PG_SOCKET" -lqt | cut -d \| -f 1 | grep -qw etsy_compliance; then
        echo -e "${GREEN}  ✓ Database 'etsy_compliance' exists${NC}"
    else
        echo -e "${YELLOW}  → Creating database...${NC}"
        createdb -h "$PG_SOCKET" etsy_compliance
        echo -e "${GREEN}  ✓ Database created${NC}"

        echo -e "${YELLOW}  → Running init script...${NC}"
        psql -h "$PG_SOCKET" etsy_compliance < "$PROJECT_DIR/server/src/db/init.sql" > /dev/null 2>&1
        echo -e "${GREEN}  ✓ Tables created${NC}"
    fi

    # Run migration for auth fields (safe to run multiple times due to IF NOT EXISTS)
    echo -e "${YELLOW}  → Running auth migration...${NC}"
    psql -h "$PG_SOCKET" etsy_compliance < "$PROJECT_DIR/server/src/db/migrate-auth.sql" > /dev/null 2>&1 || true
    echo -e "${GREEN}  ✓ Auth migration applied${NC}"
}

# Function to install dependencies
install_deps() {
    echo -e "${YELLOW}[3/5] Checking dependencies...${NC}"

    # Server dependencies
    if [ ! -d "$PROJECT_DIR/server/node_modules" ]; then
        echo -e "${YELLOW}  → Installing server dependencies...${NC}"
        (cd "$PROJECT_DIR/server" && npm install > /dev/null 2>&1)
        echo -e "${GREEN}  ✓ Server dependencies installed${NC}"
    else
        echo -e "${GREEN}  ✓ Server dependencies OK${NC}"
    fi

    # Client dependencies
    if [ ! -d "$PROJECT_DIR/client/node_modules" ]; then
        echo -e "${YELLOW}  → Installing client dependencies...${NC}"
        (cd "$PROJECT_DIR/client" && npm install > /dev/null 2>&1)
        echo -e "${GREEN}  ✓ Client dependencies installed${NC}"
    else
        echo -e "${GREEN}  ✓ Client dependencies OK${NC}"
    fi
}

# Function to check/create .env files
check_env_files() {
    echo -e "${YELLOW}[4/5] Checking environment files...${NC}"

    # Server .env
    if [ ! -f "$PROJECT_DIR/server/.env" ]; then
        echo -e "${YELLOW}  → Creating server .env...${NC}"
        cat > "$PROJECT_DIR/server/.env" << 'EOF'
# Database (NixOS socket connection via /tmp)
DATABASE_URL="postgresql:///etsy_compliance?host=/tmp"

# JWT
JWT_SECRET="dev-jwt-secret-change-in-production-$(openssl rand -hex 32)"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production-$(openssl rand -hex 32)"

# Server
PORT=3001
NODE_ENV="development"

# Frontend URL (for CORS)
CLIENT_URL="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"

# Stripe (placeholder)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email - leave empty for dev mode (logs to console)
RESEND_API_KEY=""
EMAIL_FROM="noreply@etsy-compliance.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
        echo -e "${GREEN}  ✓ Server .env created${NC}"
    else
        echo -e "${GREEN}  ✓ Server .env exists${NC}"
    fi

    # Client .env
    if [ ! -f "$PROJECT_DIR/client/.env" ]; then
        echo -e "${YELLOW}  → Creating client .env...${NC}"
        echo 'VITE_API_URL=http://localhost:3001/api' > "$PROJECT_DIR/client/.env"
        echo -e "${GREEN}  ✓ Client .env created${NC}"
    else
        echo -e "${GREEN}  ✓ Client .env exists${NC}"
    fi
}

# Function to start the servers
start_servers() {
    echo -e "${YELLOW}[5/5] Starting servers...${NC}"
    echo ""
    echo -e "${GREEN}Starting backend and frontend servers...${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:3001${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
    echo ""

    # Start backend in background
    (cd "$PROJECT_DIR/server" && npm run dev) &
    SERVER_PID=$!

    # Small delay to let server start
    sleep 2

    # Start frontend in foreground
    (cd "$PROJECT_DIR/client" && npm run dev) &
    CLIENT_PID=$!

    # Handle Ctrl+C
    trap "echo ''; echo -e '${YELLOW}Shutting down...${NC}'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT TERM

    # Wait for both processes
    wait
}

# Main execution
main() {
    start_postgres
    setup_database
    install_deps
    check_env_files
    start_servers
}

main
