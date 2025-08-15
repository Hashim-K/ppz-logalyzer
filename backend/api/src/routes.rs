use axum::{routing::get, Router};

async fn healthz() -> &'static str {
    "ok"
}

/// Build the application router.
/// Add routes for logs, sessions, WS connections, etc.
pub fn router() -> Router {
    Router::new().route("/healthz", get(healthz))
}
