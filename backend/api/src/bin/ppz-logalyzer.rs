use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::get,
};
use ppz_logalyzer_api::{db, routes};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::{info, error};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables from .env file
    dotenvy::dotenv().ok();
    
    // Initialize tracing for structured logging
    tracing_subscriber::fmt::init();

    info!("Starting PPZ-Logalyzer backend server");

    // Get database URL from environment
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://ppz_user:ppz_password@localhost:5432/ppz_logalyzer".to_string());

    // Create database connection pool
    let db_pool = match db::create_pool(&database_url).await {
        Ok(pool) => {
            info!("Database connection pool created successfully");
            pool
        }
        Err(e) => {
            error!("Failed to create database connection pool: {}", e);
            std::process::exit(1);
        }
    };

    // Check database connection
    if let Err(e) = db::check_database_connection(&db_pool).await {
        error!("Database connection check failed: {}", e);
        std::process::exit(1);
    }

    // Run database migrations
    if let Err(e) = db::run_migrations(&db_pool).await {
        error!("Database migrations failed: {}", e);
        std::process::exit(1);
    }

    // Create application state
    let app_state = Arc::new(routes::AppState { db: db_pool.clone() });

    // Build our application with routes
    let app = routes::router()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/metrics", get(metrics))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    // Get port from environment or default to 8080
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse()?;

    // Get port from environment or default to 8080
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse()?;

    info!("PPZ-Logalyzer backend listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app)
        .await?;
    
    Ok(())
}

// Basic root endpoint
async fn root() -> Json<Value> {
    Json(json!({
        "service": "ppz-logalyzer",
        "version": "0.1.0",
        "status": "running",
        "description": "PaparazziUAV Log Analyzer Backend"
    }))
}

// Health check endpoint for Docker and monitoring  
async fn health_check(State(state): State<Arc<routes::AppState>>) -> Result<Json<Value>, StatusCode> {
    // Check database connection
    let db_status = match db::check_database_connection(&state.db).await {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };
    
    let overall_status = if db_status == "healthy" { "healthy" } else { "unhealthy" };
    
    let health_status = json!({
        "status": overall_status,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        "version": "0.1.0",
        "checks": {
            "database": db_status,
            "file_system": "not_implemented", 
            "memory": "ok"
        }
    });

    if overall_status == "healthy" {
        Ok(Json(health_status))
    } else {
        Err(StatusCode::SERVICE_UNAVAILABLE)
    }
}

// Basic metrics endpoint for Prometheus monitoring
async fn metrics(State(_state): State<Arc<routes::AppState>>) -> Json<Value> {
    // TODO: Implement proper Prometheus metrics
    // For now, return basic system information
    
    let mut metrics = HashMap::new();
    metrics.insert("http_requests_total", 0);
    metrics.insert("active_sessions", 0);
    metrics.insert("files_processed", 0);
    
    Json(json!({
        "metrics": metrics,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }))
}
