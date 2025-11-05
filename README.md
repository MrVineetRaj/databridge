# 🌉 DataBridge

### Enterprise-Grade PostgreSQL Database Management Platform

> **Simplifying database management for developers with instant provisioning, enterprise security, and powerful management tools.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 🎬 Demo Video

> **[📺 Watch DataBridge in Action](placeholder-for-demo-video)**
>
> _See how easy it is to create, secure, and manage PostgreSQL databases with DataBridge's intuitive interface and powerful security features._

---

## 🏗️ Architecture Overview

> Yet to be added


---

## 📸 Screenshots

### 🏠 Home Page

![DataBridge Homepage](placeholder-homepage-screenshot.png)
_Modern landing page showcasing platform features and security capabilities_

### 📊 Dashboard

![Project Dashboard](placeholder-dashboard-screenshot.png)
_Comprehensive project management with real-time analytics and monitoring_

### 🔧 Database Management

![Database Tables](placeholder-tables-screenshot.png)
_Intuitive SQL query interface with data browsing and editing capabilities_

### 🔒 Security Configuration

![IP Firewall Settings](placeholder-security-screenshot.png)
_Enterprise-grade IP firewall configuration and access control_

---

## ✨ Key Features

### 🚀 **Instant Database Provisioning**

- **One-Click Creation**: Spin up PostgreSQL databases in seconds
- **Auto-Generated Credentials**: Secure, unique credentials for each database
- **Isolated Environments**: Each project gets its own dedicated database cluster

### 🛡️ **Enterprise Security**

- **IP Firewall Protection**: Configure network access rules with IP whitelisting
- **PostgreSQL Native Security**: Direct integration with `pg_hba.conf` for maximum security
- **GitHub OAuth**: Secure authentication with industry-standard OAuth

### 🔄 **Automated Backup & Recovery**

- **Weekly Automated Backups**: Scheduled backups with 30-day retention
- **One-Click Restore**: Download and restore from any backup point
- **Point-in-Time Recovery**: Restore your database to any previous state

### 📊 **Advanced Database Management**

- **Visual Query Interface**: Execute SQL queries with syntax highlighting
- **Table Browser**: Browse, edit, and manage your data directly
- **Multi-Row Operations**: Bulk insert, update, and delete operations
- **Real-Time Analytics**: Monitor query performance and database metrics

### 🔧 **Lifecycle Management**

- **Pause/Resume Databases**: Save resources when databases aren't needed
- **Credential Rotation**: Automated password rotation for enhanced security
- **Resource Monitoring**: Track storage usage and connection metrics

### 🔗 **Integrations & Monitoring**

- **Discord Notifications**: Get alerts about database events
- **Prometheus Metrics**: Comprehensive performance monitoring
- **Grafana Dashboards**: Visual analytics and alerting
- **Loki Logging**: Centralized log management and analysis

---

## 🛠️ Technology Stack

### **Frontend**

- **React Router 7** - Modern React framework with SSR
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **Shadcn/UI** - Beautiful, accessible components
- **Lucide React** - Consistent iconography

### **Backend**

- **Express.js** - Fast, unopinionated web framework
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Robust, ACID-compliant database
- **Docker** - Containerized deployment

### **DevOps & Monitoring**

- **Docker Compose** - Multi-container orchestration
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboards
- **Loki** - Log aggregation system
- **Redis** - Caching and session management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Docker & Docker Compose**
- **PostgreSQL** (if running locally)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/DataBridge.git
cd DataBridge
```

### 2. Set Up Environment Variables

**Server Configuration** (`.env` in `/server`):

```env
# Utility
PORT="8080"
BASE_URL="http://localhost:8080"
NODE_ENV="development"
VALID_ORIGINS="semi colon seperated values"
FRONTEND_URL=""
ENCRYPTION_KEY=""
PRIVATE_IP=""

# Data
DATABASE_URL=""

DATABASE_ADMIN_USER=""
DATABASE_ADMIN_PASSWORD=""
DATABASE_HOST="localhost:5432"
DATABASE_PORT="5432"



# Github OAuth
GITHUB_CLIENT_ID="" 
GITHUB_CLIENT_SECRET="" 

# Session Managemenet
SESSION_SECRET=""

# cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""


#Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

#Discord
DISCORD_BOT_INSTALLATION_URL=""
DISCORD_BOT_LOGIN_TOKEN=""


# email 
MAIL_TRAP_HOST=""
MAIL_TRAP_PORT=""
MAIL_TRAP_USERNAME=""
MAIL_TRAP_PASSWORD=""


# Monitoring
GRAFANA_USERNAME=""
GRAFANA_PASSWORD=""
```

**Client Configuration** (`.env` in `/client`):

```env
VITE_API_URL="http://localhost:8080"
VITE_BASE_URL="http://localhost:5173"
VITE_DISCORD_BOT_INSTALLATION_URL=""
```

### 3. Start the Infrastructure

```bash
# Start PostgreSQL, Redis, Prometheus, Grafana, Loki
cd server
docker compose up -d

# Verify services are running
docker compose ps
```

### 4. Set Up the Database

```bash
# Install dependencies and run migrations
cd server
npm install
npx prisma migrate dev
npx prisma generate
```

### 5. Start the Backend

```bash
# From /server directory
npm run dev
```

### 6. Start the Frontend

```bash
# From /client directory
cd ../client
npm install
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Grafana Dashboard**: http://localhost:3000
- **Prometheus**: http://localhost:9090


---

## 🔧 Configuration

### Database Security (pg_hba.conf)

Configure network access rules for your PostgreSQL instances:

```conf
# Allow local connections
local all all trust
host all all 127.0.0.1/32 trust

# Whitelist specific networks
host all all 192.168.1.0/24 md5
host all all 10.0.0.0/8 scram-sha-256

# Block all others by default
```

### Docker Services

The platform includes several monitoring and infrastructure services:

- **PostgreSQL**: Primary database cluster
- **Redis**: Caching and session storage
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Loki**: Log aggregation

---
## 🚢 Deployment


## 🤝 Contributing

Contributions are welcome!

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript** for all new code
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Jest** for testing

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---


<div align="center">

### 🌟 Star this repository if you found it helpful!

**Built with ❤️ by developers, for developers**

[🚀 Get Started](https://databridge.unknownbug.tech) 

---

_DataBridge - Where Database Management Meets Simplicity_ 🌉

</div>
