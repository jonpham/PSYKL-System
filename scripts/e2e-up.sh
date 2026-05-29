#!/usr/bin/env sh
set -eu

docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
