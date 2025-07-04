# Setup Guide

Complete guide to install and run CyberDash on your local machine.

## ⚡ Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/your-org/cyberdash.git
cd cyberdash && pnpm install

# 2. Start database
docker compose up -d

# 3. Setup environment and database
cp .env.example .env.local  # Copy root-level environment template
cd cyberDash/apps/web
pnpm db:push

# 4. Start dashboard
pnpm dev

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
pnpm --version  # Should show 9.x.x+
```

## 🔧 Detailed Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/cyberdash.git
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
cd cyberDash/apps/web
pnpm db:push    # Apply database schema
pnpm db:studio  # Optional: Open database GUI
```

### 6. Start Development Server

```bash
pnpm dev  # Starts on http://localhost:3000
```

### 7. Load Data

```bash
# Load cybersecurity data (takes 30-60 seconds)
curl -X POST http://localhost:3000/api/ingestion/cisa-kev
```

## ✅ Verification

### Check Dashboard

- Open http://localhost:3000
- You should see the CyberDash interface
- Default dashboard should be created automatically

### Check API

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/metrics/cisa/total-count
```

### Check Database

```bash
cd cyberDash/apps/web
pnpm db:studio  # Opens database browser
```

## ❌ Common Issues

### Port 3000 Already in Use

```bash
# Use different port
pnpm dev -- --port 3001

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

## 🔄 Daily Development

```bash
# Start services
docker compose up -d
pnpm dev

# Code quality
pnpm typecheck
pnpm lint

# Database operations
pnpm db:studio     # View data
pnpm db:push       # Apply schema changes
```

## 🚀 Production Setup

```bash
# Build application
pnpm build

# Start production server
pnpm start

# Use environment variables for production database
export DATABASE_URL="postgresql://user:pass@host:5432/db"
```

## 📝 Useful Commands

```bash
# Package management
pnpm install <package>    # Add dependency
pnpm remove <package>     # Remove dependency
pnpm update              # Update all packages

# Database
pnpm db:generate         # Generate migrations
pnpm db:migrate          # Run migrations
pnpm db:drop            # Reset database

# Docker
docker compose logs postgres  # View database logs
docker compose restart       # Restart services
```

## 🆘 Still Having Issues?

1. **Check Prerequisites**: Ensure Node.js 20+, Docker, and pnpm are installed
2. **Restart Everything**: `docker compose restart && pnpm dev`
3. **Reset Database**: `docker compose down -v && docker compose up -d`
4. **Check Ports**: Make sure ports 3000 and 5432 are available
5. **Create Issue**: [GitHub Issues](https://github.com/your-org/cyberdash/issues)

---

**Estimated setup time**: 5-15 minutes  
**Need help?** [Create an issue](https://github.com/your-org/cyberdash/issues)
