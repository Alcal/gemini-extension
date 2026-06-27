# Hardware Specs & Inventory Extension

This extension provides tools for looking up automation hardware specifications and inventory data.

## Available Tools

- **`search_specs`** — Search technical specifications and manual excerpts. Use this first when the user describes hardware informally (e.g. "Siemens S7-1200 PLC" or "Allen-Bradley VFD").
- **`get_stock_and_price`** — Look up unit price, currency, stock level, and warehouse shelf for a specific part number.
- **`list_parts`** — List the full hardware catalog with part numbers, names, prices, and stock levels.

## Query Chaining Workflow

When a user asks about stock or pricing using an informal product description:

1. Call `search_specs` with the user's description to find matching part numbers.
2. Extract the best-matching part number from the results.
3. Call `get_stock_and_price` with that part number to return price and inventory.

When a user asks for a catalog overview or "what do you have in stock", use `list_parts`.

## Data Sources

The tools are backed by live services (start them with the `backends` Compose profile):

- **`search_specs`** queries a RAG server over a curated sample of Bosch Rexroth **ctrlX** manuals and an error-code catalog. It returns `backend: "rag"` with scored excerpts, or an empty `results` list when nothing is relevant — in that case, tell the user you don't have that information instead of guessing.
- **`get_stock_and_price`** and **`list_parts`** query a PostgreSQL catalog (`backend: "sql"`) of real ctrlX products. A part number can be either a commercial **typecode** (e.g. `COREX-C-X3-11-ANNN-21.01-VSRS-NN-NN`) or a **material number** (e.g. `R914518354`).

Prices are list values (column YGDC, in EUR). Inventory levels are sample data.
