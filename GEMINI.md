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

## Placeholder Data

The RAG and SQL backends are not yet connected. All tools currently return **mock data** for four sample products:

- Siemens S7-1200 PLC (`6ES7214-1AG40-0XB0`)
- Allen-Bradley PowerFlex 525 VFD (`25B-D4P0N104`)
- Beckhoff EK1100 EtherCAT Coupler (`EK1100`)
- Keyence LR-TB2000 Distance Sensor (`LR-TB2000`)

Responses include `"backend": "mock"` to indicate placeholder data. Once the `backends` Docker Compose profile is enabled, live data will replace the mocks.
