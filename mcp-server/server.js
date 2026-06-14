import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchSpecs } from "./clients/rag-client.js";
import {
  getStockAndPrice,
  listParts,
} from "./clients/sql-client.js";
import { askGemini } from "./geminiService.js";

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

server.registerTool(
  "ask_assistant",
  {
    description:
      "Main assistant that answers user questions using technical (RAG) and commercial (SQL) data.",
    inputSchema: {
      question: z.string().min(1).describe("User question"),
    },
  },
  async ({ question }) => {
    try {
      // 1. Obtener info técnica (RAG)
      const ragResults = await searchSpecs(question);

      // 2. Obtener info comercial (SQL)
      let sqlResults = null;

      if (ragResults?.length > 0) {
        const part = ragResults[0]?.part_number;
        if (part) {
          sqlResults = await getStockAndPrice(part);
        }
      }

      // 3. Crear contexto
      const context = `
TECHNICAL DATA:
${JSON.stringify(ragResults, null, 2)}

COMMERCIAL DATA:
${JSON.stringify(sqlResults, null, 2)}
`;

      // 4. Gemini genera respuesta
      const answer = await askGemini(question, context);

      return {
        content: [{ type: "text", text: answer }],
      };
    } catch (error) {
      console.error(error);
      return {
        content: [{ type: "text", text: "Error processing request" }],
      };
    }
  }
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
