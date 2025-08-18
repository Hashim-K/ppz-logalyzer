//! api lib — main backend logic for ppz-logalyzer

pub mod auth;
pub mod db;
pub mod models;
// pub mod processing; // File processing pipeline
pub mod routes;
pub mod schema; // Schema detection and parsing
pub mod telemetry; // placeholder for parsing, monitoring logic

pub use routes::router;
