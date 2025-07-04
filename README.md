# CyberDash - Cybersecurity Metrics Dashboard

**Real-time cybersecurity intelligence dashboard** built with Next.js, displaying threat data from CISA KEV, NVD CVE, and MITRE ATT&CK.

## 📖 Documentation

Complete documentation is available in **[`/cyberDash/docs`](./cyberDash/docs)**:

- **[📋 README](./cyberDash/docs/README.md)** - Project overview and quick navigation
- **[🛠️ Setup Guide](./cyberDash/docs/SETUP.md)** - Installation and configuration
- **[📊 User Guide](./cyberDash/docs/USER-GUIDE.md)** - Dashboard usage and metrics
- **[💻 Developer Guide](./cyberDash/docs/DEVELOPER-GUIDE.md)** - Architecture and development

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/alexarciniaga/cyberDash.git
cd cyberdash && pnpm install

# Start database
docker compose up -d

# Setup and run
cd cyberDash/apps/web
pnpm db:push && pnpm dev
```

**Dashboard**: http://localhost:3000

## ⚡ What is CyberDash?

Transform **raw cybersecurity data** into **actionable intelligence**:

- **🚨 CISA KEV** - Known Exploited Vulnerabilities (actively being exploited)
- **🔒 NVD CVE** - All published vulnerabilities with severity scoring
- **⚔️ MITRE ATT&CK** - Attack techniques and tactics used by threat actors

### Key Features

- **Real-time Updates** - Auto-refreshing widgets every 60 seconds
- **Multiple Dashboards** - Create custom views for different audiences
- **Interactive Widgets** - Drag, resize, and customize your layout
- **Modern Stack** - Next.js 15, React 19, PostgreSQL, TypeScript

## 🤝 Contributing

See our **[Developer Guide](./cyberDash/docs/DEVELOPER-GUIDE.md)** for setup, architecture, and contribution guidelines.

## 🆘 Support

- **Setup Issues**: [Setup Guide](./cyberDash/docs/SETUP.md)
- **Usage Questions**: [User Guide](./cyberDash/docs/USER-GUIDE.md)
- **Bug Reports**: [Create an issue](https://github.com/your-org/cyberdash/issues)

---

**Built with ❤️ for the cybersecurity community**
