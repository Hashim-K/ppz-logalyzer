#!/bin/bash
pkill -f "ppz-logalyzer"
cd /mnt/shared/AerogridUAV/ppz-logalyzer/backend/
source ../.env
RUST_LOG=debug cargo run --bin ppz-logalyzer &