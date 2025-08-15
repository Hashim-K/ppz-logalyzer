# PPZ-Logalyzer Development Environment

## Quick Start

1. **Clone and setup environment**:
   ```bash
   git clone https://github.com/Hashim-K/ppz-logalyzer.git
   cd ppz-logalyzer
   cp .env.example .env
   ```

2. **Start development environment**:
   ```bash
   docker compose up -d
   ```

3. **Access applications**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5432
   - Prometheus: http://localhost:9091
   - Grafana: http://localhost:3001 (admin/admin)

## Development Workflow

### Backend Development (Rust)

```bash
# Enter backend directory
cd backend

# Install dependencies
cargo build

# Run in development mode (outside Docker for faster iteration)
cargo run --bin ppz-logalyzer

# Run tests
cargo test

# Format code
cargo fmt

# Lint code
cargo clippy
```

### Frontend Development (Next.js)

```bash
# Enter frontend directory
cd frontend

# Install dependencies
bun install

# Run development server (outside Docker for hot reload)
bun dev

# Build for production
bun build

# Lint code
bun lint
```

## Docker Commands

### Basic Operations
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f [service_name]

# Stop all services
docker compose down

# Rebuild specific service
docker compose build [service_name]

# Restart specific service
docker compose restart [service_name]
```

### Development Mode
```bash
# Start only infrastructure (database, redis, monitoring)
docker compose up -d database redis prometheus grafana

# Run backend and frontend locally for development
cd backend && cargo run --bin ppz-logalyzer &
cd frontend && bun dev
```

## File Structure

```
ppz-logalyzer/
├── backend/                 # Rust API backend
│   ├── api/src/            # Source code
│   ├── Dockerfile          # Backend container
│   └── Cargo.toml          # Rust dependencies
├── frontend/               # Next.js frontend
│   ├── src/               # Source code
│   ├── Dockerfile         # Frontend container
│   └── package.json       # Node dependencies
├── monitoring/            # Monitoring configuration
│   ├── prometheus.yml     # Metrics collection
│   └── grafana/          # Dashboard configuration
├── database/             # Database setup
│   └── init/            # Initialization scripts
├── example_data/         # PaparazziUAV sample files
├── docker compose.yml    # Service orchestration
└── .env.example         # Environment configuration
```

## Environment Variables

### Database
- `DB_PASSWORD`: PostgreSQL password
- `DATABASE_URL`: Full database connection string

### Backend
- `RUST_LOG`: Log level (debug, info, warn, error)
- `JWT_SECRET`: Secret for JWT token generation
- `MAX_FILE_SIZE`: Maximum upload file size in bytes

### Frontend  
- `NEXT_PUBLIC_API_URL`: Backend API endpoint
- `NEXT_PUBLIC_WS_URL`: WebSocket endpoint

## Monitoring

### Prometheus Metrics
- Backend exposes metrics at `:9090/metrics`
- System metrics collected every 15 seconds
- Custom application metrics for file processing

### Grafana Dashboards
- Pre-configured Prometheus datasource
- Access at http://localhost:3001
- Default credentials: admin/admin

## Database Management

### Connection
```bash
# Connect to database
docker compose exec database psql -U ppz_user -d ppz_logalyzer

# Run migrations (when implemented)
cd backend && cargo run --bin migrate
```

### Backup/Restore
```bash
# Backup database
docker compose exec database pg_dump -U ppz_user ppz_logalyzer > backup.sql

# Restore database  
docker compose exec -T database psql -U ppz_user ppz_logalyzer < backup.sql
```

## File Processing

### Upload Directory Structure
```
uploads/           # Incoming files
├── raw/          # .log and .data file pairs
├── processing/   # Files being processed
└── failed/       # Failed processing files

processed/        # Processed data cache
├── schemas/      # Parsed XML schemas
└── parsed/       # Parsed message data

cache/           # Application cache
└── sessions/    # Session data cache
```

### File Format Support
- `.log` files: XML configuration with message definitions
- `.data` files: Timestamped flight data
- Paired file processing (same basename)
- Format validation and schema detection

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using ports
   lsof -i :3000 :8000 :5432 :6379
   
   # Stop conflicting services
   sudo service postgresql stop  # If local postgres running
   ```

2. **Permission issues**:
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER uploads/ processed/ cache/
   ```

3. **Database connection fails**:
   ```bash
   # Check database status
   docker compose logs database
   
   # Reset database
   docker compose down
   docker volume rm ppz-logalyzer_postgres_data
   docker compose up -d database
   ```

4. **Build failures**:
   ```bash
   # Clean Docker build cache
   docker system prune -f
   docker compose build --no-cache [service_name]
   ```

### Performance Optimization

1. **Development mode** (faster iteration):
   - Run services outside Docker: `cargo run` and `bun dev`
   - Use only infrastructure containers: `docker compose up -d database redis`

2. **Production mode** (full containerization):
   - Build optimized images: `docker compose build`
   - Use health checks for reliability
   - Enable monitoring for performance tracking

## Testing

### Unit Tests
```bash
# Backend tests
cd backend && cargo test

# Frontend tests (when implemented)
cd frontend && bun test
```

### Integration Tests
```bash
# Start test environment
docker compose -f docker compose.test.yml up -d

# Run integration tests
cargo test --test integration
```

### Load Testing
```bash
# Test file upload performance
# (Load testing tools to be implemented)
```

## Contributing

1. Create feature branch: `git checkout -b feature/issue-{number}-description`
2. Make changes and test locally
3. Update documentation if needed
4. Submit pull request with detailed description
5. Ensure CI/CD pipeline passes

## Next Steps

After infrastructure setup:
1. Implement database schema (Issue #3)
2. Set up frontend framework (Issue #9)
3. Add authentication system (Issue #2)
4. Implement file processing (Issues #4, #5)
