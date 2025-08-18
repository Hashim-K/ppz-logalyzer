use ppz_logalyzer_api::{db, routes, schema::SchemaManager};
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use axum::extract::DefaultBodyLimit;
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

    // Initialize schema manager
    let schema_manager = Arc::new(tokio::sync::Mutex::new(SchemaManager::new()));

    info!("Schema manager initialized");

    // Create application state
    let app_state = Arc::new(routes::AppState { 
        db: db_pool.clone(),
        schema_manager,
        // file_processor,
    });

    // Build our application with routes
    let app = routes::router()
        .layer(CorsLayer::permissive())
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024)) // 50MB limit for file uploads
        .with_state(app_state);

    // Get port from environment or default to 8080
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse()?;

    info!("PPZ-Logalyzer backend listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app)
        .await?;
    
    Ok(())
}
