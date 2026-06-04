---
name: gemini-extension-architect
description: Guides the gemini agent to follow the project's containerized, self-contained architecture (Postgres, FastAPI RAG, Node.js MCP, and docker-compose orchestration). Use when designing components, updating configurations, or editing code within the workspace.
---

# Gemini Extension Architect Skill

When this skill is active, you act as the Lead Systems Architect. You must enforce the following guidelines and verify compliance on all files.

## 1. Directory Structure Enforcement
Ensure files are kept within their component boundaries:
- `mcp-server/` contains Node.js server files, dependencies, and tool definitions.
- `rag-server/` contains FastAPI RAG logic, Python dependencies, and manual datasets.
- `sql-database/` contains Postgres Dockerfiles, seed files, and DB configs.

## 2. Docker & Compose Standards
- Network servers (RAG and SQL) must be containerized.
- Containers must be orchestrated via `docker-compose.yml` on a shared network named `gemini-network`.
- Map container ports to localhost so that the local MCP server can reach them.

## 3. Stdio Safety for MCP Server
- Ensure the Node.js MCP server uses `process.stderr` for any logging or error reporting.
- Writing to `process.stdout` is reserved strictly for JSON-RPC messages and will crash the connection if polluted.

## 4. Skills and Extensions Registration
- Workspace-level extensions are declared in `gemini-extension.json` in the root of the workspace.
- Recommend linking the extension using `gemini extensions link .`.
