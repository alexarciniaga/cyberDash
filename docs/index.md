# CyberDash Documentation

Welcome to the comprehensive documentation for CyberDash - a cybersecurity metrics dashboard that ingests public threat intelligence data and displays it through interactive widgets.

## 🚀 Quick Navigation

### **New to CyberDash?**

Start here to get up and running quickly:

- **[Installation Guide](./getting-started/installation.md)** - Prerequisites, setup, and first run
- **[Quick Start](./getting-started/quick-start.md)** - Get the dashboard running in 5 minutes
- **[Your First Dashboard](./getting-started/first-dashboard.md)** - Create and customize your first dashboard
- **[Troubleshooting](./getting-started/troubleshooting.md)** - Common issues and solutions

### **Using CyberDash**

For dashboard users and analysts:

- **[Using Dashboards](./user-guide/using-dashboards.md)** - Navigate, customize, and manage dashboards
- **[Understanding Metrics](./user-guide/understanding-metrics.md)** - What each metric means and how to interpret
- **[Widget Types](./user-guide/widget-types.md)** - Chart, table, and metric card widgets explained
- **[Data Sources](./user-guide/data-sources.md)** - CISA KEV, NVD CVE, and MITRE ATT&CK explained

### **Developing & Extending**

For developers and contributors:

- **[Architecture Overview](./developer-guide/architecture.md)** - System design and technology stack
- **[Project Structure](./developer-guide/project-structure.md)** - Codebase organization and conventions
- **[Development Workflow](./developer-guide/development-workflow.md)** - Local development, testing, contributing
- **[Adding Widgets](./developer-guide/adding-widgets.md)** - Extend with new widget types
- **[Adding Metrics](./developer-guide/adding-metrics.md)** - Integrate new data sources and metrics
- **[Coding Standards](./developer-guide/coding-standards.md)** - Style guide and best practices

### **API Reference**

Complete API documentation:

- **[API Overview](./api/overview.md)** - REST API design patterns and authentication
- **[Dashboard APIs](./api/dashboards.md)** - CRUD operations for dashboard management
- **[Metrics APIs](./api/metrics.md)** - Data retrieval endpoints for all metrics
- **[Ingestion APIs](./api/ingestion.md)** - Data pipeline and ingestion endpoints
- **[Data Schemas](./api/schemas.md)** - Request/response models and validation

### **Production Deployment**

Deploy and operate in production:

- **[Docker Deployment](./deployment/docker.md)** - Container setup and docker-compose
- **[Environment Configuration](./deployment/environment-variables.md)** - Required and optional settings
- **[Database Setup](./deployment/database-setup.md)** - PostgreSQL configuration and scaling
- **[Monitoring & Health](./deployment/monitoring.md)** - Health checks, logging, and observability
- **[Performance & Scaling](./deployment/scaling.md)** - Optimization and scaling considerations

### **Data Pipeline**

Understanding the data layer:

- **[Data Sources](./data/sources.md)** - External APIs, formats, and access methods
- **[Ingestion Pipeline](./data/ingestion-pipeline.md)** - How data flows through the system
- **[Metrics Design](./data/metrics-design.md)** - Complete metrics specifications and calculations
- **[Database Schema](./data/database-schema.md)** - Tables, relationships, and migrations
- **[Data Quality](./data/data-quality.md)** - Validation, error handling, and monitoring

### **Testing**

Testing strategy and guides:

- **[Testing Overview](./testing/overview.md)** - Testing philosophy and strategy
- **[Unit Tests](./testing/unit-tests.md)** - Component and function testing
- **[Integration Tests](./testing/integration-tests.md)** - API and database testing
- **[End-to-End Tests](./testing/e2e-tests.md)** - Full workflow testing
- **[Data Connection Testing](./testing/data-connection-testing.md)** - Verify UI-to-database connectivity

### **Internal Packages**

Documentation for shared packages:

- **[ESLint Configuration](./packages/eslint-config.md)** - Shared linting rules
- **[TypeScript Configuration](./packages/typescript-config.md)** - Shared TypeScript settings
- **[UI Components](./packages/ui-components.md)** - shadcn/ui customizations

### **Project Management**

Project tracking and planning:

- **[Master Checklist](./project-management/master-checklist.md)** - Complete project task tracking
- **[Roadmap](./project-management/roadmap.md)** - Future plans and feature roadmap
- **[Release Notes](./project-management/release-notes.md)** - Version history and changes

### **Quick Reference**

Handy reference materials:

- **[CLI Commands](./reference/cli-commands.md)** - pnpm scripts and database commands
- **[Keyboard Shortcuts](./reference/keyboard-shortcuts.md)** - Dashboard navigation shortcuts
- **[Error Codes](./reference/error-codes.md)** - Common error codes and meanings
- **[Glossary](./reference/glossary.md)** - Terms and definitions

---

## 📖 Documentation Philosophy

This documentation is organized by **user journey** and **task-oriented**:

- **Progressive disclosure**: Start simple, go deeper as needed
- **Role-based paths**: Different entry points for users vs developers
- **Task-focused**: Each document serves a specific purpose
- **Searchable**: Clear naming and cross-linking

## 🤝 Contributing to Documentation

Found something unclear or missing? We welcome contributions to improve this documentation:

1. **Quick fixes**: Edit directly via pull request
2. **New sections**: Propose via GitHub issue first
3. **Major reorganization**: Discuss in GitHub discussions

## 🔗 External Resources

- **[Next.js Documentation](https://nextjs.org/docs)** - Framework documentation
- **[shadcn/ui Components](https://ui.shadcn.com/)** - UI component library
- **[TanStack Query](https://tanstack.com/query/latest)** - Data fetching and caching
- **[Drizzle ORM](https://orm.drizzle.team/)** - Database ORM documentation

---

**Last updated**: {CURRENT_DATE}  
**Version**: v1.0.0  
**Feedback**: [GitHub Issues](https://github.com/your-org/cyberdash/issues)
