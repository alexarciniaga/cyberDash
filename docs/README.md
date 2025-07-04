# CyberDash - Cybersecurity Metrics Dashboard

**Real-time cybersecurity intelligence dashboard** built with Next.js, displaying threat data from CISA KEV, NVD CVE, and MITRE ATT&CK.

![Dashboard Screenshot](https://via.placeholder.com/800x400/1f2937/f9fafb?text=CyberDash+Dashboard)

## 🚀 Quick Start

**Get running in 5 minutes:**

```bash
git clone https://github.com/your-org/cyberdash.git
cd cyberdash && pnpm install && docker compose up -d
cd cyberDash/apps/web && pnpm db:push && pnpm dev
```

**Dashboard**: http://localhost:3000

## 📖 Documentation

### 🛠️ **[Setup Guide](./SETUP.md)**

Complete installation and configuration guide

### ⚙️ **[Environment Setup](./ENVIRONMENT-SETUP.md)**

Environment variable configuration and best practices

### 📊 **[User Guide](./USER-GUIDE.md)**

How to use the dashboard and understand cybersecurity metrics

### 💻 **[Developer Guide](./DEVELOPER-GUIDE.md)**

Architecture, development workflow, and contribution guide

## ⚡ What is CyberDash?

CyberDash transforms **raw cybersecurity data** into **actionable intelligence** through an intuitive dashboard:

- **🚨 Threat Awareness**: CISA Known Exploited Vulnerabilities (actively being exploited)
- **🔒 Vulnerability Intelligence**: NVD CVE data with severity scoring
- **⚔️ Attack Intelligence**: MITRE ATT&CK techniques and tactics

### Key Features

- **Real-time Updates** - Auto-refreshing widgets every 60 seconds
- **Multiple Dashboards** - Create custom views for different audiences
- **Interactive Widgets** - Drag, resize, and customize your layout
- **Modern UI** - Built with Next.js 15, React 19, and shadcn/ui

## 🏗️ Technology Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript + shadcn/ui
- **Backend**: Next.js API Routes + Zod validation
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Tools**: Turbo monorepo + pnpm + Docker

## 🎯 Use Cases

### Security Operations Centers (SOCs)

- Monitor emerging threats in real-time
- Track vulnerability disclosure trends
- Assess attack technique popularity

### Security Teams

- Prioritize patching based on active exploitation
- Understand threat landscape evolution
- Report security metrics to executives

### Threat Intelligence

- Correlate vulnerability and attack data
- Identify threat actor technique preferences
- Track security community response times

## 🚦 System Status

| Component      | Status     | Notes                           |
| -------------- | ---------- | ------------------------------- |
| Frontend       | ✅ Stable  | Next.js dashboard with widgets  |
| API            | ✅ Stable  | REST endpoints for data access  |
| Database       | ✅ Stable  | PostgreSQL with Drizzle ORM     |
| Data Ingestion | ✅ Stable  | CISA KEV, NVD CVE, MITRE ATT&CK |
| Testing        | 🟡 Manual  | Automated testing planned       |
| Authentication | 🔴 Planned | Currently public access         |

## 🤝 Contributing

We welcome contributions! Please see our [Developer Guide](./DEVELOPER-GUIDE.md) for:

- Development setup
- Architecture overview
- API documentation
- Coding standards

## 🆘 Support

- **Setup Issues**: See [Setup Guide](./SETUP.md) troubleshooting section
- **Usage Questions**: Check [User Guide](./USER-GUIDE.md)
- **Bug Reports**: [Create an issue](https://github.com/your-org/cyberdash/issues)
- **Feature Requests**: [Start a discussion](https://github.com/your-org/cyberdash/discussions)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for the cybersecurity community**
