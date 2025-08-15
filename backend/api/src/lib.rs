//! api lib — main backend logic for ppz-logalyzer

pub mod db;
pub mod routes;
pub mod telemetry; // placeholder for parsing, monitoring logic // placeholder for DB access layer

pub use routes::router;
