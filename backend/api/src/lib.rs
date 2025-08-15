//! api lib — main backend logic for ppz-logalyzer

pub mod db;
pub mod models;
pub mod routes;
pub mod telemetry; // placeholder for parsing, monitoring logic

pub use routes::router;
