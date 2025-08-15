# PPZ-Logalyzer Development Guide

## Quick Start for Ubuntu 24.04.2 LTS

This project is optimized for Ubuntu 24.04.2 LTS VPS deployment and uses Docker containers instead of nginx.

### Prerequisites

- Docker and Docker Compose
- Git
- Text editor (VS Code recommended)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Hashim-K/ppz-logalyzer.git
cd ppz-logalyzer

# Copy development environment
cp .env.production .env.development

# Start development environment
docker compose -f docker-compose.yml up -d

# View logs
docker compose logs -f
```

### Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/health
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Prometheus**: http://localhost:9091
- **Grafana**: http://localhost:3001

### Project Structure

```
ppz-logalyzer/
├── backend/                 # Rust backend (Axum framework)
│   ├── Dockerfile          # Ubuntu 24.04-optimized container
│   ├── Cargo.toml          # Workspace configuration
│   └── api/
│       ├── Cargo.toml      # Backend dependencies
│       └── src/
│           ├── bin/
│           │   └── ppz-logalyzer.rs  # Main application
│           ├── db/         # Database models and migrations
│           ├── routes.rs   # API route definitions
│           └── lib.rs      # Library code
├── frontend/               # Next.js 15 frontend
│   ├── Dockerfile          # Ubuntu 24.04-optimized container
│   ├── package.json
│   └── src/
├── docker-compose.yml      # Optimized for Plesk deployment
├── .env.production        # Production environment template
├── example_data/          # PaparazziUAV sample files
│   ├── 25_07_09__15_38_54.log   # XML schema definitions
│   └── 25_07_09__15_38_54.data  # Timestamped log data
├── TASK_LIST.md           # Development roadmap
├── DEPLOYMENT.md          # Ubuntu 24.04.2 LTS deployment guide
└── README.md
```

### Key Technologies

- **Backend**: Rust + Axum + PostgreSQL + Redis
- **Frontend**: Next.js 15 + TypeScript + Shadcn UI
- **Infrastructure**: Docker + Docker Compose (no nginx needed)
- **Monitoring**: Prometheus + Grafana
- **Target**: Ubuntu 24.04.2 LTS with Plesk proxy rules

### Development Workflow

#### Backend Development

```bash
# Enter backend container
docker compose exec backend /bin/bash

# Run tests
cargo test

# Check formatting
cargo fmt --check

# Run clippy lints
cargo clippy

# Build release version
cargo build --release
```

#### Frontend Development

```bash
# Enter frontend container  
docker compose exec frontend /bin/bash

# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

#### Database Operations

```bash
# Access PostgreSQL
docker compose exec database psql -U ppz_user -d ppz_logalyzer

# View tables
\dt

# Reset database (development only!)
docker compose down -v
docker compose up -d database
```

### File Processing Development

The system processes PaparazziUAV file pairs:

#### File Format Understanding

**`.log` files** (XML schema):
```xml
<protocol>
  <msg_class NAME="telemetry" ID="1">
    <message NAME="AUTOPILOT_VERSION" ID="1">
      <field TYPE="uint32" NAME="version">description</field>
    </message>
  </msg_class>
</protocol>
```

**`.data` files** (timestamped data):
```
36.642 38 EFF_MAT_STAB 0.,-0.008314,0.,0.008314...
36.643 38 EFF_MAT_GUID -0.,-9.809985,-0.,1...
```

Format: `{timestamp} {aircraft_id} {message_name} {comma_separated_values}`

#### Test with Example Data

```bash
# Copy example files to uploads directory
docker compose exec backend cp -r /app/example_data/* /app/uploads/

# Test file processing via API
curl -X POST http://localhost:8000/api/files/process \
  -H "Content-Type: application/json" \
  -d '{"log_file": "25_07_09__15_38_54.log", "data_file": "25_07_09__15_38_54.data"}'
```

### Debugging

#### Container Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database
```

#### Performance Monitoring

```bash
# Container resource usage
docker stats

# Database queries
docker compose exec database psql -U ppz_user -d ppz_logalyzer -c "SELECT * FROM pg_stat_activity;"
```

#### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Database health
curl http://localhost:8000/api/db/health

# Frontend health
curl http://localhost:3000/
```

### Testing

#### Unit Tests

```bash
# Backend tests
docker compose exec backend cargo test

# Frontend tests
docker compose exec frontend npm test
```

#### Integration Tests

```bash
# Test file upload and processing
curl -X POST http://localhost:8000/api/upload \
  -F "log_file=@example_data/25_07_09__15_38_54.log" \
  -F "data_file=@example_data/25_07_09__15_38_54.data"

# Test data retrieval
curl http://localhost:8000/api/sessions
```

### Code Quality

#### Rust (Backend)

```bash
# Format code
cargo fmt

# Lint code
cargo clippy -- -D warnings

# Check dependencies
cargo audit
```

#### TypeScript (Frontend)

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Environment Variables

Key development environment variables in `.env.development`:

```env
# Database
DB_PASSWORD=dev_password

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Debugging
RUST_LOG=debug
NODE_ENV=development

# File processing
MAX_FILE_SIZE=104857600  # 100MB
UPLOAD_TIMEOUT=300       # 5 minutes
```

### Troubleshooting

#### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, 5432, 6379, 9090, 9091 are available
2. **File permissions**: Docker containers run as non-root users
3. **Memory usage**: Adjust Docker resource limits if needed
4. **Database connection**: Ensure database service is healthy before backend starts

#### Reset Development Environment

```bash
# Complete reset (removes all data!)
docker compose down -v
docker system prune -f
docker compose up -d

# Partial reset (keep database)
docker compose restart backend frontend
```

### Contributing

1. Create feature branch: `git checkout -b feature/issue-{number}`
2. Make changes following code standards
3. Test thoroughly with example data
4. Update documentation if needed
5. Create pull request with detailed description

### Next Steps

See [TASK_LIST.md](./TASK_LIST.md) for current development priorities and [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment on Ubuntu 24.04.2 LTS.
