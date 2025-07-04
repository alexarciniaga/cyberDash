# Setup Guide

Complete guide to install and run CyberDash on your local machine.

## ⚡ Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/alexarciniaga/cyberdash.git
cd cyberdash && pnpm install

# 2. Start database
docker compose up -d

# 3. Setup environment and database
cp .env.example .env.local  # Copy root-level environment template
cd apps/web
pnpm db:push

# 4. Start dashboard
cd .. && pnpm dev  # From project root

# 5. Load sample data
curl -X POST http://localhost:3000/api/ingestion/cisa-kev
```

**Dashboard**: http://localhost:3000

## 📋 Prerequisites

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - For cloning the repository

### Install pnpm

```bash
npm install -g pnpm@latest
pnpm --version  # Should show 10.x.x+
```

## 🔧 Detailed Setup

### 1. Clone Repository

```bash
git clone https://github.com/alexarciniaga/cyberdash.git
cd cyberdash
```

### 2. Install Dependencies

```bash
pnpm install  # Installs all workspace dependencies
```

### 3. Start Database

```bash
docker compose up -d  # Starts PostgreSQL in background
docker compose ps     # Verify it's running
```

### 4. Configure Environment

```bash
# Stay in project root directory
cp .env.example .env.local
```

The `.env.local` file contains all necessary configuration. Edit if needed:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cyberdash
# ... other shared configuration
```

### 5. Initialize Database

```bash
cd apps/web
pnpm db:push    # Apply database schema
pnpm db:studio  # Optional: Open database GUI
```

### 6. Start Development Server

```bash
cd ..           # Return to project root
pnpm dev        # Starts on http://localhost:3000
```

### 7. Load Data

```bash
# Load cybersecurity data (takes 30-60 seconds)
curl -X POST http://localhost:3000/api/ingestion/cisa-kev

# Optional: Load additional data sources
curl -X POST http://localhost:3000/api/ingestion/nvd-cve
curl -X POST http://localhost:3000/api/ingestion/mitre-attack
```

## ✅ Verification

### Check Dashboard

- Open http://localhost:3000
- You should see the CyberDash interface
- Default dashboard should be created automatically

### Check API Health

```bash
curl http://localhost:3000/api/health
# Should return: {"success": true, "data": {"status": "healthy", ...}}

curl http://localhost:3000/api/metrics/cisa/total-count
# Should return vulnerability count data
```

### Check Database

```bash
cd apps/web
pnpm db:studio  # Opens database browser at http://localhost:4983
```

## ❌ Common Issues

### Port 3000 Already in Use

```bash
# Use different port
PORT=3001 pnpm dev

# Or kill existing process
lsof -i :3000  # Find PID
kill -9 <PID>  # Kill process
```

### Database Won't Start

```bash
# Check Docker
docker --version
docker compose ps

# Reset database
docker compose down -v  # ⚠️ Deletes data
docker compose up -d
```

### "command not found" Errors

```bash
# Node.js not installed
node --version  # Should show v20+

# pnpm not installed
npm install -g pnpm

# Docker not running
# Start Docker Desktop app
```

### Database Schema Issues

```bash
# If you get database schema errors
cd apps/web
pnpm db:push    # Re-apply schema

# Check health endpoint
curl http://localhost:3000/api/health
```

### No Data in Dashboard

```bash
# Re-run data ingestion
curl -X POST http://localhost:3000/api/ingestion/cisa-kev

# Check API health
curl http://localhost:3000/api/health

# Check logs in terminal where pnpm dev is running
```

### Permission Errors (Linux/macOS)

```bash
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### Turbo Cache Issues

```bash
# Clear turbo cache if you encounter build issues
pnpm turbo clean
rm -rf node_modules
pnpm install
```

## 🔄 Daily Development

```bash
# Start services (from project root)
docker compose up -d
pnpm dev

# Code quality (from project root)
pnpm lint
cd apps/web && pnpm typecheck

# Database operations (from apps/web)
cd apps/web
pnpm db:studio     # View data
pnpm db:push       # Apply schema changes
pnpm db:generate   # Generate migrations
```

## 🚀 Production Setup

### Environment Configuration

Create a production `.env.local` file:

```env
# Production Database (example with Supabase)
DATABASE_URL="postgresql://postgres:password@your-host:5432/database"

# Application Environment
NODE_ENV="production"

# Optional: External API Keys
NVD_API_KEY="your-nvd-api-key"
```

### Build and Deploy

```bash
# Build application
pnpm build

# Start production server
pnpm start

# Or deploy to platforms like Vercel, Railway, etc.
```

## 📝 Useful Commands

### Package Management

```bash
# Add dependency to web app
cd apps/web && pnpm add <package>

# Add dev dependency
cd apps/web && pnpm add -D <package>

# Update all packages
pnpm update
```

### Database Management

```bash
cd apps/web

# Schema operations
pnpm db:generate         # Generate migrations from schema changes
pnpm db:push            # Push schema directly to database
pnpm db:studio          # Open database browser

# Migration operations (for production)
pnpm db:migrate         # Run pending migrations
```

### Docker Operations

```bash
# View logs
docker compose logs postgres

# Restart services
docker compose restart

# Stop and remove everything
docker compose down -v  # ⚠️ Deletes all data
```

### Development Tools

```bash
# Type checking
cd apps/web && pnpm typecheck

# Linting
pnpm lint                # Lint all packages
cd apps/web && pnpm lint:fix  # Auto-fix issues

# Format code
pnpm format
```

## 🔧 Project Structure

```
cyberdash/
├── apps/web/              # Next.js dashboard application
├── packages/              # Shared packages
│   ├── eslint-config/     # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── docs/                  # Documentation
├── docker-compose.yml     # Database services
├── .env.example          # Environment template
└── turbo.json            # Monorepo configuration
```

## 🆘 Still Having Issues?

1. **Check Prerequisites**: Ensure Node.js 20+, Docker, and pnpm are installed
2. **Restart Everything**:
   ```bash
   docker compose down && docker compose up -d
   cd apps/web && pnpm db:push
   cd .. && pnpm dev
   ```
3. **Reset Database**: `docker compose down -v && docker compose up -d`
4. **Clear Cache**: `pnpm turbo clean && rm -rf node_modules && pnpm install`
5. **Check Ports**: Make sure ports 3000 and 5432 are available
6. **Check Health**: `curl http://localhost:3000/api/health`
7. **Create Issue**: [GitHub Issues](https://github.com/alexarciniaga/cyberdash/issues)

---

**Estimated setup time**: 5-15 minutes  
**Need help?** [Create an issue](https://github.com/alexarciniaga/cyberdash/issues)
