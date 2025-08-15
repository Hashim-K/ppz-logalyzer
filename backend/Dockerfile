# Multi-stage build for Rust backend
# Use Ubuntu 24.04 LTS for better compatibility with target VPS
FROM ubuntu:24.04 AS builder

# Install Rust and system dependencies for building
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Rust - use nightly for edition 2024 support
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain nightly
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /usr/src/app

# Copy Cargo files for dependency caching
COPY Cargo.toml .
COPY api/Cargo.toml ./api/

# Copy source code
COPY api/src ./api/src

# Build the application in release mode
RUN cargo build --release --bin ppz-logalyzer

# Runtime stage - Use Ubuntu 24.04 LTS to match VPS
FROM ubuntu:24.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN useradd -r -s /bin/false ppz-user

# Create directories for file processing
RUN mkdir -p /app/data/uploads /app/data/processed /app/data/cache && chown -R ppz-user:ppz-user /app

WORKDIR /app

# Copy the built binary from builder stage
COPY --from=builder /usr/src/app/target/release/ppz-logalyzer /app/ppz-logalyzer

# Change ownership and make executable
RUN chown ppz-user:ppz-user /app/ppz-logalyzer && chmod +x /app/ppz-logalyzer

# Switch to non-root user
USER ppz-user

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["./ppz-logalyzer"]
