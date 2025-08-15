# PPZ-Logalyzer

A comprehensive web application for parsing, visualizing, and inspecting paparazziUAV flight logs.

## Project Status: 🚧 Initial Setup Phase

**Current Phase**: Foundation & Infrastructure  
**Next Milestone**: Complete Docker setup and database schema

## Quick Links

- 📋 **[Task List](./TASK_LIST.md)** - Detailed development roadmap and task tracking
- 📖 **[Product Requirements](./prd.txt)** - Complete PRD with user stories and technical specs
- 🐛 **[GitHub Issues](https://github.com/Hashim-K/ppz-logalyzer/issues)** - Active development issues and tracking

## Architecture Overview

- **Frontend**: Next.js 15 with TypeScript, Shadcn UI, and Recharts
- **Backend**: Rust with Axum framework for high-performance processing
- **Database**: SQLite (dev) / PostgreSQL (prod) with migration support
- **Infrastructure**: Docker containers with shared file systems

## Getting Started

> ⚠️ **Note**: Project is in initial setup phase. Development environment not yet ready.

1. See [TASK_LIST.md](./TASK_LIST.md) for current development status
2. Check [GitHub Issues](https://github.com/Hashim-K/ppz-logalyzer/issues) for active work
3. Review [prd.txt](./prd.txt) for complete feature specifications

## Development Progress

- [x] Project planning and PRD creation
- [x] GitHub issues and task breakdown
- [ ] Docker infrastructure setup _(Issue #1)_
- [ ] Database schema design _(Issue #3)_
- [ ] Frontend framework setup _(Issue #9)_
- [ ] Authentication system _(Issue #2)_
- [ ] File processing system _(Issues #4, #5)_
- [ ] Data visualization _(Issue #7)_

## Contributing

This project follows a structured development approach:

1. All work is tracked via GitHub issues
2. Feature branches from `main` with conventional commit format
3. Pull requests required for all changes
4. CI/CD pipeline validation before merge

See [TASK_LIST.md](./TASK_LIST.md) for detailed development guidelines.

---

**Target Users**: UAV operators, flight test engineers, and research teams using paparazziUAV systems.
