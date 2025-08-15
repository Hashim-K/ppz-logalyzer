# PPZ-Logalyzer

A comprehensive web application for parsing, visualizing, and inspecting paparazziUAV flight logs.

## Project Status: � Infrastructure & Database Complete

**Current Phase**: Core Backend Development  
**Next Milestone**: Authentication system and file processing

## Quick Links

- 📋 **[Task List](./TASK_LIST.md)** - Detailed development roadmap and task tracking
- 📖 **[Product Requirements](./prd.txt)** - Complete PRD with user stories and technical specs
- 🐛 **[GitHub Issues](https://github.com/Hashim-K/ppz-logalyzer/issues)** - Active development issues and tracking

## Architecture Overview

- **Frontend**: Next.js 15 with TypeScript, Shadcn UI, and Recharts
- **Backend**: Rust with Axum framework for high-performance processing
- **Database**: PostgreSQL 16 with comprehensive schema and migration support
- **Infrastructure**: Docker containers with shared file systems, monitoring, and logging

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Hashim-K/ppz-logalyzer.git
   cd ppz-logalyzer
   ```

2. **Start the application**:
   ```bash
   docker compose up -d
   ```

3. **Access the services**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Grafana Monitoring: http://localhost:3001
   - Prometheus Metrics: http://localhost:9091

4. **View logs**:
   ```bash
   docker compose logs -f backend
   ```

## Development Progress

- [x] Project planning and PRD creation
- [x] GitHub issues and task breakdown
- [x] **Docker infrastructure setup** _(Issue #1 - COMPLETE)_
- [x] **Database schema design** _(Issue #3 - COMPLETE)_
  - User authentication and session management
  - PaparazziUAV log file tracking with metadata
  - Analysis framework with templates and sessions
  - Performance monitoring and audit logging
  - Comprehensive indexing and optimization
- [ ] Frontend framework setup _(Issue #9)_
- [ ] Authentication system _(Issue #2)_
- [ ] File processing system _(Issues #4, #5)_
- [ ] Data visualization _(Issue #7)_

## Database Schema

The application includes a comprehensive PostgreSQL schema with:

- **User Management**: Secure user accounts, sessions, and preferences
- **File Processing**: PaparazziUAV log file tracking with hash-based deduplication
- **Analysis Framework**: Templates, sessions, and report management
- **Monitoring**: Performance metrics and audit logging
- **Optimization**: Full-text search indexes and query optimization

All database changes are managed through SQLx migrations for consistent deployment.

## Contributing

This project follows a structured development approach:

1. All work is tracked via GitHub issues
2. Feature branches from `main` with conventional commit format
3. Pull requests required for all changes
4. CI/CD pipeline validation before merge

See [TASK_LIST.md](./TASK_LIST.md) for detailed development guidelines.

---

**Target Users**: UAV operators, flight test engineers, and research teams using paparazziUAV systems.
