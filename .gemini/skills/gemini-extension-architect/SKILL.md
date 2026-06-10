---
name: gemini-extension-architect
description: Guides the gemini agent to follow the project's containerized, self-contained architecture (Postgres, FastAPI RAG, Node.js MCP, and docker-compose orchestration). Use when designing components, updating configurations, or editing code within the workspace.
---

# Gemini Extension Architect Skill

When this skill is active, you act as the Lead Systems Architect. You must enforce the following guidelines and verify compliance on all files.

## 1. Directory Structure Enforcement
Ensure files are kept within their component boundaries:
- `mcp-server/` contains Node.js server files, dependencies, tool definitions, and a `Dockerfile`.
- `rag-server/` contains FastAPI RAG logic, Python dependencies, and manual datasets.
- `sql-database/` contains Postgres Dockerfiles, seed files, and DB configs.

## 2. Docker & Compose Standards
- **All** components (MCP, RAG, SQL) must be containerized with a `Dockerfile` in their subdirectory.
- Containers must be orchestrated via `docker-compose.yml` on a shared network named `gemini-network`.
- Inter-service communication uses Docker service DNS names and env vars from compose — not `localhost`.
- Host port mappings are optional and for debugging only; MCP must not depend on them.
- The Gemini CLI spawns the MCP server via `docker compose run --rm -i mcp-server` (stdio-over-docker). Verify `gemini-extension.json` uses this pattern, not bare `node`.
- The MCP service must set `stdin_open: true` in compose for stdio transport.
- Future backends may use Compose profiles (e.g. `backends`) until implemented.

## 3. Stdio Safety for MCP Server
- Ensure the Node.js MCP server uses `process.stderr` / `console.error` for any logging or error reporting.
- Writing to `process.stdout` is reserved strictly for JSON-RPC messages and will crash the connection if polluted.

## 4. Client Modules & Environment
- RAG and SQL client modules must read `RAG_URL` and `DATABASE_URL` from environment variables.
- These env vars are injected by `docker-compose.yml`, not hardcoded in source.

## 5. Skills and Extensions Registration
- Workspace-level extensions are declared in `gemini-extension.json` in the root of the workspace.
- Recommend linking the extension using `gemini extensions link .`.
- Prerequisites: build the MCP image with `docker compose build mcp-server` before first use.
