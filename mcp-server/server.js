import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { searchSpecs } from "./clients/rag-client.js";
import {
  getStockAndPrice,
  listParts,
} from "./clients/sql-client.js";

import { askGemini } from "./geminiService.js";

// ✅ IMPORTANTE (esto faltaba)
const server = new McpServer({
  name: "hardware-mcp",
  version: "1.0.0",
});

// 🔹 RAG
server.registerTool(
  "search_specs",
  {
    description: "Search technical specifications",
    inputSchema: {
      query: z.string().min(1),
    },
  },
  async ({ query }) => {
    const results = await searchSpecs(query);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

// 🔹 SQL
server.registerTool(
  "get_stock_and_price",
  {
    description: "Get price and stock",
    inputSchema: {
      part_number: z.string().min(1),
    },
  },
  async ({ part_number }) => {
    const result = await getStockAndPrice(part_number);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// 🔹 LIST
server.registerTool(
  "list_parts",
  {
    description: "List parts",
    inputSchema: {},
  },
  async () => {
    const result = await listParts();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// 🔥 ASSISTANT (TU PARTE)
server.registerTool(
  "ask_assistant",
  {
    description: "Main assistant",
    inputSchema: {
      question: z.string(),
    },
  },
  async ({ question }) => {
    try {
      console.error("👉 Pregunta:", question);

      const ragResults = await searchSpecs(question);

      let sqlResults = null;
      if (ragResults?.length > 0) {
        const part = ragResults[0]?.part_number;
        if (part) {
          sqlResults = await getStockAndPrice(part);
        }
      }

      const context = `
TECH:
${JSON.stringify(ragResults)}

SQL:
${JSON.stringify(sqlResults)}
`;

      console.error("⏳ Gemini...");

      const answer = await askGemini(question, context);

      console.error("✅ Respuesta lista");

      return {
        content: [{ type: "text", text: answer }],
      };

    } catch (error) {
      console.error("❌ Error:", error);
      return {
        content: [{ type: "text", text: "Error processing request" }],
      };
    }
  }
);

// ✅ INICIO
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("hardware-mcp server running on stdio");
}

main().catch(console.error);
