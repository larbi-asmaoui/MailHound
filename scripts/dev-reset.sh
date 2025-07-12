#!/bin/bash

echo "Stopping and removing containers, volumes, and networks..."
docker compose down --volumes --remove-orphans

echo "Removing all local images related to this project..."
docker rmi $(docker images 'emailverifier-*' -q) --force 2>/dev/null

echo "Cleaning up Docker build cache..."
docker builder prune -a --force

echo "Rebuilding all services from scratch..."
docker compose build --no-cache

echo "Starting services..."
docker compose up -d
