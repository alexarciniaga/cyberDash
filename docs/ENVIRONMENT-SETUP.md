# Environment Configuration Guide

This guide explains how environment variables are organized in the CyberDash project.

## 📁 Environment File Structure

```
cyberDash/
├── .env.example                    # Root-level template (committed)
├── .env.local                      # Root-level config (gitignored)
├── docker-compose.yml             # Uses root-level env vars
└── apps/
    └── web/
        ├── .env.example           # App-specific template (committed)
        └── .env.local             # App-specific overrides (gitignored)
```

## 🎯 Configuration Levels

### 1. Root Level (Shared Infrastructure)

**File: `.env.example` → `.env.local`**

Contains configuration shared across all apps:

- **Database settings** - Supabase PostgreSQL connection details
- **External API keys** - NVD, CISA, MITRE access tokens
- **Supabase configuration** - Database and authentication setup

```env
# Supabase Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# External API Keys (optional for basic functionality)
NVD_API_KEY=your-nvd-api-key-here

# Environment
NODE_ENV=development

# Application Settings
PORT=3000
```

### 2. App Level (App-Specific Settings)

**File: `apps/web/.env.example` → `apps/web/.env.local`**

Contains overrides and app-specific configuration:

- **Port overrides** - Custom development ports
- **Feature flags** - App-specific features
- **Debug settings** - Development logging

```env
# App-specific overrides (optional)
PORT=3001                    # Override default port
DEBUG=true                   # Enable debug logging
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 🔄 Loading Order

Next.js loads environment variables in this order (later files override earlier ones):

1. `.env` (committed defaults)
2. `.env.local` (local overrides, gitignored)
3. `.env.development` / `.env.production` (environment-specific)
4. `.env.development.local` / `.env.production.local` (local + environment)

## 🚀 Setup Instructions

### Option 1: Supabase Setup (Recommended)

**Use this for:**

- Production deployments
- Team collaboration
- When you want managed PostgreSQL
- Authentication features (future)

```bash
# 1. Clone repository
git clone <repo> && cd cyberdash

# 2. Create Supabase project at https://supabase.com
# 3. Copy environment template and configure Supabase
cp .env.example .env.local

# 4. Edit .env.local with your Supabase credentials
# Replace [YOUR-PROJECT-REF], [YOUR-PASSWORD], [YOUR-ANON-KEY], etc.
nano .env.local

# 5. Install dependencies and setup database
pnpm install
cd apps/web && pnpm db:push && pnpm dev
```

### Option 2: Local Development with Docker

**Use this for:**

- Pure local development
- Offline development
- When you prefer self-hosted PostgreSQL

```bash
# 1. Clone repository
git clone <repo> && cd cyberdash

# 2. Copy environment template
cp .env.example .env.local

# 3. Update .env.local to use local PostgreSQL
# DATABASE_URL="postgresql://postgres:password@localhost:5432/cyberdash"

# 4. Install dependencies and start local database
pnpm install
docker compose up -d
cd apps/web && pnpm db:push && pnpm dev
```

### Getting Supabase Credentials

1. **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Get Database URL**: Project Settings → Database → Connection string → URI
3. **Get API Keys**: Project Settings → API → anon/public and service_role keys
4. **Get JWT Secret**: Project Settings → API → JWT Secret

### For Custom Configuration

```bash
# 1. Edit root configuration (if needed)
nano .env.local  # or your preferred editor

