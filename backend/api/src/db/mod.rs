use anyhow::Result;
use sqlx::{Pool, Postgres, Row};
use std::time::Duration;
use tracing::{info, error};

pub type DbPool = Pool<Postgres>;

pub async fn create_pool(database_url: &str) -> Result<DbPool> {
    info!("Creating database connection pool");
    
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(50)
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .connect(database_url)
        .await?;

    info!("Database connection pool created successfully");
    Ok(pool)
}

pub async fn run_migrations(pool: &DbPool) -> Result<()> {
    info!("Running database migrations");
    
    match sqlx::migrate!("./migrations").run(pool).await {
        Ok(_) => {
            info!("Database migrations completed successfully");
            Ok(())
        }
        Err(e) => {
            error!("Database migrations failed: {}", e);
            Err(anyhow::anyhow!("Migration failed: {}", e))
        }
    }
}

pub async fn check_database_connection(pool: &DbPool) -> Result<()> {
    info!("Checking database connection");
    
    let result = sqlx::query("SELECT 1 as test")
        .fetch_one(pool)
        .await?;
    
    let test_value: i32 = result.get("test");
    if test_value == 1 {
        info!("Database connection verified");
        Ok(())
    } else {
        Err(anyhow::anyhow!("Database connection check failed"))
    }
}