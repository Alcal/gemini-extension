import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchSpecs } from "./clients/rag-client.js";
import {
  getStockAndPrice,
  listParts,
} from "./clients/sql-client.js";

const server = new McpServer({
  name: "hardware-mcp",
  version: "1.0.0",
});

server.registerTool(
  "search_specs",
  {
    description:
      "Search technical specifications and manual excerpts for automation hardware. Use when the user describes equipment informally (e.g. 'Siemens S7-1200 PLC') to find the matching part number.",
    inputSchema: {
      query: z.string().min(1).describe("Search query for hardware specs"),
    },
  },
  async ({ query }) => {
    const results = await searchSpecs(query);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  },
);

server.registerTool(
  "get_stock_and_price",
  {
    description:
      "Look up unit price, currency, stock level, and warehouse location for a specific part number.",
    inputSchema: {
      part_number: z
        .string()
        .min(1)
        .describe("Manufacturer part number (e.g. 6ES7214-1AG40-0XB0)"),
    },
  },
  async ({ part_number }) => {
    const result = await getStockAndPrice(part_number);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "list_parts",
  {
    description:
      "List the full hardware catalog with part numbers, names, prices, and stock levels.",
    inputSchema: {},
  },
  async () => {
    const result = await listParts();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("hardware-mcp server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
