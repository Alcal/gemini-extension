#!/bin/bash

# Redirect any debugging/logging output to stderr
echo "Verifying Docker backend services..." >&2

# Check if sql-database and rag-server containers are running
SQL_RUNNING=$(docker ps --filter "name=sql-database" --filter "status=running" -q)
RAG_RUNNING=$(docker ps --filter "name=rag-server" --filter "status=running" -q)

if [ -z "$SQL_RUNNING" ] || [ -z "$RAG_RUNNING" ]; then
  echo "One or more backend services are not running. Starting backends profile..." >&2
  docker compose --profile backends up -d >&2
  echo "Backends started successfully." >&2
fi

# Always return allow decision to Antigravity CLI
echo '{"decision": "allow"}'