# 2. Optional: Add app-specific overrides
cd apps/web
cp .env.example .env.local  # Only if you need app-specific changes
nano .env.local
```

### For Production Deployment

```bash
# Set environment variables directly (recommended for production)
export DATABASE_URL="postgresql://prod-user:pass@db-host:5432/cyberdash"
export NVD_API_KEY="production-api-key"
export NODE_ENV="production"
```

## 🔧 Common Configuration Scenarios

### Local Development (Default)

```env
# .env.local (root) - This is all you need!
DATABASE_URL=postgresql://postgres:password@localhost:5432/cyberdash
NODE_ENV=development
```

### Local Development with Custom Port

```env
# .env.local (root)
DATABASE_URL=postgresql://postgres:password@localhost:5432/cyberdash
NODE_ENV=development
PORT=3001
```

### Team Development with Shared Database

```env
# .env.local (root)
DATABASE_URL=postgresql://team:password@shared-db:5432/cyberdash-dev
NVD_API_KEY=team-shared-key
NODE_ENV=development
```

### Testing Environment

```env
# .env.test.local (root)
DATABASE_URL=postgresql://postgres:password@localhost:5432/cyberdash_test
NODE_ENV=test
```

### Production Environment

```env
# Production environment variables (set via deployment system)
DATABASE_URL=postgresql://prod-user:secure-pass@prod-db:5432/cyberdash
NVD_API_KEY=production-api-key
NODE_ENV=production
PORT=3000
```

## 🔍 Troubleshooting

### Environment Variables Not Loading

1. **Check file location**: Ensure `.env.local` is in the **project root** (not in apps/web)
2. **Check file syntax**: No spaces around `=`, use quotes for values with spaces
3. **Restart dev server**: Environment changes require restart (`pnpm dev`)
4. **Check .gitignore**: Ensure `.env.local` is gitignored

### Database Connection Issues

```bash
# Verify database URL format
DATABASE_URL=postgresql://username:password@host:port/database

# Test database connectivity
cd apps/web
pnpm db:studio  # Should open database browser
```

### App-Specific Overrides Not Working

1. **Check loading order**: App-level files override root-level
2. **Check file location**: Must be in `apps/web/.env.local`
3. **Check variable names**: Must match exactly (case-sensitive)
4. **Restart dev server**: `pnpm dev` in apps/web directory

### Docker Compose Issues

1. **Check root .env.local**: Docker Compose reads from project root only
2. **Check variable names**: Must match docker-compose.yml file exactly
3. **Restart containers**: `docker compose down && docker compose up -d`

```yaml
# docker-compose.yml uses these variables from root .env.local:
environment:
  - POSTGRES_DB=cyberdash
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=password
```

### Common Error Messages

**"Database connection failed"**

- Check DATABASE_URL format and database is running
- Run `docker compose ps` to verify PostgreSQL container is up

**"Port 3000 already in use"**

- Change PORT in .env.local or kill existing process
- Use `lsof -i :3000` to find process using port

**"Environment variable not found"**

- Check variable name spelling and case
- Ensure .env.local exists in correct location
- Restart development server

## 📚 Related Documentation

- [Setup Guide](./SETUP.md) - Complete installation instructions
- [Developer Guide](./DEVELOPER-GUIDE.md) - Development workflow
- [Docker Setup](../docker-compose.yml) - Container configuration

## 🎯 Why This Structure?

### Benefits

- **Simplified Setup**: Single environment file for new developers
- **Shared Infrastructure**: Database config used by all apps automatically
- **Docker Integration**: Root-level env works seamlessly with docker-compose
- **Team Friendly**: Shared config reduces setup friction
- **Scalable**: Easy to add new apps that share infrastructure

### Comparison with Alternative Approaches

```bash
# ❌ Complex Setup (Each App Separate)
cd apps/web && cp .env.example .env.local
cd apps/api && cp .env.example .env.local  # Each app needs separate config

# ✅ Simple Setup (Shared Infrastructure)
cp .env.example .env.local  # One file configures everything
```

## 🛡️ Security Best Practices

### Development

- **Never commit** `.env.local` files
- **Use sample values** in `.env.example` files
- **Rotate API keys** periodically

### Production

- **Use environment variables** instead of .env files
- **Secure API keys** with proper access controls
- **Monitor usage** of external API keys

---

**Quick Start**: Just run `cp .env.example .env.local` in the project root and you're ready to go!
**Questions?** Check the [Setup Guide](./SETUP.md) or create an issue for assistance.
